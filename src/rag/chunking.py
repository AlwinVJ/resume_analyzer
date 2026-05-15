from schemas import Chunk
from src.utils.logger import logger

def chunk_resume_sections(sections: dict):
    chunks = []

    for idx, (section, content) in enumerate(sections.items()):
        chunks.append(
            Chunk(
                chunk_id=idx,
                text=content,
                section=section
            )
        )
    logger.info(f"Created {len(chunks)} chunks")
    return chunks