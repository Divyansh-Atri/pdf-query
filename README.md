# pdf-query

A modern web application for uploading PDF documents and asking questions about their content using AI-powered natural language processing.

## Features
- Upload PDF documents and extract their text
- Ask questions about uploaded PDFs and get instant answers
- Chat history per document, persisted in the backend
- Delete documents and/or chat history
- Responsive UI for desktop and mobile

## Tech Stack
- **Frontend:** React, Tailwind CSS
- **Backend:** FastAPI, SQLAlchemy, PostgreSQL
- **AI/NLP:** LangChain, OpenAI, HuggingFace Embeddings, ChromaDB
- **PDF Processing:** PyMuPDF (pymupdf)

## Architecture Overview

The application is split into two main parts:

- **Frontend (React):**
  - Provides a modern, responsive user interface for uploading PDFs, viewing documents, and chatting with the AI.
  - Communicates with the backend via HTTP API calls (using Axios).
  - Handles chat history display, document management, and user interactions.

- **Backend (FastAPI):**
  - Exposes REST API endpoints for document upload, question answering, chat history, and document management.
  - Processes uploaded PDFs using PyMuPDF to extract text and metadata.
  - Uses LangChain to split, embed, and store document text in a vector database (ChromaDB), enabling semantic search and question answering.
  - Integrates with OpenAI and HuggingFace models for natural language understanding and response generation.
  - Stores document metadata and chat history in a PostgreSQL database.

**Interaction Flow:**
1. User uploads a PDF via the frontend; the file is sent to the backend for processing and storage.
2. User selects a document and asks questions; the frontend sends these to the backend.
3. The backend uses AI/NLP to answer questions based on the document's content and returns the answer to the frontend.
4. All chat history and document data are persisted in the backend for future retrieval and management.

## Setup Instructions

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd pdf-query
```

### 2. Backend Setup

#### a. Create and configure your environment
- Copy `.env.example` to `.env` and fill in your PostgreSQL credentials:
  ```bash
  cp backend/.env.example backend/.env
  ```
- Edit `backend/.env`:
  ```env
  DATABASE_URL=postgresql://youruser:yourpassword@localhost:5432/pdf_qa
  ```

#### b. Install backend dependencies
```bash
cd backend
pip install -r requirements.txt
```

#### c. Create .env in backend
```env
DATABASE_URL="postgreSQL URL'
OPENAI_API_KEY=
UPLOAD_DIR=
MAX_FILE_SIZE=(in bytes)
```

#### d. Start the backend server
```bash
uvicorn app.main:app --reload
```

The backend will be available at `http://localhost:8000`.

### 3. Frontend Setup

#### a. Install frontend dependencies
```bash
cd ../frontend
npm install
```

#### b. Start the frontend development server
```bash
npm start
```

The frontend will be available at `http://localhost:3000`.

## Environment Variables
- See `backend/.env.example` for required variables.
- The main required variable is `DATABASE_URL` for PostgreSQL connection.

## Usage
1. Open the frontend in your browser (`http://localhost:3000`).
2. Upload a PDF using the sidebar or header button.
3. Select a document to view or chat about it.
4. Ask questions in the chat interface.
5. Delete documents or clear chat history as needed.

## API Endpoints
See the FastAPI docs at `http://localhost:8000/docs` for a full list of endpoints.

## License
[MIT](LICENSE)
