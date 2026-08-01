import hashlib
import json
from pathlib import Path

from src.chunking import chunk_pages
from src.config import CHROMA_COLLECTION, CHROMA_PATH, CHUNK_OVERLAP, CHUNK_SIZE, KNOWLEDGE_ROOT, MANIFEST_PATH
from src.loaders import SUPPORTED_EXTENSIONS, load_document


def _hash_file(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


class KnowledgeIndexer:
    def __init__(self):
        CHROMA_PATH.mkdir(parents=True, exist_ok=True)
        self.collection_path = CHROMA_PATH / f"{CHROMA_COLLECTION}.json"
        self.collection_path.touch(exist_ok=True)
        self.collection = self._read_collection()

    def _manifest(self) -> dict:
        if not MANIFEST_PATH.exists():
            return {"documents": {}}
        return json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))

    def _read_collection(self) -> dict:
        if not self.collection_path.exists():
            return {"documents": [], "metadatas": [], "embeddings": []}
        try:
            return json.loads(self.collection_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            return {"documents": [], "metadatas": [], "embeddings": []}

    def _write_collection(self, payload: dict) -> None:
        self.collection_path.write_text(json.dumps(payload, indent=2, sort_keys=True), encoding="utf-8")

    def _save_manifest(self, manifest: dict) -> None:
        MANIFEST_PATH.write_text(json.dumps(manifest, indent=2, sort_keys=True), encoding="utf-8")

    def _document_paths(self) -> list[Path]:
        return sorted(
            path
            for path in KNOWLEDGE_ROOT.rglob("*")
            if path.is_file()
            and path.suffix.lower() in SUPPORTED_EXTENSIONS
            and len(path.relative_to(KNOWLEDGE_ROOT).parts) > 1
            and not any(part.startswith(".") for part in path.relative_to(KNOWLEDGE_ROOT).parts)
        )

    def _delete(self, entry: dict) -> None:
        ids = entry.get("chunk_ids", [])
        if not ids:
            return
        remaining_documents = []
        remaining_metadatas = []
        remaining_embeddings = []
        for item_id, document, metadata, embedding in zip(self.collection.get("ids", []), self.collection.get("documents", []), self.collection.get("metadatas", []), self.collection.get("embeddings", [])):
            if item_id in ids:
                continue
            remaining_documents.append(document)
            remaining_metadatas.append(metadata)
            remaining_embeddings.append(embedding)
        self.collection = {"documents": remaining_documents, "metadatas": remaining_metadatas, "embeddings": remaining_embeddings, "ids": [item_id for item_id in self.collection.get("ids", []) if item_id not in ids]}
        self._write_collection(self.collection)

    def _index_document(self, path: Path, relative_path: str, content_hash: str) -> dict:
        chunks = chunk_pages(load_document(path), CHUNK_SIZE, CHUNK_OVERLAP)
        category = Path(relative_path).parts[0] if len(Path(relative_path).parts) > 1 else "general"
        ids = [hashlib.sha256(f"{relative_path}:{content_hash}:{index}".encode()).hexdigest() for index in range(len(chunks))]
        if chunks:
            texts = [chunk.text for chunk in chunks]
            metadata = [{"document": relative_path, "section": chunk.section, "page": chunk.page or 0, "category": category} for chunk in chunks]
            existing_ids = self.collection.get("ids", [])
            self.collection = {
                "ids": [*existing_ids, *ids],
                "documents": [*self.collection.get("documents", []), *texts],
                "metadatas": [*self.collection.get("metadatas", []), *metadata],
                "embeddings": [*self.collection.get("embeddings", []), *([[]] * len(chunks))],
            }
            self._write_collection(self.collection)
        return {"hash": content_hash, "chunk_ids": ids}

    def index(self) -> dict:
        manifest = self._manifest()
        known = manifest.get("documents", {})
        current = {path.relative_to(KNOWLEDGE_ROOT).as_posix(): path for path in self._document_paths()}
        indexed = skipped = removed = 0
        for relative_path in set(known) - set(current):
            self._delete(known.pop(relative_path))
            removed += 1
        for relative_path, path in current.items():
            content_hash = _hash_file(path)
            if known.get(relative_path, {}).get("hash") == content_hash:
                skipped += 1
                continue
            if relative_path in known:
                self._delete(known[relative_path])
            known[relative_path] = self._index_document(path, relative_path, content_hash)
            indexed += 1
        manifest["documents"] = known
        self._save_manifest(manifest)
        return {"indexed": indexed, "skipped": skipped, "removed": removed, "documents": len(known), "chunks": len(self.collection.get("documents", []))}
