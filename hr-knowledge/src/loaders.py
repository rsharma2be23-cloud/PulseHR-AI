from dataclasses import dataclass
from pathlib import Path

from docx import Document
from pypdf import PdfReader


SUPPORTED_EXTENSIONS = {".pdf", ".docx", ".txt", ".md", ".markdown"}


@dataclass(frozen=True)
class SourcePage:
    text: str
    page: int | None = None


def load_document(path: Path) -> list[SourcePage]:
    suffix = path.suffix.lower()
    if suffix == ".pdf":
        reader = PdfReader(str(path))
        return [SourcePage(page.extract_text() or "", index + 1) for index, page in enumerate(reader.pages)]
    if suffix == ".docx":
        document = Document(str(path))
        return [SourcePage("\n".join(paragraph.text for paragraph in document.paragraphs))]
    if suffix in {".txt", ".md", ".markdown"}:
        return [SourcePage(path.read_text(encoding="utf-8", errors="replace"))]
    raise ValueError(f"Unsupported document type: {path.suffix}")
