from src.parsers.pdf_parser import PDFParser

pdf_path = "data/resumes/sample_resume.pdf"

text = PDFParser.extract_text(pdf_path)

print("\n========== PDF TEXT ==========\n")

print(text)

print("\n==============================\n")