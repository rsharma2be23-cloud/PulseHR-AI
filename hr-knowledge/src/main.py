from contextlib import asynccontextmanager

from fastapi import FastAPI

from src.indexer import KnowledgeIndexer
from src.retriever import KnowledgeRetriever
from src.schemas import IndexResponse, SearchRequest


@asynccontextmanager
async def lifespan(_: FastAPI):
    try:
        index_result = KnowledgeIndexer().index()
        print(f"[HR Knowledge] Initial index complete: {index_result}")
    except Exception as error:
        print(f"[HR Knowledge] Initial index failed: {error}")
    yield


app = FastAPI(title="PulseHR Knowledge Retrieval Service", version="1.0.0", lifespan=lifespan)
retriever = KnowledgeRetriever()


@app.get("/health")
def health() -> dict:
    collection = retriever._read_collection()
    return {"success": True, "chunks": len(collection.get("documents", []))}


@app.post("/search")
def search(request: SearchRequest) -> dict:
    return {"results": retriever.search(request.query, request.topK, request.category, request.metadata.values() if request.metadata else None, request.scoreThreshold)}


@app.post("/index", response_model=IndexResponse)
def index_documents() -> dict:
    return KnowledgeIndexer().index()
