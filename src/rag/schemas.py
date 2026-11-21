from dataclasses import dataclass

@dataclass
class Chunk:
    chunk_id: int
    text: str
    section: str
    source_file: str
    