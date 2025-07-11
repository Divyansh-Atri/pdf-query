"""
main.py - FastAPI backend for PDF Q&A app

This file defines the main API endpoints and application logic for uploading PDFs, processing them, asking questions, and managing chat/document data.
"""

from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, Form, Path
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
import os
import uuid
import shutil
from datetime import datetime

# Import database session and models
from .database import get_db, create_tables
from .models import Document, Question
# Import PDF and NLP processing utilities
from .pdf_processor import PDFProcessor
from .nlp_processor import NLPProcessor

# Create FastAPI app instance
app = FastAPI(title="PDF Question-Answering API", version="1.0.0")

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize PDF and NLP processors
pdf_processor = PDFProcessor()
nlp_processors = {}  # Cache NLPProcessor instances per document

# Ensure database tables exist
create_tables()

@app.on_event("startup")
async def startup_event():
    """
    Application startup event.
    Ensures the uploads directory exists and prints a startup message.
    """
    os.makedirs("uploads", exist_ok=True)
    print("PDF Q&A Application started successfully!")

@app.post("/upload")
async def upload_pdf(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Upload a PDF file, extract its text, and store document info in the database.
    Returns metadata about the uploaded document.
    """
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    try:
        # Generate a unique filename and save the uploaded file
        file_id = str(uuid.uuid4())
        filename = f"{file_id}.pdf"
        file_path = os.path.join("uploads", filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Extract text and metadata from the PDF
        pdf_result = pdf_processor.extract_text_from_pdf(file_path)
        if not pdf_result["success"]:
            raise HTTPException(status_code=500, detail=f"PDF processing failed: {pdf_result['error']}")
        file_info = pdf_processor.get_file_info(file_path)
        if not file_info["success"]:
            raise HTTPException(status_code=500, detail=f"File info extraction failed: {file_info['error']}")

        # Store document metadata in the database
        db_document = Document(
            filename=filename,
            original_filename=file.filename,
            file_path=file_path,
            text_content=pdf_result["full_text"],
            page_count=pdf_result["page_count"],
            file_size=file_info["file_size"]
        )
        db.add(db_document)
        db.commit()
        db.refresh(db_document)

        # Process the document for NLP (vector store, embeddings)
        nlp_processor = NLPProcessor()
        success = nlp_processor.process_document(pdf_result["full_text"], str(db_document.id))
        if success:
            nlp_processors[db_document.id] = nlp_processor

        return JSONResponse(content={
            "message": "PDF uploaded and processed successfully",
            "document_id": db_document.id,
            "filename": file.filename,
            "page_count": pdf_result["page_count"],
            "file_size": file_info["file_size"],
            "nlp_ready": success
        })
    except Exception as e:
        # Clean up file if an error occurs during upload or processing
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@app.post("/ask")
async def ask_question(
    document_id: int = Form(...),
    question: str = Form(...),
    db: Session = Depends(get_db)
):
    """
    Ask a question about a specific uploaded document.
    Uses the NLP processor to generate an answer and stores the Q&A in the database.
    """
    # Ensure the document exists
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    try:
        # Load or initialize the NLP processor for this document
        if document_id not in nlp_processors:
            nlp_processor = NLPProcessor()
            if nlp_processor.load_existing_vectorstore(str(document_id)):
                nlp_processors[document_id] = nlp_processor
            else:
                nlp_processor.process_document(document.text_content, str(document_id))
                nlp_processors[document_id] = nlp_processor
        nlp_processor = nlp_processors[document_id]

        # Get the answer from the NLP chain
        result = nlp_processor.answer_question(question)
        if not result["success"]:
            raise HTTPException(status_code=500, detail=f"Question processing failed: {result['error']}")

        # Store the question and answer in the database
        db_question = Question(
            document_id=document_id,
            question_text=question,
            answer_text=result["answer"]
        )
        db.add(db_question)
        db.commit()

        return JSONResponse(content={
            "answer": result["answer"],
            "question": question,
            "document_filename": document.original_filename,
            "sources": result.get("source_documents", [])
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Question processing failed: {str(e)}")

@app.get("/documents")
async def get_documents(db: Session = Depends(get_db)):
    """
    Retrieve a list of all uploaded documents with their metadata.
    """
    documents = db.query(Document).all()
    return [
        {
            "id": doc.id,
            "filename": doc.original_filename,
            "upload_date": doc.upload_date,
            "page_count": doc.page_count,
            "file_size": doc.file_size
        }
        for doc in documents
    ]

@app.get("/questions/{document_id}")
async def get_questions(document_id: int, db: Session = Depends(get_db)):
    """
    Retrieve all questions and answers (chat history) for a specific document.
    """
    questions = db.query(Question).filter(Question.document_id == document_id).all()
    return [
        {
            "id": q.id,
            "question": q.question_text,
            "answer": q.answer_text,
            "timestamp": q.timestamp
        }
        for q in questions
    ]

@app.delete("/documents/{document_id}")
async def delete_document(document_id: int = Path(...), db: Session = Depends(get_db)):
    """
    Delete a document and all its associated chat history from the database.
    """
    db.query(Question).filter(Question.document_id == document_id).delete()
    db.query(Document).filter(Document.id == document_id).delete()
    db.commit()
    return {"message": "Document and its chats deleted"}

@app.delete("/questions/{document_id}")
async def delete_chats(document_id: int = Path(...), db: Session = Depends(get_db)):
    """
    Delete all chat history (questions/answers) for a specific document.
    """
    db.query(Question).filter(Question.document_id == document_id).delete()
    db.commit()
    return {"message": "All chats for document deleted"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)