from src.parsers.job_description_parser_llm import (
    JobDescriptionParserLLM
)

job_description = """
Job description
Join a growing AI team in Kochi and work on cutting-edge Generative AI, LLMs, and NLP-based applications.

Great opportunity to build impactful AI solutions using Python, RAG pipelines, and modern AI frameworks.

Experience

3–10 Years (flexible for exceptional candidates up to 12 years)

Key Responsibilities
• Design and deploy LLM-based and Generative AI applications
• Build scalable RAG (Retrieval-Augmented Generation) pipelines
• Develop AI agents and agentic workflows using LangGraph
• Implement NLP (Natural Language Processing) solutions
• Work with knowledge graphs and semantic layers
• Build APIs using Python and FastAPI
• Optimize SQL/NoSQL databases for performance
• Contribute to system architecture, microservices, and scalable systems
• Follow CI/CD, Git workflows, and code review practices

Required Skills
• Strong experience in Artificial Intelligence, Machine Learning (ML), and Generative AI (GenAI)
• Hands-on with LLMs, RAG pipelines, NLP
• Experience with LangGraph / AI workflow orchestration
• Proficiency in Python, FastAPI, API development
• Strong knowledge of SQL and NoSQL databases
• Experience in system design and scalable architecture

Good to Have
• Experience with vector databases (Pinecone, FAISS, Weaviate)
• Knowledge of cloud platforms (AWS, Azure, GCP)
• Exposure to MLOps and AI deployment pipelines

Education

Bachelor’s degree in Computer Science, Engineering, or related field (Any Graduate with relevant experience is welcome)

Technology: Artificial Intelligence AI

Job Type: Full Time

Job Location: Kochi

Work Mode: Hybrid

Experience: 3 to 10 Years

Work Shift: India
"""

result = (
    JobDescriptionParserLLM.parse(
        job_description
    )
)

print(type(result))

print()

print(result)