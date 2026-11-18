class ContextBuilder:
    @staticmethod
    def build_context(results):
        context = ""

        for result in results:
            context += (
                f"[{result['section'].upper()}]\n"
                f"{result['text']}\n\n"
            )
            
        return context.strip()