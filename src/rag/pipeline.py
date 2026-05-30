from src.rag.context_builder import ContextBuilder

class RAGPipeline:
    def __init__(self, retriever, reranker, query_expander):
        self.retriever = retriever
        self.reranker = reranker
        self.query_expander = query_expander
    
    def run(self, query):
        expanded_query = self.query_expander.expand_query(query)

        retrieved_results = self.retriever.retrieve(expanded_query)

        reranked_results = self.reranker.rerank(expanded_query, retrieved_results)
        context = ContextBuilder.build_context(
            reranked_results
        )
        return context