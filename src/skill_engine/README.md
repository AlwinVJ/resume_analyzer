# Skill Engine Module

Compares candidate resume skills with job description requirements to identify matched skills, missing skills, and calculate an overall overlap score.

## Responsibilities
- Parse explicit skills from listed technical sections.
- Extract contextual skills from experience and project descriptions using an LLM.
- Normalize skill variations and abbreviations (e.g., `k8s` -> `kubernetes`, `postgres` -> `postgresql`).
- Match skills deterministically first, then verify remaining requirements against resume context.
- Output a structured skill gap report with importance weighting for missing skills.

---

## Input

```python
resume_sections = {
    "technical_skills": "Python, SQL, Docker",
    "experience": "Developed data pipelines and machine learning models using scikit-learn.",
    "projects": "Built recommendation engine."
}

jd_text = "Looking for a Data Scientist with Python, SQL, Docker, and Kubernetes."
```

---

## Output

```json
{
  "resume_skills": ["python", "sql", "docker", "scikit-learn"],
  "jd_skills": ["python", "sql", "docker", "kubernetes"],
  "matched_skills": ["python", "sql", "docker"],
  "missing_skills": [
    {
      "skill": "kubernetes",
      "importance": 0.90
    }
  ],
  "uncertain_skills": [],
  "evidence_map": {
    "python": {
      "source_section": "technical_skills",
      "evidence": null,
      "has_practical_evidence": false
    },
    "scikit-learn": {
      "source_section": "experience",
      "evidence": "Developed data pipelines and machine learning models using scikit-learn.",
      "has_practical_evidence": true
    }
  },
  "overlap_ratio": 0.75,
  "gap_count": 1,
  "skill_overlap": 0.75
}
```

---

## Usage

### Groq API (Recommended)

1. Create a `.env` file in the project root:
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   GROQ_MODEL=openai/gpt-oss-120b
   ```

2. Run in Python:
   ```python
   from src.skill_engine import SkillPipeline

   pipeline = SkillPipeline()  # Automatically uses Groq with GROQ_MODEL (default openai/gpt-oss-120b)
   report = pipeline.run(resume_sections, jd_text)
   print(report.to_dict())
   ```

---

## Running Tests

```bash
python tests/test_skill_engine.py
```
