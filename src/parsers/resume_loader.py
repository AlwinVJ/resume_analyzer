from pathlib import Path

from src.parsers.pdf_parser import PDFParser
from src.parsers.resume_parser import ResumeParser

from src.utils.logger import logger


class ResumeLoader:

    @staticmethod
    def load_resumes(resumes_directory: str):

        logger.info(f"Loading resumes from {resumes_directory}")

        parsed_resumes = []

        resume_files = Path(resumes_directory).glob("*.pdf")

        for pdf_file in resume_files:

            logger.info(f"Processing {pdf_file.name}")

            raw_text = PDFParser.extract_text(str(pdf_file))

            sections = ResumeParser.parse(raw_text)

            parsed_resumes.append({

                "file_name":
                    pdf_file.name,

                "sections":
                    sections
            })

        logger.info(f"Loaded {len(parsed_resumes)} resumes")

        return parsed_resumes