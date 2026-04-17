"""
Unit tests for services/parser.py

Covers all five parser functions:
  - parse_pdf (delegation)
  - parse_pdf_with_pymupdf (native text extraction)
  - parse_pdf_with_ocr (OCR pipeline)
  - parse_docx
  - parse_image

All heavy I/O (PyMuPDF, python-docx, Tesseract, OCR engine) is mocked
so these tests run fast and without system dependencies.
"""

import io
import logging
import pytest
from unittest.mock import patch, MagicMock
from PIL import Image

from services.parser import (
    parse_pdf,
    parse_pdf_with_pymupdf,
    parse_pdf_with_ocr,
    parse_docx,
    parse_image,
)


# ──────────────────────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────────────────────

def _make_text_block(x0, y0, x1, y1, text, block_no, block_type=0):
    """Create a tuple matching PyMuPDF's get_text('blocks') schema."""
    return (x0, y0, x1, y1, text, block_no, block_type)


def _dummy_page(blocks=None, selectable_text=""):
    """Return a mock fitz.Page."""
    page = MagicMock()
    page.get_text.side_effect = lambda *args, **kwargs: (
        blocks if args and args[0] == "blocks" else selectable_text
    )
    # For OCR path: mock pixmap
    pix = MagicMock()
    pix.tobytes.return_value = b"\x89PNG\r\n\x1a\n"  # minimal bytes
    page.get_pixmap.return_value = pix
    return page


def _mock_fitz_open(pages):
    """Return a context-manager mock for fitz.open that yields pages."""
    doc = MagicMock()
    doc.__enter__ = MagicMock(return_value=doc)
    doc.__exit__ = MagicMock(return_value=False)
    doc.__len__ = MagicMock(return_value=len(pages))
    doc.__iter__ = MagicMock(return_value=iter(pages))
    return doc


# ──────────────────────────────────────────────────────────────────────────────
# parse_pdf — delegation test
# ──────────────────────────────────────────────────────────────────────────────

class TestParsePdf:
    """parse_pdf() should delegate entirely to parse_pdf_with_pymupdf()."""

    @patch("services.parser.parse_pdf_with_pymupdf")
    def test_delegates_to_pymupdf(self, mock_pymupdf):
        mock_pymupdf.return_value = "extracted text"
        result = parse_pdf(b"fake pdf bytes")
        mock_pymupdf.assert_called_once_with(b"fake pdf bytes")
        assert result == "extracted text"


# ──────────────────────────────────────────────────────────────────────────────
# parse_pdf_with_pymupdf
# ──────────────────────────────────────────────────────────────────────────────

class TestParsePdfWithPymupdf:
    """Tests for the native PyMuPDF text extraction path."""

    @patch("services.parser.fitz.open")
    def test_extracts_text_blocks(self, mock_fitz_open):
        blocks = [
            _make_text_block(0, 0, 100, 20, "Hello World\n", 0),
            _make_text_block(0, 25, 100, 45, "Second block\n", 1),
        ]
        page = _dummy_page(blocks=blocks)
        doc = _mock_fitz_open([page])
        mock_fitz_open.return_value = doc

        result = parse_pdf_with_pymupdf(b"fake")
        assert "Hello World" in result
        assert "Second block" in result

    @patch("services.parser.fitz.open")
    def test_skips_image_blocks(self, mock_fitz_open):
        """block_type == 1 (image) should be filtered out."""
        blocks = [
            _make_text_block(0, 0, 100, 20, "Text block\n", 0, block_type=0),
            _make_text_block(0, 25, 100, 45, "Image data\n", 1, block_type=1),
        ]
        page = _dummy_page(blocks=blocks)
        doc = _mock_fitz_open([page])
        mock_fitz_open.return_value = doc

        result = parse_pdf_with_pymupdf(b"fake")
        assert "Text block" in result
        assert "Image data" not in result

    @patch("services.parser.fitz.open")
    def test_sorts_by_position(self, mock_fitz_open):
        """Blocks should be sorted top-to-bottom (y0), left-to-right (x0)."""
        blocks = [
            _make_text_block(200, 50, 300, 70, "Bottom right\n", 1),
            _make_text_block(0, 0, 100, 20, "Top left\n", 0),
            _make_text_block(0, 50, 100, 70, "Bottom left\n", 2),
        ]
        page = _dummy_page(blocks=blocks)
        doc = _mock_fitz_open([page])
        mock_fitz_open.return_value = doc

        result = parse_pdf_with_pymupdf(b"fake")
        idx_top = result.index("Top left")
        idx_bl = result.index("Bottom left")
        idx_br = result.index("Bottom right")
        assert idx_top < idx_bl < idx_br

    @patch("services.parser.fitz.open")
    def test_blank_pages_skipped(self, mock_fitz_open):
        """Pages with no text blocks should not add empty strings."""
        page1 = _dummy_page(blocks=[
            _make_text_block(0, 0, 100, 20, "Page one\n", 0),
        ])
        page2 = _dummy_page(blocks=[])  # blank
        page3 = _dummy_page(blocks=[
            _make_text_block(0, 0, 100, 20, "Page three\n", 0),
        ])
        doc = _mock_fitz_open([page1, page2, page3])
        mock_fitz_open.return_value = doc

        result = parse_pdf_with_pymupdf(b"fake")
        assert "Page one" in result
        assert "Page three" in result
        # Pages are separated by \n\n; there shouldn't be an extra gap
        assert "\n\n\n\n" not in result

    @patch("services.parser.fitz.open")
    def test_multipage_separation(self, mock_fitz_open):
        """Pages should be separated by double newlines."""
        page1 = _dummy_page(blocks=[
            _make_text_block(0, 0, 100, 20, "Page 1\n", 0),
        ])
        page2 = _dummy_page(blocks=[
            _make_text_block(0, 0, 100, 20, "Page 2\n", 0),
        ])
        doc = _mock_fitz_open([page1, page2])
        mock_fitz_open.return_value = doc

        result = parse_pdf_with_pymupdf(b"fake")
        assert "Page 1\n\nPage 2" in result

    @patch("services.parser.fitz.open")
    def test_whitespace_only_blocks_stripped(self, mock_fitz_open):
        """Blocks with only whitespace should be excluded."""
        blocks = [
            _make_text_block(0, 0, 100, 20, "  Real text  \n", 0),
            _make_text_block(0, 25, 100, 45, "   \n", 1),
            _make_text_block(0, 50, 100, 70, "\t\n", 2),
        ]
        page = _dummy_page(blocks=blocks)
        doc = _mock_fitz_open([page])
        mock_fitz_open.return_value = doc

        result = parse_pdf_with_pymupdf(b"fake")
        assert "Real text" in result
        # Result should only have the one real block
        assert result.strip() == "Real text"

    @patch("services.parser.fitz.open")
    def test_raises_on_corrupt_pdf(self, mock_fitz_open):
        mock_fitz_open.side_effect = Exception("invalid PDF")
        with pytest.raises(Exception, match="invalid PDF"):
            parse_pdf_with_pymupdf(b"corrupt")

    @patch("services.parser.fitz.open")
    def test_empty_pdf(self, mock_fitz_open):
        """A PDF with zero pages should return an empty string."""
        doc = _mock_fitz_open([])
        mock_fitz_open.return_value = doc

        result = parse_pdf_with_pymupdf(b"fake")
        assert result == ""

    @patch("services.parser.fitz.open")
    def test_logging_output(self, mock_fitz_open, caplog):
        """Verify key debug/info messages are emitted."""
        blocks = [_make_text_block(0, 0, 100, 20, "Logged text\n", 0)]
        page = _dummy_page(blocks=blocks)
        doc = _mock_fitz_open([page])
        mock_fitz_open.return_value = doc

        with caplog.at_level(logging.DEBUG, logger="vibeonjob.services.parser"):
            parse_pdf_with_pymupdf(b"fake")

        log_text = caplog.text
        assert "PyMuPDF native text extraction" in log_text
        assert "PDF opened successfully" in log_text
        assert "Extracted" in log_text


# ──────────────────────────────────────────────────────────────────────────────
# parse_pdf_with_ocr
# ──────────────────────────────────────────────────────────────────────────────

class TestParsePdfWithOcr:
    """Tests for the OCR-based PDF extraction path."""

    @patch("services.parser.Image.open")
    @patch("services.parser.extract_text_from_image")
    @patch("services.parser.fitz.open")
    def test_ocr_text_used_when_no_selectable(self, mock_fitz, mock_ocr_fn, mock_img_open):
        page = _dummy_page(selectable_text="")
        doc = _mock_fitz_open([page])
        mock_fitz.return_value = doc
        mock_img_open.return_value = MagicMock(spec=Image.Image)
        mock_ocr_fn.return_value = "OCR extracted text"

        result = parse_pdf_with_ocr(b"fake")
        assert "OCR extracted text" in result

    @patch("services.parser.Image.open")
    @patch("services.parser.extract_text_from_image")
    @patch("services.parser.fitz.open")
    def test_selectable_preferred_when_no_ocr(self, mock_fitz, mock_ocr_fn, mock_img_open):
        page = _dummy_page(selectable_text="Selectable text")
        doc = _mock_fitz_open([page])
        mock_fitz.return_value = doc
        mock_img_open.return_value = MagicMock(spec=Image.Image)
        mock_ocr_fn.return_value = ""

        result = parse_pdf_with_ocr(b"fake")
        assert "Selectable text" in result

    @patch("services.parser.Image.open")
    @patch("services.parser.extract_text_from_image")
    @patch("services.parser.fitz.open")
    def test_ocr_preferred_when_significantly_longer(self, mock_fitz, mock_ocr_fn, mock_img_open):
        """OCR text is preferred when it's >1.5x the length of selectable."""
        short_selectable = "Short"
        long_ocr = "This is a much longer OCR result that exceeds the threshold"
        page = _dummy_page(selectable_text=short_selectable)
        doc = _mock_fitz_open([page])
        mock_fitz.return_value = doc
        mock_img_open.return_value = MagicMock(spec=Image.Image)
        mock_ocr_fn.return_value = long_ocr

        result = parse_pdf_with_ocr(b"fake")
        assert long_ocr in result
        # Should NOT contain both merged
        assert result.count(short_selectable) <= 1

    @patch("services.parser.Image.open")
    @patch("services.parser.extract_text_from_image")
    @patch("services.parser.fitz.open")
    def test_ocr_failure_falls_back_to_selectable(self, mock_fitz, mock_ocr_fn, mock_img_open):
        page = _dummy_page(selectable_text="Fallback text")
        doc = _mock_fitz_open([page])
        mock_fitz.return_value = doc
        mock_img_open.side_effect = Exception("Image read failed")

        result = parse_pdf_with_ocr(b"fake")
        assert "Fallback text" in result


# ──────────────────────────────────────────────────────────────────────────────
# parse_docx
# ──────────────────────────────────────────────────────────────────────────────

class TestParseDocx:

    @patch("services.parser.Document")
    def test_extracts_paragraphs(self, mock_doc_cls):
        para1, para2 = MagicMock(), MagicMock()
        para1.text = "First paragraph"
        para2.text = "Second paragraph"
        mock_doc = MagicMock()
        mock_doc.paragraphs = [para1, para2]
        mock_doc_cls.return_value = mock_doc

        result = parse_docx(b"fake docx")
        assert "First paragraph" in result
        assert "Second paragraph" in result

    @patch("services.parser.Document")
    def test_empty_docx(self, mock_doc_cls):
        mock_doc = MagicMock()
        mock_doc.paragraphs = []
        mock_doc_cls.return_value = mock_doc

        result = parse_docx(b"fake")
        assert result == ""

    @patch("services.parser.Document")
    def test_raises_on_corrupt_docx(self, mock_doc_cls):
        mock_doc_cls.side_effect = Exception("Bad DOCX")
        with pytest.raises(Exception, match="Bad DOCX"):
            parse_docx(b"corrupt")

    @patch("services.parser.Document")
    def test_logging(self, mock_doc_cls, caplog):
        mock_doc = MagicMock()
        mock_doc.paragraphs = [MagicMock(text="test")]
        mock_doc_cls.return_value = mock_doc

        with caplog.at_level(logging.DEBUG, logger="vibeonjob.services.parser"):
            parse_docx(b"fake")

        assert "python-docx" in caplog.text
        assert "DOCX opened successfully" in caplog.text


# ──────────────────────────────────────────────────────────────────────────────
# parse_image
# ──────────────────────────────────────────────────────────────────────────────

class TestParseImage:

    @patch("services.parser.extract_text_from_image")
    @patch("services.parser.Image.open")
    def test_extracts_text_from_image(self, mock_img_open, mock_ocr_fn):
        mock_img_open.return_value = MagicMock(spec=Image.Image)
        mock_ocr_fn.return_value = "Text from image"

        result = parse_image(b"fake image bytes")
        assert result == "Text from image"

    @patch("services.parser.extract_text_from_image")
    @patch("services.parser.Image.open")
    def test_empty_image_result(self, mock_img_open, mock_ocr_fn):
        mock_img_open.return_value = MagicMock(spec=Image.Image)
        mock_ocr_fn.return_value = ""

        result = parse_image(b"blank image")
        assert result == ""

    @patch("services.parser.Image.open")
    def test_raises_on_bad_image(self, mock_img_open):
        mock_img_open.side_effect = Exception("Cannot identify image")
        with pytest.raises(Exception, match="Cannot identify image"):
            parse_image(b"not an image")

    @patch("services.parser.extract_text_from_image")
    @patch("services.parser.Image.open")
    def test_logging(self, mock_img_open, mock_ocr_fn, caplog):
        mock_img_open.return_value = MagicMock(spec=Image.Image)
        mock_ocr_fn.return_value = "logged"

        with caplog.at_level(logging.DEBUG, logger="vibeonjob.services.parser"):
            parse_image(b"fake")

        assert "Image parser" in caplog.text


# ──────────────────────────────────────────────────────────────────────────────
# Integration tests — real PDF files
#
# Place your PDF files in:  tests/fixtures/
# Run with:  pytest tests/test_parser.py -m integration -s
#
# The `-s` flag disables output capture so you can see the parsed text.
# ──────────────────────────────────────────────────────────────────────────────

import pathlib

FIXTURES_DIR = pathlib.Path(__file__).parent / "fixtures"


@pytest.mark.integration
class TestRealPdfParsing:
    """Integration tests that parse actual PDF files and print the output.

    Drop any PDF into tests/fixtures/ and it will be picked up automatically.
    Run:  pytest tests/test_parser.py -m integration -s
    """

    @staticmethod
    def _get_pdf_files():
        """Collect all PDFs in the fixtures directory."""
        if not FIXTURES_DIR.exists():
            return []
        return sorted(FIXTURES_DIR.glob("*.pdf"))

    def test_parse_pdf_with_pymupdf_real(self):
        """Parse every fixture PDF with PyMuPDF and print the output."""
        pdf_files = self._get_pdf_files()
        assert pdf_files, f"No PDF files found in {FIXTURES_DIR}. Drop a PDF there and re-run."

        for pdf_path in pdf_files:
            file_bytes = pdf_path.read_bytes()
            result = parse_pdf_with_pymupdf(file_bytes)

            print(f"\n{'='*80}")
            print(f"FILE: {pdf_path.name}")
            print(f"SIZE: {len(file_bytes):,} bytes")
            print(f"EXTRACTED CHARS: {len(result):,}")
            print(f"ESTIMATED TOKENS: ~{len(result) // 4:,}")
            print(f"{'='*80}")
            print(result)
            print(f"{'='*80}\n")

            assert len(result) > 0, f"No text extracted from {pdf_path.name}"

    def test_parse_pdf_delegates_real(self):
        """Ensure parse_pdf() produces identical output to parse_pdf_with_pymupdf()."""
        pdf_files = self._get_pdf_files()
        assert pdf_files, f"No PDF files found in {FIXTURES_DIR}."

        for pdf_path in pdf_files:
            file_bytes = pdf_path.read_bytes()
            via_entry = parse_pdf(file_bytes)
            via_pymupdf = parse_pdf_with_pymupdf(file_bytes)
            assert via_entry == via_pymupdf, f"parse_pdf() != parse_pdf_with_pymupdf() for {pdf_path.name}"
            print(f"✓ {pdf_path.name}: parse_pdf delegation verified ({len(via_entry):,} chars)")
