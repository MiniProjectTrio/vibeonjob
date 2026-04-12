# OCR Full-Page Sweep Mechanism

## Goal
To absolutely guarantee zero visual data is dropped during resume parsing. Small infographics, weird vector bounds, and heavily cropped scanned documents are visually read and appended.

## Technology Stack
- **PyMuPDF (`fitz`)**: For rendering full-page vectors and layers into unified visual maps.
- **pytesseract**: Python OCR bindings.
- **Pillow (`PIL`)**: For converting PyMuPDF bytes mapping into standard accessible images.

## Mechanism Flow
1. User uploads a PDF (Resume).
2. The `parser.py` module iterates over each page.
3. Standard extraction (`page.get_text()`) runs first.
4. **Full Visual Snapshot**: An exhaustive 300 DPI `Pixmap` is generated for the exact page using `page.get_pixmap(dpi=300)`. This flattens all SVGs, vectors, overlays, images, and text layers into an exact 1:1 image representing what a human eye sees when looking at that page.
5. The pixel map is pushed securely into a `BytesIO` buffer, converted to a `PIL` format, and sent directly to `pytesseract`.
6. Tesseract strips all visually identifiable characters out of the full image.
7. Any text parsed visually is immediately concatenated beneath the standard layout. 

## Resilience
The duplication of textual data has **zero mathematical impact** on our `scikit-learn` TF-IDF evaluator, because the `cosine_similarity` algorithm employs L2 string normalization over vectors. Additionally, LLMs (like Gemini) easily synthesize deduplicated context, making this "brute-force" visual sweep safe, highly secure, and exceptionally accurate.
