"""
nlp_processor.py - NLP utilities for PDF Q&A app

This module provides the NLPProcessor class, which handles text chunking, embedding, vector storage, and question answering using LangChain and OpenAI.
"""

import os
import logging
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.embeddings import HuggingFaceEmbeddings
from langchain.vectorstores import Chroma
from langchain.llms import OpenAI
from langchain.chains import RetrievalQA
from langchain.docstore.document import Document

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class NLPProcessor:
    def __init__(self):
        """
        Initialize the NLPProcessor.
        Sets up the embedding model, text splitter, and placeholders for vector store and QA chain.
        """
        self.embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2"
        )
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len
        )
        self.vectorstore = None
        self.qa_chain = None

    def process_document(self, text_content: str, document_id: str) -> bool:
        """
        Process the full text of a document:
        - Splits the text into manageable chunks.
        - Embeds and stores the chunks in a persistent vector store (Chroma DB).
        - Sets up a retrieval-based QA chain for answering questions about the document.
        Returns True if successful, False otherwise.
        """
        try:
            # Split the document text into overlapping chunks for better retrieval
            texts = self.text_splitter.split_text(text_content)
            # Wrap each chunk as a LangChain Document with metadata
            documents = [
                Document(
                    page_content=text,
                    metadata={"document_id": document_id, "chunk_id": i}
                )
                for i, text in enumerate(texts)
            ]
            # Create and persist the vector store for this document
            self.vectorstore = Chroma.from_documents(
                documents,
                self.embeddings,
                persist_directory=f"./chroma_db_{document_id}"
            )
            # Set up the QA chain using OpenAI and the retriever
            self.qa_chain = RetrievalQA.from_chain_type(
                llm=OpenAI(temperature=0),
                chain_type="stuff",
                retriever=self.vectorstore.as_retriever(search_kwargs={"k": 3}),
                return_source_documents=True
            )
            return True
        except Exception as e:
            logger.error(f"Error processing document: {str(e)}")
            return False

    def answer_question(self, question: str) -> dict:
        """
        Answer a question using the QA chain for the processed document.
        Returns a dictionary with the answer, source documents, and success status.
        """
        try:
            if not self.qa_chain:
                return {
                    "error": "No document processed yet",
                    "success": False
                }
            # Query the QA chain for an answer
            result = self.qa_chain({"query": question})
            return {
                "answer": result["result"],
                "source_documents": [
                    {
                        "content": doc.page_content,
                        "metadata": doc.metadata
                    }
                    for doc in result["source_documents"]
                ],
                "success": True
            }
        except Exception as e:
            logger.error(f"Error answering question: {str(e)}")
            return {
                "error": str(e),
                "success": False
            }

    def load_existing_vectorstore(self, document_id: str) -> bool:
        """
        Load a previously persisted vector store for a document, if it exists.
        Sets up the retriever and QA chain for answering questions.
        Returns True if successful, False otherwise.
        """
        try:
            persist_directory = f"./chroma_db_{document_id}"
            if os.path.exists(persist_directory):
                self.vectorstore = Chroma(
                    persist_directory=persist_directory,
                    embedding_function=self.embeddings
                )
                self.qa_chain = RetrievalQA.from_chain_type(
                    llm=OpenAI(temperature=0),
                    chain_type="stuff",
                    retriever=self.vectorstore.as_retriever(search_kwargs={"k": 3}),
                    return_source_documents=True
                )
                return True
            return False
        except Exception as e:
            logger.error(f"Error loading vectorstore: {str(e)}")
            return False