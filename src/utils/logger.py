import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

# The embedding model's download library logs every HTTP request at INFO; keep only warnings.
for _name in ("httpx", "httpcore", "huggingface_hub", "sentence_transformers", "urllib3"):
    logging.getLogger(_name).setLevel(logging.WARNING)

logger = logging.getLogger(__name__)