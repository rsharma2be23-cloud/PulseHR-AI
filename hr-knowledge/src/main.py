from fastapi import FastAPI

from src.indexer import KnowledgeIndexer
from src.retriever import KnowledgeRetriever
from src.schemas import IndexResponse, SearchRequest


app = FastAPI(title="PulseHR Knowledge Retrieval Service", version="1.0.0")
retriever = KnowledgeRetriever()


@app.get("/health")
def health() -> dict:
    return {"success": True, "chunks": retriever.collection.count()}


@app.post("/search")
def search(request: SearchRequest) -> dict:
    return {"results": retriever.search(request.query, request.topK, request.category, request.metadata.values() if request.metadata else None, request.scoreThreshold)}


@app.post("/index", response_model=IndexResponse)
def index_documents() -> dict:
    return KnowledgeIndexer().index()
