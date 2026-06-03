import fitz

from src.utils.logger import logger

class PDFParser:
    @staticmethod
    def extract_text(pdf_path: str) -> str:
        logger.info(f"Extracting text from {pdf_path}")

        document = fitz.open(pdf_path)
        text = ""

        for page in document:
            text += page.get_text()
        
        document.close()

        logger.info("PDF text extraction completed")

        return text