import logging
import fitz  # PyMuPDF
from docx import Document
import io
import pytesseract
from PIL import Image, ImageOps, ImageFilter
import re
import numpy as np
try:
    import cv2
    _HAS_CV2 = True
except Exception:
    _HAS_CV2 = False

logger = logging.getLogger("vibeonjob.services.parser")

#OSD - Orientation and Script detection
def _detect_and_deskew(pil_img: Image.Image) -> Image.Image:
    """Detect rotation using Tesseract OSD or OpenCV and rotate the image.

    Prefer Tesseract OSD (if available). If OSD fails, fall back to a simple
    OpenCV minAreaRect-based deskew when OpenCV is installed.
    """
    # Try Tesseract OSD first
    try:
        osd = pytesseract.image_to_osd(pil_img)
        m = re.search(r"Rotate:\s*(\d+)", osd)
        if m:
            angle = int(m.group(1))
            if angle != 0:
                logger.debug(f"Detected rotation {angle}°, rotating image before OCR")
                return pil_img.rotate(-angle, expand=True)
    except Exception:
        logger.debug("OSD rotation detection unavailable or failed; trying OpenCV fallback if present")

    # OpenCV-based deskew fallback
    if _HAS_CV2:
        try:
            arr = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2GRAY)
            _, th = cv2.threshold(arr, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            coords = np.column_stack(np.where(th > 0))
            if coords.size == 0:
                return pil_img
            rect = cv2.minAreaRect(coords)
            angle = rect[-1]
            if angle < -45:
                angle = -(90 + angle)
            else:
                angle = -angle
            if abs(angle) > 0.5:
                logger.debug(f"OpenCV estimated rotation {angle:.2f}°, rotating image before OCR")
                (h, w) = arr.shape
                M = cv2.getRotationMatrix2D((w / 2, h / 2), angle, 1.0)
                rotated = cv2.warpAffine(np.array(pil_img), M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
                return Image.fromarray(rotated)
        except Exception as e:
            logger.debug(f"OpenCV deskew fallback failed: {e}")

    return pil_img


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
