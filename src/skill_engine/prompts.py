# Prompt to extract skills and project evidence from resume text
RESUME_EXTRACTION_PROMPT = """Extract technical and professional skills mentioned in the resume text below.

Instructions:
1. Extract all technical skills, programming languages, frameworks, libraries, databases, cloud services, and tools mentioned or demonstrated in the text.
2. For each skill, provide:
   - "name": Skill name (e.g. Python, Docker, FastAPI)
   - "source_section": Section it appeared in (e.g. experience, projects)
   - "evidence": Short sentence from the text demonstrating its use

Return ONLY valid JSON in this format:
{
  "skills": [
    {
      "name": "Python",
      "source_section": "experience",
      "evidence": "Built data pipelines using Python."
    }
  ]
}

Resume Text:
---
<<RESUME_TEXT>>
---
"""

# Prompt to extract required and preferred skills from job description
JD_EXTRACTION_PROMPT = """Extract all skill requirements from the job description below.

Instructions:
1. List each skill, tool, framework, or competency.
2. Tag requirement level as:
   - "required": explicitly required or core qualification
   - "preferred": nice to have, plus, or bonus
   - "other": general knowledge or context

Return ONLY valid JSON in this format:
{
  "skills": [
    {
      "name": "Python",
      "requirement": "required",
      "evidence": "3+ years experience with Python."
    }
  ]
}

Job Description:
---
<<JD_TEXT>>
---
"""

# Prompt to check if unmatched skills are mentioned in resume
VERIFICATION_PROMPT = """Check if the candidate's resume text demonstrates any of the following unmatched skills.

Skills to check:
<<SKILLS_LIST>>

Candidate resume text:
---
<<RESUME_TEXT>>
---

Guidelines:
- "matched": resume evidence explicitly mentions or directly demonstrates hands-on experience with this skill.
- "uncertain": evidence is ambiguous, partial, or inconclusive.
- "missing": not demonstrated or mentioned in the resume.
- Strict distinction rules:
  * Do NOT treat related technologies as equivalent (e.g., PyTorch is NOT TensorFlow; Java is NOT JavaScript; React is NOT Angular).
  * General categories do NOT imply specific tools (e.g., Python does not imply FastAPI/Django; Machine Learning does not imply Deep Learning).

Return ONLY valid JSON:
{
  "verifications": [
    {
      "skill": "skill_name",
      "status": "matched" | "missing" | "uncertain"
    }
  ]
}
"""


# Put resume text into the prompt
def build_resume_extraction_prompt(resume_text: str) -> str:
    return RESUME_EXTRACTION_PROMPT.replace("<<RESUME_TEXT>>", resume_text or "")


# Put job description into the prompt
def build_jd_extraction_prompt(jd_text: str) -> str:
    return JD_EXTRACTION_PROMPT.replace("<<JD_TEXT>>", jd_text or "")


# Put unmatched skills and resume text into verification prompt
def build_verification_prompt(skills_list: list, resume_text: str) -> str:
    skills_block = "\n".join(f"- {s}" for s in skills_list)
    return VERIFICATION_PROMPT.replace("<<SKILLS_LIST>>", skills_block).replace("<<RESUME_TEXT>>", resume_text or "")

