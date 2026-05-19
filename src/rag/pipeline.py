from src.rag.context_builder import ContextBuilder

class RAGPipeline:
    def __init__(self, retriever):
        self.retriever = retriever
    
    def run(self, query):
        retrieved_chunks = self.retriever.retrieve(query)
        context = ContextBuilder.build_context(
            retrieved_chunks
        )
        return context