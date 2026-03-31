"""
nlp_scorer.py — Dense Semantic Embedding + Hungarian Algorithm Matching

Pipeline layers:
  Layer 3: Encode entity strings → 384-dim dense vectors (MiniLM sentence-transformers)
  Layer 4a: Cosine similarity matrix between JD and resume entity vectors
  Layer 4b: Hungarian algorithm (optimal bipartite matching) for best alignment
  Layer 4c: Keyword gap metric computation using raw frequency data

MiniLM (all-MiniLM-L6-v2) produces semantically-aware embeddings, meaning:
  - "Python" and "Django framework" will score high similarity
  - "Python" and "Kubernetes" will score low similarity
  This is fundamentally different from TF-IDF term frequency matching.
"""

import logging
import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity as sklearn_cosine
from scipy.optimize import linear_sum_assignment

logger = logging.getLogger("vibeonjob.services.nlp_scorer")

# ── Model Initialisation ─────────────────────────────────────────────────────
MODEL_NAME = "all-MiniLM-L6-v2"
logger.info(f"Loading sentence-transformers model: {MODEL_NAME} (384-dim dense embeddings)...")
embedding_model = SentenceTransformer(MODEL_NAME)
logger.info(
    f"Model '{MODEL_NAME}' loaded successfully. "
    f"Device: {embedding_model.device}. Output dimensionality: 384"
)


def embed_entities(entities: list) -> np.ndarray:
    """
    Layer 3: Encode a list of entity strings into 384-dimensional dense vectors.

    Uses all-MiniLM-L6-v2, a distilled sentence-transformer that captures
    semantic meaning — 'machine learning' and 'ML models' will be close in
    vector space even without lexical overlap.

    Args:
        entities: list of skill/concept strings

    Returns:
        np.ndarray of shape (len(entities), 384)
    """
    if not entities:
        logger.warning("embed_entities called with empty list — returning empty array")
        return np.array([])

    logger.info(f"Encoding {len(entities)} entities into 384-dim vectors via {MODEL_NAME}")
    embeddings = embedding_model.encode(entities, convert_to_numpy=True, show_progress_bar=False)
    logger.info(
        f"Embedding complete: matrix shape={embeddings.shape}, "
        f"dtype={embeddings.dtype}, "
        f"vector norm range=[{np.linalg.norm(embeddings, axis=1).min():.4f}, "
        f"{np.linalg.norm(embeddings, axis=1).max():.4f}]"
    )
    return embeddings


def compute_similarity_matrix(jd_vectors: np.ndarray, resume_vectors: np.ndarray) -> np.ndarray:
    """
    Layer 4a: Compute full cosine similarity matrix between JD and resume entity vectors.

    Returns matrix of shape (n_jd_entities, n_resume_entities) where each cell
    value is the cosine similarity (0.0–1.0) between the i-th JD skill and
    j-th resume skill in vector space.

    Args:
        jd_vectors: shape (n, 384)
        resume_vectors: shape (m, 384)

    Returns:
        np.ndarray of shape (n, m)
    """
    if jd_vectors.size == 0 or resume_vectors.size == 0:
        logger.warning(
            "compute_similarity_matrix: one or both inputs are empty "
            f"(jd={jd_vectors.shape}, resume={resume_vectors.shape}) "
            "— returning empty matrix"
        )
        return np.array([])

    logger.info(
        f"Computing cosine similarity matrix: "
        f"{jd_vectors.shape[0]} JD skills × {resume_vectors.shape[0]} resume skills"
    )
    sim_matrix = sklearn_cosine(jd_vectors, resume_vectors)

    logger.info(
        f"Similarity matrix computed: shape={sim_matrix.shape}, "
        f"mean={sim_matrix.mean():.4f}, "
        f"max={sim_matrix.max():.4f}, "
        f"min={sim_matrix.min():.4f}"
    )
    return sim_matrix


def compute_match_score(
    sim_matrix: np.ndarray,
    jd_entities: list,
    resume_entities: list,
    match_threshold: float = 0.45,
) -> dict:
    """
    Layer 4b: Hungarian algorithm optimal bipartite matching.

    The Hungarian algorithm finds the assignment of resume skills to JD skills
    that maximises TOTAL similarity across all pairings. This is fundamentally
    different from greedy nearest-neighbor matching — it handles the global
    optimum, not local maxima.

    Args:
        sim_matrix: cosine similarity matrix (n_jd × n_resume)
        jd_entities: list of JD skill strings
        resume_entities: list of resume skill strings
        match_threshold: minimum cosine similarity to count as a valid match (default 0.45)

    Returns:
        dict with:
          - match_score: float 0-100 (% of JD requirements matched)
          - matched_skills: list of {jd_skill, resume_skill, similarity, similarity_pct}
          - missing_skills: list of JD skills with no match above threshold
          - coverage_detail: per-skill detail dict for logging/debugging
    """
    if sim_matrix.size == 0 or not jd_entities:
        logger.warning(
            "compute_match_score: empty inputs "
            f"(matrix size={sim_matrix.size}, jd_entities={len(jd_entities)})"
        )
        return {
            "match_score": 0.0,
            "matched_skills": [],
            "missing_skills": jd_entities[:] if jd_entities else [],
            "coverage_detail": {},
        }

    n_jd = len(jd_entities)
    n_resume = len(resume_entities) if resume_entities else 0
    logger.info(
        f"Running Hungarian algorithm: {n_jd} JD skills × {n_resume} resume skills, "
        f"threshold={match_threshold}"
    )

    # Hungarian algo minimises cost → use (1 - similarity) as cost
    cost_matrix = 1.0 - sim_matrix
    row_indices, col_indices = linear_sum_assignment(cost_matrix)
    logger.debug(
        f"Hungarian assignment found {len(row_indices)} pairs "
        f"(before threshold filtering)"
    )

    matched_skills = []
    matched_jd_indices = set()
    coverage_detail = {}

    for row_idx, col_idx in zip(row_indices, col_indices):
        similarity = float(sim_matrix[row_idx, col_idx])
        similarity_pct = round(similarity * 100, 1)
        jd_skill = jd_entities[row_idx]
        resume_skill = resume_entities[col_idx]

        coverage_detail[jd_skill] = {
            "best_resume_match": resume_skill,
            "similarity": round(similarity, 4),
            "similarity_pct": similarity_pct,
            "above_threshold": similarity >= match_threshold,
        }

        if similarity >= match_threshold:
            matched_skills.append({
                "jd_skill": jd_skill,
                "resume_skill": resume_skill,
                "similarity": round(similarity, 4),
                "similarity_pct": similarity_pct,
            })
            matched_jd_indices.add(row_idx)
            logger.debug(
                f"  MATCHED: '{jd_skill}' ↔ '{resume_skill}' "
                f"(similarity={similarity_pct}%)"
            )
        else:
            logger.debug(
                f"  BELOW THRESHOLD: '{jd_skill}' best candidate '{resume_skill}' "
                f"({similarity_pct}% < {match_threshold*100:.0f}% threshold)"
            )

    # Missing skills = every JD skill that had no match above threshold
    missing_skills = [
        jd_entities[i]
        for i in range(n_jd)
        if i not in matched_jd_indices
    ]

    match_score = round((len(matched_skills) / n_jd) * 100, 2) if n_jd > 0 else 0.0

    logger.info(
        f"Hungarian matching complete: "
        f"{len(matched_skills)}/{n_jd} JD skills matched = {match_score}%, "
        f"{len(missing_skills)} missing skills"
    )
    logger.debug(f"Missing skills: {missing_skills}")

    return {
        "match_score": match_score,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "coverage_detail": coverage_detail,
    }
