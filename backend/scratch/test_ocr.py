import logging
from services.parser import parse_pdf
from io import BytesIO
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter

logging.basicConfig(level=logging.DEBUG)

def create_sample_pdf(text):
    packet = BytesIO()
    c = canvas.Canvas(packet, pagesize=letter)
    c.drawString(100, 750, text)
    c.save()
    packet.seek(0)
    return packet.read()

if __name__ == "__main__":
    pdf_bytes = create_sample_pdf("This is a sample document to test Tesseract OCR pipeline in VibeOnJob.")
    print("Testing parse_pdf directly...")
    result = parse_pdf(pdf_bytes)
    print("Parsed Text:")
    print(result)
