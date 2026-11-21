from src.parsers.pdf_parser import PDFParser
from src.parsers.resume_parser import ResumeParser

pdf_path = "data/resumes/sample_resume.pdf"

text = PDFParser.extract_text(pdf_path)

sections = ResumeParser.parse(text)

print("\n===== PARSED SECTIONS =====\n")

for section, content in sections.items():

    print(f"\n[{section.upper()}]\n")

    print(content)

    print(
        "\n--------------------"
    )