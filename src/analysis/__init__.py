"""Single-resume analysis used by POST /analyze.

    pdf_text      -> validate the upload and extract text
    jd_cache      -> parse each job description once (LLM) and remember it
    profile       -> one LLM call: candidate name, roles with dates, qualifications
    dates         -> date parsing and month arithmetic (pure Python, no LLM)
    experience    -> total / relevant / internship months + compatibility
    education     -> degree levels + compatibility against the JD requirement
    semantic      -> embedding similarity between resume and JD
    service       -> runs everything and builds the MatchResult
"""
