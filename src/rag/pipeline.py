class RAGPipeline:
    def __init__(self, retriever):
        self.retriever = retriever
    
    def run(self, query):
        return self.retriever.retrieve(query)