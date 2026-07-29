import re
from dataclasses import dataclass


HEADING_PATTERN = re.compile(r"^#{1,6}\s+(.+?)\s*$")
SENTENCE_BOUNDARY = re.compile(r"(?<=[.!?])\s+")


@dataclass(frozen=True)
class Chunk:
    text: str
    section: str
    page: int | None


def _split_sections(text: str) -> list[tuple[str, str]]:
    sections: list[tuple[str, str]] = []
    title = "Document"
    lines: list[str] = []
    for line in text.splitlines():
        match = HEADING_PATTERN.match(line)
        if match:
            if "\n".join(lines).strip():
                sections.append((title, "\n".join(lines).strip()))
            title, lines = match.group(1), []
        else:
            lines.append(line)
    if "\n".join(lines).strip():
        sections.append((title, "\n".join(lines).strip()))
    return sections or [("Document", text.strip())]


def _units(text: str) -> list[str]:
    paragraphs = [part.strip() for part in re.split(r"\n\s*\n", text) if part.strip()]
    units: list[str] = []
    for paragraph in paragraphs:
        if len(paragraph) <= 300:
            units.append(paragraph)
        else:
            units.extend(sentence.strip() for sentence in SENTENCE_BOUNDARY.split(paragraph) if sentence.strip())
    return units


def semantic_chunks(text: str, section: str, page: int | None, chunk_size: int, overlap: int) -> list[Chunk]:
    """Create section-aware chunks, preferring paragraph and sentence boundaries."""
    chunks: list[Chunk] = []
    current = ""
    for unit in _units(text):
        if len(unit) > chunk_size:
            unit = unit[:chunk_size]
        candidate = f"{current}\n\n{unit}".strip() if current else unit
        if len(candidate) <= chunk_size:
            current = candidate
            continue
        if current:
            chunks.append(Chunk(current, section, page))
        tail = current[-overlap:] if overlap else ""
        current = f"{tail}\n\n{unit}".strip()
    if current:
        chunks.append(Chunk(current, section, page))
    return chunks


def chunk_pages(pages, chunk_size: int, overlap: int) -> list[Chunk]:
    chunks: list[Chunk] = []
    for source_page in pages:
        for section, text in _split_sections(source_page.text):
            if text:
                chunks.extend(semantic_chunks(text, section, source_page.page, chunk_size, overlap))
    return chunks
