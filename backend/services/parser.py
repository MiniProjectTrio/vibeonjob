import logging
import fitz  # PyMuPDF
from docx import Document
import io
import pytesseract
from PIL import Image

logger = logging.getLogger("vibeonjob.services.parser")

from services.ocr_engine import extract_text_from_image

def parse_pdf(file_bytes: bytes) -> str:
    """Extract text from a PDF file using high-DPI rendering and modular OCR engine."""
    logger.debug("Initializing PyMuPDF parser with OCR pipeline")
    out_parts = []
    try:
        with fitz.open(stream=file_bytes, filetype="pdf") as doc:
            logger.debug(f"PDF opened successfully. Number of pages: {len(doc)}")
            for i, page in enumerate(doc):
                # 1. Extract selectable text
                selectable = page.get_text() or ""
                
                # 2. Extract OCR text
                try:
                    # Render page at 300 DPI for OCR
                    pix = page.get_pixmap(dpi=300)
                    img_bytes = pix.tobytes("png")
                    pil_img = Image.open(io.BytesIO(img_bytes))
                    
                    ocr_text = extract_text_from_image(pil_img)
                except Exception as e:
                    logger.warning(f"OCR failed on page {i+1}: {e}")
                    ocr_text = ""

                # 3. Combine logic (prefer merging if both exist, but avoid pure duplicates)
                if selectable.strip() and not ocr_text.strip():
                    out_parts.append(selectable)
                elif selectable.strip() and ocr_text.strip():
                    # If OCR found significantly more than selectable, it might be a semi-scanned page
                    if len(ocr_text) > len(selectable) * 1.5:
                        out_parts.append(ocr_text)
                    else:
                        out_parts.append(selectable + "\n" + ocr_text)
                elif ocr_text.strip():
                    out_parts.append(ocr_text)
                else:
                    out_parts.append(selectable)
                    
        return "\n".join([p for p in out_parts if p])
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

def parse_image(file_bytes: bytes) -> str:
    """Extract text from an image file (JPG, PNG)."""
    logger.debug("Initializing Image parser with OCR pipeline")
    try:
        pil_img = Image.open(io.BytesIO(file_bytes))
        text = extract_text_from_image(pil_img)
        return text
    except Exception as e:
        logger.error(f"Failed to parse image document: {e}")
        raise
