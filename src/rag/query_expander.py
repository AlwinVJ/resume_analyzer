from src.utils.logger import logger

class QueryExpander:
    def __init__(self):
        self.expansion_map = {
            "llm": [
                "transformers",
                "generative ai",
                "nlp"
            ],

            "nlp": [
                "transformers",
                "bert",
                "language models"
            ],

            "machine learning": [
                "deep learning",
                "artificial intelligence",
                "ml"
            ],

            "aws": [
                "cloud",
                "amazon web services"
            ],

            "pytorch": [
                "deep learning",
                "neural networks"
            ]
        }
    
    def expand_query(self, query):
        logger.info(f"Expanding query")
        expanded_terms = [query]
        query_lower = query.lower()

        for key, related_terms in self.expansion_map.items():
            if key in query_lower:
                expanded_terms.extend(related_terms)
        
        expanded_query = " ".join(expanded_terms)

        logger.info(
            f"Expanded Query: "
            f"{expanded_query}"
        )

        return expanded_query