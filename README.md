# Project OmniLog AI

Project OmniLog AI is an intelligent IT operations and knowledge management platform. It transforms scattered IT operational data, such as system manuals, troubleshooting history, and root cause analysis logs, into a structured, searchable, and intelligent knowledge base utilizing LLMs.

## Overview

The platform uses a "Practical Ontology" structure to categorize IT assets (e.g., Service > Module > Architecture). It features a modern, dynamic web UI and a powerful backend powered by FastAPI and PostgreSQL with `pgvector` for semantic search. 

OmniLog AI employs an AI-driven data pipeline to parse uploaded documents, generate summaries, perform self-correction using LangGraph, and save the knowledge as embeddings.

## Features

- **Practical Ontology Management**: Define and manage IT categories hierarchically.
- **Dynamic Semantic Search**: Natural language search over historical operations and error logs using pgvector.
- **AI Summarization Pipeline**: Stateful workflow (LangGraph) for Document Extraction → Summarization → Self-Correction.
- **Verification Workflow**: Draft vs. Published knowledge states allowing Admin review and editing.
- **Async Processing**: Fast background tasks for processing large documents.
- **Premium User Interface**: React-based frontend styled with TailwindCSS, featuring a rich Dashboard and Admin Panel.

## Tech Stack

- **Frontend**: React (Vite), TypeScript, TailwindCSS, lucide-react, react-router-dom.
- **Backend**: FastAPI, SQLAlchemy, LangGraph, LangChain, OpenAI API.
- **Database**: PostgreSQL with `pgvector` extension.
- **Infrastructure**: Docker & Docker Compose.

## Prerequisites

- Docker and Docker Compose
- Node.js (for local frontend development)
- Python 3.10+ (for local backend development)

## Environment Variables

Copy `.env.example` to `.env` and fill in the required values.

```bash
cp .env.example .env
```

### Required Variables:
- `OPENAI_API_KEY`: Required for LLM usage and Embeddings.
- `AZURE_DI_ENDPOINT`: (Phase 2+) Azure Document Intelligence Endpoint.
- `AZURE_DI_KEY`: (Phase 2+) Azure Document Intelligence Authentication Key.
- `DATABASE_URL`: PostgreSQL connection string (defaults to local docker instance).

## Getting Started

1. **Clone the repository:**
   ```bash
   git clone <repo-url>
   cd LogiVOC
   ```

2. **Run with Docker Compose:**
   ```bash
   docker-compose up --build -d
   ```

   This will spin up:
   - `db`: PostgreSQL instance on port `5432`
   - `backend`: FastAPI server on port `8000`
   - `frontend`: React dev server on port `5173`

3. **Access the application:**
   - Frontend UI: [http://localhost:5173](http://localhost:5173)
   - Backend API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)

## Project Phases

- **Phase 1: Scaffold**
  - Database schema setup with pgvector.
  - Basic CRUD for Practical Ontology (categories).
  - Backend and Frontend Docker setup.
  
- **Phase 1.5: UI/UX & Routing**
  - Dashboard and Admin entry pages.
  - Client-side routing with React Router.
  
- **Phase 2.0: Data Pipeline & Verification**
  - Stateful LangGraph pipeline.
  - Mock Azure Document Intelligence parsing.
  - Asynchronous background tasks for file processing.
  - Approval workflow for Knowledge Wiki items (DRAFT to PUBLISHED).

## Future Roadmap (Phases 3+)

- Integration with real Azure Document Intelligence.
- Error Log correlation and Root Cause Analysis (RCA) reporting.
- Anomaly Detection via metrics integration.
- Automated recovery workflows (ChatOps).

## License
MIT License
