# Mapping common abbreviations and tech synonyms to standard names
ALIASES = {
    "ml": "machine learning",
    "dl": "deep learning",
    "nlp": "natural language processing",
    "cv": "computer vision",
    "genai": "generative ai",
    "llms": "llm",
    "scikit learn": "scikit-learn",
    "sklearn": "scikit-learn",
    "tf": "tensorflow",
    "py": "python",
    "js": "javascript",
    "ts": "typescript",
    "golang": "go",
    "reactjs": "react",
    "react.js": "react",
    "nodejs": "node.js",
    "node": "node.js",
    "vuejs": "vue.js",
    "vue": "vue.js",
    "angularjs": "angular",
    "restful api": "rest api",
    "restful apis": "rest api",
    "rest apis": "rest api",
    "postgres": "postgresql",
    "mongo": "mongodb",
    "ms sql": "sql server",
    "mssql": "sql server",
    "aws": "amazon web services",
    "gcp": "google cloud platform",
    "google cloud": "google cloud platform",
    "k8s": "kubernetes",
    "cicd": "ci/cd",
    "docker containers": "docker",
    "docker container": "docker",
}


# Convert skill to lowercase and replace aliases (e.g. k8s -> kubernetes)
def normalize_skill(skill: str) -> str:
    if not skill or not isinstance(skill, str):
        return ""
    cleaned = " ".join(skill.lower().split())
    return ALIASES.get(cleaned, cleaned)


# Normalize a list of skills and remove duplicates
def normalize_skills(skills: list) -> list:
    if not skills:
        return []
    return list(dict.fromkeys(filter(None, (normalize_skill(s) for s in skills))))

