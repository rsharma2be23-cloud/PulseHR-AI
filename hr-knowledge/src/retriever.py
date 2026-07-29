import chromadb
from fastembed import TextEmbedding

from src.config import CHROMA_COLLECTION, CHROMA_PATH, EMBEDDING_MODEL, SCORE_THRESHOLD, TOP_K


class KnowledgeRetriever:
    def __init__(self):
        self.client = chromadb.PersistentClient(path=str(CHROMA_PATH))
        self.collection = self.client.get_or_create_collection(CHROMA_COLLECTION, metadata={"hnsw:space": "cosine"})
        self.embedder = TextEmbedding(model_name=EMBEDDING_MODEL)

    def search(self, query: str, top_k: int | None = None, category: str | None = None, metadata: dict | None = None, score_threshold: float | None = None) -> list[dict]:
        if self.collection.count() == 0:
            return []
        where = dict(metadata or {})
        if category:
            where["category"] = category
        vector = next(self.embedder.embed([query])).tolist()
        response = self.collection.query(query_embeddings=[vector], n_results=max(1, top_k or TOP_K), where=where or None, include=["documents", "metadatas", "distances"])
        threshold = SCORE_THRESHOLD if score_threshold is None else score_threshold
        results = []
        for document, item_metadata, distance in zip(response["documents"][0], response["metadatas"][0], response["distances"][0]):
            score = max(0.0, 1.0 - float(distance))
            if score >= threshold:
                results.append({"text": document, "metadata": {**item_metadata, "page": item_metadata.get("page") or None}, "score": round(score, 6)})
        return results
