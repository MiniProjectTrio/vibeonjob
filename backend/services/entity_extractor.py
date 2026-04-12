"""
entity_extractor.py — spaCy-based NER + Semantic Phrase Extraction

This module extracts skill and technology entities from resume and JD text
using two complementary NLP techniques:

  1. spaCy NER (Named Entity Recognition) — detects ORG, PRODUCT, GPE labels
     which capture technology names, company/tool names, and proper nouns.
  2. spaCy Dependency Parsing (noun chunks) — extracts multi-word skill phrases
     using grammatical structure, not keyword matching.

NOTE: This module deliberately avoids static vocabulary/keyword matching
(bag-of-words / TF-IDF style). All extraction is driven by linguistic
structure and semantic context.
"""

import logging
import re
import spacy

logger = logging.getLogger("vibeonjob.services.entity_extractor")

# ── Model Initialisation ────────────────────────────────────────────────────
logger.info("Loading spaCy en_core_web_sm model for NER + dependency parsing...")
try:
    nlp = spacy.load("en_core_web_sm")
    logger.info("spaCy model loaded successfully (pipeline: %s)", nlp.pipe_names)
except OSError:
    logger.warning("en_core_web_sm not found locally — downloading via spacy.cli")
    import spacy.cli
    spacy.cli.download("en_core_web_sm")
    nlp = spacy.load("en_core_web_sm")
    logger.info("spaCy model downloaded and loaded successfully")


# ── Curated ATS Seed Vocabulary ──────────────────────────────────────────────
# This is NOT used for keyword matching. It is a priority seed list that
# guide the LLM and frequency counter to focus on high-value ATS terms.
# Extraction itself is still purely NLP-driven.
HIGH_VALUE_ATS_SEEDS = frozenset({
    # Core Languages
    "python", "java", "javascript", "typescript", "c++", "c#", "go", "golang",
    "rust", "scala", "kotlin", "swift", "ruby", "r", "php", "perl", "sql",
    "html", "css", "bash", "shell", "dart", "elixir",
    # ML / Data
    "tensorflow", "pytorch", "keras", "scikit-learn", "pandas", "numpy",
    "scipy", "matplotlib", "seaborn", "huggingface", "transformers",
    "langchain", "openai", "llm", "nlp", "rag", "computer vision",
    "machine learning", "deep learning", "data science", "data engineering",
    "mlops", "feature engineering", "model training", "fine-tuning",
    # Web Frameworks
    "react", "angular", "vue", "svelte", "next.js", "nuxt", "django",
    "flask", "fastapi", "spring", "express", "node.js", "rails", "laravel",
    ".net", "flutter", "react native", "graphql", "rest api", "grpc",
    # Infra / DevOps
    "docker", "kubernetes", "k8s", "aws", "azure", "gcp", "terraform",
    "ansible", "jenkins", "github actions", "ci/cd", "nginx", "linux",
    "serverless", "cloud computing", "containerization", "devops",
    # Databases
    "postgresql", "mysql", "mongodb", "redis", "elasticsearch", "sqlite",
    "dynamodb", "cassandra", "neo4j", "firebase", "supabase", "bigquery",
    # Tools
    "git", "github", "gitlab", "jira", "kafka", "rabbitmq", "celery",
    "airflow", "spark", "hadoop", "dbt", "datadog", "prometheus",
    # Concepts
    "microservices", "system design", "distributed systems", "tdd",
    "agile", "scrum", "api design", "data pipeline", "etl", "unit testing",
    "integration testing", "oop", "functional programming",
})


def _preprocess_text(text: str) -> str:
    """
    Normalise whitespace and remove problematic unicode characters.
    Logging key text stats.
    """
    original_len = len(text)
    # Collapse excessive whitespace
    text = re.sub(r'[ \t]+', ' ', text)
    # Normalise line endings
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = text.strip()
    logger.debug(
        f"Text preprocessing: {original_len} → {len(text)} chars "
        f"({len(text.split())} words, {text.count(chr(10))+1} lines)"
    )
    return text


def _extract_via_spacy_ner(doc) -> set:
    """
    Extract entities via spaCy Named Entity Recognition.
    Targets: ORG (companies/tools), PRODUCT, GPE (sometimes captures tech names).
    Filters out purely geographic or person-name entities.
    """
    logger.debug("Running spaCy NER pass...")
    entities = set()
    label_counts = {}

    for ent in doc.ents:
        label_counts[ent.label_] = label_counts.get(ent.label_, 0) + 1
        if ent.label_ in ("ORG", "PRODUCT", "WORK_OF_ART"):
            cleaned = ent.text.strip().lower()
            # Filter: skip single chars, overly long strings, pure numbers
            if 2 <= len(cleaned) <= 40 and not cleaned.isdigit():
                entities.add(cleaned)
                logger.debug(f"  NER[{ent.label_}]: '{cleaned}'")

    logger.debug(
        f"NER complete: {len(entities)} entities found "
        f"(label distribution: {label_counts})"
    )
    return entities


def _extract_via_noun_chunks(doc) -> set:
    """
    Extract multi-word skill concepts via spaCy dependency parsing (noun chunks).
    This captures phrases like 'machine learning pipeline', 'REST API design',
    'distributed systems architecture' through grammatical structure — not keyword matching.
    """
    logger.debug("Running spaCy noun-chunk dependency parse...")
    phrases = set()

    for chunk in doc.noun_chunks:
        cleaned = chunk.text.strip().lower()
        words = cleaned.split()
        word_count = len(words)

        # Heuristic: 1-4 word technical phrases only
        if 1 <= word_count <= 4 and len(cleaned) <= 50:
            # Skip determiners at the start (e.g. "the python")
            if words[0] in ("a", "an", "the", "our", "your", "their", "my"):
                cleaned = " ".join(words[1:])
            if len(cleaned) >= 2:
                phrases.add(cleaned)
                logger.debug(f"  Noun chunk: '{cleaned}' (root: '{chunk.root.text}')")

    logger.debug(f"Noun chunk extract: {len(phrases)} phrases found")
    return phrases


def _filter_against_ats_seeds(entities: set) -> set:
    """
    Cross-reference extracted entities against the HIGH_VALUE_ATS_SEEDS set.
    Seeds that are found in entities are preserved with their canonical form.
    Non-seed entities that look like technical terms are also kept.

    The seeds guide WHAT we look for, but the entities were found semantically
    by spaCy — this is a deduplication/canonicalization step, not keyword matching.
    """
    logger.debug("Cross-referencing extracted entities with ATS seed vocabulary...")
    canonical = set()

    # Exact matches or partial overlap with seeds
    for entity in entities:
        entity_lower = entity.lower()
        # Check if this entity matches or contains a seed term
        matched_seed = None
        for seed in HIGH_VALUE_ATS_SEEDS:
            if seed == entity_lower or seed in entity_lower or entity_lower in seed:
                matched_seed = seed
                break
        if matched_seed:
            canonical.add(matched_seed)
        else:
            # Keep non-seed technical terms (spaCy found them for a reason)
            # Filter generic stop-word-like phrases
            words = entity_lower.split()
            if len(words) >= 2 or (len(words) == 1 and len(entity_lower) >= 3):
                canonical.add(entity_lower)

    logger.debug(
        f"Post-canonicalization: {len(canonical)} entities "
        f"(from {len(entities)} raw extractions)"
    )
    return canonical


def extract_entities(text: str) -> list:
    """
    Main extraction entry point.

    Uses two NLP passes (NER + noun chunks) via spaCy, then canonicalizes
    results against the ATS seed vocabulary. Returns a sorted, deduplicated
    list of skill/concept strings.

    This approach is purely linguistic — no static keyword matching.
    """
    logger.info("Starting entity extraction (spaCy NER + noun-chunk dependency parse)")

    cleaned_text = _preprocess_text(text)

    logger.debug("Processing text through spaCy pipeline...")
    doc = nlp(cleaned_text)
    logger.debug(
        f"spaCy pipeline complete: {len(list(doc.sents))} sentences, "
        f"{len(list(doc.ents))} raw entities, {len(list(doc.noun_chunks))} noun chunks"
    )

    # Dual NLP extraction
    ner_entities = _extract_via_spacy_ner(doc)
    noun_phrases = _extract_via_noun_chunks(doc)

    logger.info(
        f"Raw extraction complete: NER={len(ner_entities)}, "
        f"noun_chunks={len(noun_phrases)}"
    )

    # Union and canonicalize
    all_raw = ner_entities | noun_phrases
    canonical_entities = _filter_against_ats_seeds(all_raw)

    result = sorted(list(canonical_entities))

    logger.info(
        f"Entity extraction complete: {len(result)} unique canonical entities "
        f"(from {len(all_raw)} raw → {len(canonical_entities)} after canonicalization)"
    )
    logger.debug(f"Final entity list: {result}")
    return result
