import uvicorn

from src.config import KNOWLEDGE_HOST, KNOWLEDGE_PORT


if __name__ == "__main__":
    uvicorn.run("src.main:app", host=KNOWLEDGE_HOST, port=KNOWLEDGE_PORT)
