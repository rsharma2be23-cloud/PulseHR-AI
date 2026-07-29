from typing import Literal

from pydantic import BaseModel, Field

from src.config import SCORE_THRESHOLD, TOP_K


class MetadataFilter(BaseModel):
    document: str | None = Field(default=None, max_length=300)
    section: str | None = Field(default=None, max_length=300)
    page: int | None = Field(default=None, ge=1)

    def values(self) -> dict:
        return {key: value for key, value in self.model_dump().items() if value is not None}


class SearchRequest(BaseModel):
    query: str = Field(min_length=2, max_length=1000)
    topK: int = Field(default=TOP_K, ge=1, le=20)
    category: str | None = Field(default=None, max_length=100)
    metadata: MetadataFilter | None = None
    scoreThreshold: float = Field(default=SCORE_THRESHOLD, ge=0, le=1)


class IndexResponse(BaseModel):
    indexed: int
    skipped: int
    removed: int
    documents: int
    chunks: int
