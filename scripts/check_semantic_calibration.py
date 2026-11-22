"""Print raw embedding similarities so SEMANTIC_SIM_FLOOR / SEMANTIC_SIM_CEILING can be tuned.
No Groq calls. Needs the embedding model (downloaded once from Hugging Face).

    python -m scripts.check_semantic_calibration

A good calibration puts clearly unrelated pairs near the FLOOR and the best matches near the CEILING.
"""
from pathlib import Path

from configs.settings import settings
from src.analysis.pdf_text import extract_pdf_text
from src.analysis.semantic import SemanticScorer, resume_windows
from src.parsers.resume_parser import ResumeParser

JDS = {
    "ml/backend": "Machine Learning Engineer. 3+ years building ML and backend systems with Python, PyTorch, "
                  "FastAPI, SQL and Docker. Deploy models to production on AWS.",
    "frontend": "Frontend Engineer. 3+ years building web apps with React, TypeScript, Next.js, CSS and "
                "accessibility. Design systems, Jest and Cypress testing.",
    "devops": "DevOps Engineer. Kubernetes, Terraform, CI/CD with GitHub Actions, Prometheus and Grafana "
              "monitoring on AWS and GCP. 4+ years.",
    "accountant": "Accountant. Prepare financial statements, reconcile ledgers, manage payroll and tax filings "
                  "using Tally and Excel. CA or CPA preferred.",
}


def main() -> None:
    scorer = SemanticScorer()
    print(f"FLOOR={settings.SEMANTIC_SIM_FLOOR}  CEILING={settings.SEMANTIC_SIM_CEILING}\n")
    print(f"{'resume':38}" + "".join(f"{k:>16}" for k in JDS))
    for pdf in sorted(Path("data/resumes").glob("*.pdf")):
        text, _ = extract_pdf_text(pdf.read_bytes(), pdf.name)
        chunks = resume_windows(ResumeParser.parse(text), text)
        cells = []
        for jd in JDS.values():
            raw, scaled = scorer.similarity(chunks, jd)
            cells.append(f"{raw:.2f} -> {scaled:.2f}")
        print(f"{pdf.name[:38]:38}" + "".join(f"{c:>16}" for c in cells))
    print("\nEach cell: raw cosine -> scaled 0..1 used in the score.")


if __name__ == "__main__":
    main()
