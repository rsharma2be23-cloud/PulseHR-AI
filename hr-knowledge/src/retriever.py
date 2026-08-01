import json

from src.config import CHROMA_COLLECTION, CHROMA_PATH, SCORE_THRESHOLD, TOP_K


class KnowledgeRetriever:
    def __init__(self):
        CHROMA_PATH.mkdir(parents=True, exist_ok=True)
        self.collection_path = CHROMA_PATH / f"{CHROMA_COLLECTION}.json"
        self.collection_path.touch(exist_ok=True)

    def _read_collection(self) -> dict:
        if not self.collection_path.exists():
            return {"documents": [], "metadatas": [], "embeddings": [], "ids": []}
        try:
            return json.loads(self.collection_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            return {"documents": [], "metadatas": [], "embeddings": [], "ids": []}

    def search(self, query: str, top_k: int | None = None, category: str | None = None, metadata: dict | None = None, score_threshold: float | None = None) -> list[dict]:
        collection = self._read_collection()
        documents = collection.get("documents", [])
        if not documents:
            return []
        where = dict(metadata or {})
        if category:
            where["category"] = category
        threshold = SCORE_THRESHOLD if score_threshold is None else score_threshold
        results = []
        for document, item_metadata in zip(documents, collection.get("metadatas", [])):
            metadata_matches = True
            if where:
                metadata_matches = all(item_metadata.get(key) == value for key, value in where.items())
            if not metadata_matches:
                continue
            if not document:
                continue
            score = 0.0
            if query and query.lower() in document.lower():
                score = 0.8
            elif query:
                score = 0.5
            if score >= threshold:
                results.append({"text": document, "metadata": {**item_metadata, "page": item_metadata.get("page") or None}, "score": round(score, 6)})
        return results[: max(1, top_k or TOP_K)]
