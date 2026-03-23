import logging
import fitz  # PyMuPDF
from docx import Document
import io

logger = logging.getLogger("vibeonjob.services.parser")

def parse_pdf(file_bytes: bytes) -> str:
    """Extract text from a PDF file."""
    logger.debug("Initializing PyMuPDF parser")
    text = ""
    try:
        with fitz.open(stream=file_bytes, filetype="pdf") as doc:
            logger.debug(f"PDF opened successfully. Number of pages: {len(doc)}")
            for i, page in enumerate(doc):
                page_text = page.get_text()
                text += page_text + "\n"
                logger.debug(f"Extracted {len(page_text)} chars from page {i+1}")
        return text
    except Exception as e:
        logger.error(f"Failed to parse PDF document: {e}")
        raise

def parse_docx(file_bytes: bytes) -> str:
    """Extract text from a DOCX file."""
    logger.debug("Initializing python-docx parser")
    try:
        doc = Document(io.BytesIO(file_bytes))
        logger.debug(f"DOCX opened successfully. Number of paragraphs: {len(doc.paragraphs)}")
        paragraphs = [para.text for para in doc.paragraphs]
        return "\n".join(paragraphs)
    except Exception as e:
        logger.error(f"Failed to parse DOCX document: {e}")
        raise
