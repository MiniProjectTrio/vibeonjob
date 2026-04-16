import pytesseract
import logging
import re
import numpy as np
from PIL import Image

try:
    import cv2
    _HAS_CV2 = True
except Exception:
    _HAS_CV2 = False

logger = logging.getLogger("vibeonjob.services.parser")

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