import logging
import fitz  # PyMuPDF
from docx import Document
import io
from services.deskew import _detect_and_deskew
import pytesseract
from PIL import Image, ImageOps, ImageFilter
import numpy as np
try:
    import cv2
    _HAS_CV2 = True
except Exception:
    _HAS_CV2 = False

logger = logging.getLogger("vibeonjob.services.parser")

def parse_pdf(file_bytes: bytes) -> str:
    """Extract text from a PDF file with preprocessing and deskew before OCR."""
    logger.debug("Initializing PyMuPDF parser")
    out_parts = []
    try:
        with fitz.open(stream=file_bytes, filetype="pdf") as doc:
            logger.debug(f"PDF opened successfully. Number of pages: {len(doc)}")
            for i, page in enumerate(doc):
                selectable = page.get_text() or ""
                # Render page at 300 DPI for OCR
                pix = page.get_pixmap(dpi=300)
                pil_img = Image.open(io.BytesIO(pix.tobytes("png")))

                proc = _preprocess_image(pil_img)
                try:
                    ocr_text = pytesseract.image_to_string(proc)
                except Exception as e:
                    logger.warning(f"Tesseract OCR failed on page {i+1}: {e}")
                    ocr_text = ""

                if selectable.strip() and not ocr_text.strip():
                    out_parts.append(selectable)
                elif selectable.strip() and ocr_text.strip():
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
        proc = _preprocess_image(pil_img)
        text = pytesseract.image_to_string(proc)
        return text.strip()
    except Exception as e:
        logger.error(f"Failed to parse image document: {e}")
        raise

def _preprocess_image(pil_img: Image.Image) -> Image.Image:
    """Preprocess image to improve OCR accuracy.

    Steps:
    - Deskew/rotate detection
    - Convert to grayscale
    - Contrast/autocontrast
    - Denoise
    - Adaptive/Otsu thresholding
    Uses OpenCV when available for more control, otherwise falls back to Pillow.
    """
    pil_img = _detect_and_deskew(pil_img)

    if _HAS_CV2:
        try:
            arr = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2GRAY)
            # Denoise
            arr = cv2.fastNlMeansDenoising(arr, None, h=10)
            # Otsu threshold
            _, th = cv2.threshold(arr, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            return Image.fromarray(th)
        except Exception as e:
            logger.debug(f"OpenCV preprocessing failed ({e}), falling back to Pillow")

    # Pillow fallback
    img = pil_img.convert("L")
    img = ImageOps.autocontrast(img)
    img = img.filter(ImageFilter.MedianFilter(size=3))
    # Simple binarization as fallback
    img = img.point(lambda p: 255 if p > 160 else 0)
    return img