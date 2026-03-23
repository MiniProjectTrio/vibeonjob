import logging
import spacy
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import re

logger = logging.getLogger("vibeonjob.services.nlp_scorer")

logger.info("Loading spaCy en_core_web_sm model...")
try:
    nlp = spacy.load("en_core_web_sm")
    logger.debug("Successfully loaded spaCy model")
except OSError:
    logger.warning("en_core_web_sm model not found. Downloading...")
    import spacy.cli
    spacy.cli.download("en_core_web_sm")
    nlp = spacy.load("en_core_web_sm")
    logger.info("Finished downloading and loading spaCy model")

def clean_text(text: str) -> str:
    """Basic cleaning to remove extra whitespace and special chars."""
    text = text.lower()
    text = re.sub(r'[^a-z0-9\s]', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def extract_keywords(text: str) -> list:
    """Extract noun chunks and entities as keywords using spaCy."""
    logger.debug("Extracting keywords using spaCy NER and noun clustering")
    doc = nlp(text)
    keywords = set()
    for chunk in doc.noun_chunks:
        if len(chunk.text.split()) < 4:
            keywords.add(chunk.text.lower())
    for ent in doc.ents:
        if ent.label_ in ["ORG", "PRODUCT", "SKILL", "LANGUAGE"]:
            keywords.add(ent.text.lower())
    logger.debug(f"Extracted {len(keywords)} distinct keywords")
    return list(keywords)

def calculate_match_score(resume_text: str, jd_text: str) -> float:
    """Calculate deterministic cosine similarity between Resume and JD using TF-IDF."""
    logger.debug("Starting calculate_match_score evaluation")
    clean_resume = clean_text(resume_text)
    clean_jd = clean_text(jd_text)
    
    if not clean_resume or not clean_jd:
        logger.warning("Either resume or job description was completely empty after cleaning")
        return 0.0

    logger.debug("Running TfidfVectorizer on the cleaned texts")
    vectorizer = TfidfVectorizer(stop_words='english')
    tfidf_matrix = vectorizer.fit_transform([clean_jd, clean_resume])
    
    logger.debug("Calculating cosine similarity matrix")
    similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
    
    score = round(similarity * 100, 2)
    final_score = max(0.0, min(100.0, score))
    logger.info(f"TF-IDF math completed. Calculated raw similarity: {similarity:.4f}, final metric: {final_score}")
    
    return final_score
