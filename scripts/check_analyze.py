"""Live check of the full analysis with real Groq and the real embedding model.

    python -m scripts.check_analyze                       # every PDF in data/resumes vs the sample JD
    python -m scripts.check_analyze path/to/cv.pdf        # one resume
    python -m scripts.check_analyze --jd path/to/jd.txt   # your own job description

About 2-3 Groq requests per resume plus 1 for the job description.
"""
import sys
import time
from pathlib import Path

from src.analysis.service import AnalysisService
from src.schemas.errors import AppError

DEFAULT_JD = """Machine Learning Engineer (Kochi)
We need 3-5 years of experience building ML and backend systems in production.
Required: Python, PyTorch, FastAPI, SQL, Docker.
Nice to have: AWS, Kubernetes.
Education: Bachelor's in Computer Science or a related field."""


def main() -> int:
    args = sys.argv[1:]
    jd = DEFAULT_JD
    if "--jd" in args:
        i = args.index("--jd")
        jd = Path(args[i + 1]).read_text(encoding="utf-8")
        args = args[:i] + args[i + 2:]
    pdfs = [Path(a) for a in args] or sorted(Path("data/resumes").glob("*.pdf"))

    service = AnalysisService()
    print(f"{'file':38} {'score':>6}  {'verdict':15} {'skills':>7}  {'exp (rel/total)':18} {'exp':6}  {'edu':16}  time")
    for pdf in pdfs:
        start = time.perf_counter()
        try:
            r = service.analyze(pdf.read_bytes(), pdf.name, jd)
        except AppError as e:
            print(f"{pdf.name[:38]:38} FAIL ({e.error_code}): {e.message}")
            continue
        exp, edu, gap = r.experience, r.education, r.skill_gap
        months = f"{exp.relevant_months}/{exp.total_months} mo" if exp.total_months is not None else "n/a"
        print(f"{pdf.name[:38]:38} {r.final_score:6.1f}  {r.verdict:15} "
              f"{len(gap.matched_skills):>3}/{len(gap.jd_skills):<3}  {months:18} {str(exp.compatibility):6}  "
              f"{str(edu.compatibility):16}  {time.perf_counter() - start:.1f}s")
        print(f"    breakdown: {r.breakdown.model_dump()}  missing: {[m.skill for m in gap.missing_skills]}")
        for w in r.warnings:
            print(f"    warning: {w}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
