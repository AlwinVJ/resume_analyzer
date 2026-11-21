from src.services.indexing_service import (
    IndexingService
)

result = (
    IndexingService.build_index()
)

print("\n========== INDEXING ==========\n")

print(result)

print()