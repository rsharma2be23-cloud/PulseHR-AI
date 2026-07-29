import os
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent.parent


def env_path(name: str, default: str) -> Path:
    value = Path(os.getenv(name, default))
    return value if value.is_absolute() else (BASE_DIR / value).resolve()


KNOWLEDGE_ROOT = env_path("KNOWLEDGE_ROOT", ".")
CHROMA_PATH = env_path("CHROMA_PATH", ".chroma")
CHROMA_COLLECTION = os.getenv("CHROMA_COLLECTION", "pulsehr_knowledge")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "BAAI/bge-small-en-v1.5")
CHUNK_SIZE = int(os.getenv("CHUNK_SIZE", "900"))
CHUNK_OVERLAP = int(os.getenv("CHUNK_OVERLAP", "160"))
TOP_K = int(os.getenv("TOP_K", "5"))
SCORE_THRESHOLD = float(os.getenv("SCORE_THRESHOLD", "0.2"))
KNOWLEDGE_HOST = os.getenv("KNOWLEDGE_HOST", "127.0.0.1")
KNOWLEDGE_PORT = int(os.getenv("KNOWLEDGE_PORT", "8100"))
MANIFEST_PATH = CHROMA_PATH / "index_manifest.json"

if CHUNK_SIZE <= 0 or CHUNK_OVERLAP < 0 or CHUNK_OVERLAP >= CHUNK_SIZE:
    raise ValueError("CHUNK_SIZE must be positive and CHUNK_OVERLAP must be smaller than CHUNK_SIZE.")
