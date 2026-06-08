from src.parsers.resume_loader import (
    ResumeLoader
)

resumes = ResumeLoader.load_resumes("data/resumes")

print()

for resume in resumes:

    print(
        f"Resume: "
        f"{resume['file_name']}"
    )

    print(
        f"Sections: "
        f"{list(resume['sections'].keys())}"
    )

    print()