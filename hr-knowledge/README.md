# PulseHR Knowledge Base

This directory holds the local, retrieval-only knowledge foundation for future
PulseHR AI features. It uses FastEmbed to generate local embeddings and a
persistent ChromaDB store. No document text is sent to a paid API and this
service does not generate answers.

## Document organization

Put approved HR source documents in the category folders below. The folder
name becomes the document's `category` metadata and can be used to filter
search results.

```
hr-knowledge/
  policies/          General HR policies
  benefits/          Benefits and insurance guidance
  leave/              Leave and time-off guidance
  payroll/            Payroll and compensation guidance
  performance/       Reviews and feedback guidance
  promotion/         Career progression guidance
  remote-work/       Remote and hybrid work guidance
  travel/            Business travel guidance
  code-of-conduct/   Workplace conduct guidance
```

Supported files are PDF, DOCX, TXT, and Markdown (`.md` / `.markdown`). Keep
one policy per file where possible and use headings in Markdown or Word to
make result sections meaningful. Do not add employee records, credentials, or
other restricted personal data.

## Setup and indexing

```bash
cd hr-knowledge
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python -m src.index_documents
python -m src.server
```

Configuration is read from environment variables listed in `.env.example`.
`python -m src.index_documents` is safe to run repeatedly: unchanged files are
skipped, changed files are replaced, and removed files are deleted from the
collection.

The embedding model is downloaded once on the first indexing or search request
and then reused from the local runtime cache.

## Retrieval API

`POST /search` accepts `query`, optional `topK`, `category`, `metadata`, and
`scoreThreshold`. It returns only matching chunks, metadata, and similarity
scores. The Express endpoint `/api/v1/knowledge/search` is the application
entry point and forwards requests to this local service.
