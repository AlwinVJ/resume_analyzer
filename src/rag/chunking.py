from src.rag.schemas import Chunk

def chunk_resume_sections(sections: dict, source_file: str):
    chunks = []

    for idx, (section, content) in enumerate(sections.items()):
        chunks.append(
            Chunk(
                chunk_id=idx,
                text=content,
                section=section,
                source_file=source_file
            )
        )
    return chunks