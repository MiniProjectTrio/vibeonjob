import logging
import re
import io
import numpy as np
import pytesseract
from PIL import Image, ImageOps, ImageFilter

try:
    import cv2
    _HAS_CV2 = True
except ImportError:
    _HAS_CV2 = False

logger = logging.getLogger("vibeonjob.services.ocr_engine")

def _detect_and_deskew(pil_img: Image.Image) -> Image.Image:
    """Detect rotation using Tesseract OSD or OpenCV and rotate the image."""
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
        logger.debug("OSD rotation detection unavailable or failed; trying OpenCV fallback")

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
                logger.debug(f"OpenCV estimated rotation {angle:.2f}°, rotating image")
                (h, w) = arr.shape
                M = cv2.getRotationMatrix2D((w / 2, h / 2), angle, 1.0)
                rotated = cv2.warpAffine(np.array(pil_img), M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
                return Image.fromarray(rotated)
        except Exception as e:
            logger.debug(f"OpenCV deskew fallback failed: {e}")

    return pil_img

def preprocess_image(pil_img: Image.Image) -> Image.Image:
    """Preprocess image to improve OCR accuracy."""
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

def extract_text_from_image(pil_img: Image.Image) -> str:
    """Preprocess and extract text from a PIL image using Tesseract."""
    try:
        processed_img = preprocess_image(pil_img)
        text = pytesseract.image_to_string(processed_img)
        return text.strip()
    except Exception as e:
        logger.warning(f"OCR extraction failed: {e}")
        return ""
