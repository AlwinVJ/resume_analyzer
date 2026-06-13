from src.parsers.resume_loader import ResumeLoader

from src.rag.chunking import chunk_resume_sections

from src.rag.embedding import EmbeddingModel

from src.rag.indexing import VectorIndex

from src.utils.logger import logger


class IndexingService:

    @classmethod
    def build_index(cls, resumes_directory="data/resumes", index_path="storage/faiss_index.bin", metadata_path="storage/metadata.pkl"):

        logger.info("Starting resume indexing")

        parsed_resumes = (
            ResumeLoader.load_resumes(
                resumes_directory
            )
        )

        all_chunks = []

        chunk_id = 0

        for resume in parsed_resumes:

            chunks = (
                chunk_resume_sections(
                    sections=resume["sections"],
                    source_file=resume["file_name"]
                )
            )

            for chunk in chunks:

                chunk.chunk_id = chunk_id

                all_chunks.append(chunk)

                chunk_id += 1

        logger.info(
            f"Created {len(all_chunks)} chunks"
        )

        texts = [
            chunk.text
            for chunk in all_chunks
        ]

        model = EmbeddingModel()

        embeddings = model.encode(texts)

        dimension = embeddings.shape[1]

        index = VectorIndex(dimension)

        index.add_embeddings(embeddings)

        index.save_index(index_path)

        index.save_metadata(all_chunks, metadata_path)

        logger.info(
            "Resume indexing completed"
        )

        return {
            "num_resumes": len(parsed_resumes),
            "num_chunks": len(all_chunks)
        }