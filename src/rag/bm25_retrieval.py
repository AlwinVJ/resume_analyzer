from rank_bm25 import BM25Okapi

from src.utils.logger import logger

class BM25Retriever:
    def __init__(self, chunks):
        logger.info("Initializing BM25 Retriever...")

        self.chunks = chunks

        tokenized_chunks = [
            chunk.text.lower().split()
            for chunk in chunks
        ]

        self.bm25 = BM25Okapi(tokenized_chunks)

    def retrieve(self, query, top_k=3):
        logger.info("Running BM25 retrieval...")
        tokenized_query = query.lower().split()
        scores = self.bm25.get_scores(tokenized_query)
        ranked_results = sorted(
            enumerate(scores),
            key=lambda x: x[1],
            reverse=True
        )

        results = []
        for idx, score in ranked_results[:top_k]:
            chunk = self.chunks[idx]
            results.append({
                "text": chunk.text,
                "section": chunk.section,
                "source_file": chunk.source_file,
                "bm25_score": float(score)
            })
            
        return results