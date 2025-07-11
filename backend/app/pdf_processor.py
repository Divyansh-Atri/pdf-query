"""
pdf_processor.py - PDF file handling utilities for PDF Q&A app

This module provides the PDFProcessor class, which is responsible for extracting text and metadata from PDF files using PyMuPDF (pymupdf).
"""

import pymupdf
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PDFProcessor:
    def __init__(self, upload_dir: str = "uploads"):
        """
        Initialize the PDFProcessor.
        Ensures the upload directory exists for storing PDF files.
        """
        self.upload_dir = upload_dir
        os.makedirs(upload_dir, exist_ok=True)

    def extract_text_from_pdf(self, file_path: str) -> dict:
        """
        Extract all text from a PDF file, page by page.
        Returns a dictionary with the full text, per-page texts, page count, and success status.
        """
        try:
            doc = pymupdf.open(file_path)
            text_content = ""
            page_texts = []
            # Iterate through each page and extract its text
            for page_num in range(len(doc)):
                page = doc[page_num]
                page_text = page.get_text()
                text_content += page_text + "\n\n"
                page_texts.append({
                    "page": page_num + 1,
                    "text": page_text
                })
            doc.close()
            return {
                "full_text": text_content,
                "page_texts": page_texts,
                "page_count": len(page_texts),
                "success": True
            }
        except Exception as e:
            logger.error(f"Error processing PDF: {str(e)}")
            return {
                "error": str(e),
                "success": False
            }

    def get_file_info(self, file_path: str) -> dict:
        """
        Get basic file information such as file size (in bytes).
        Returns a dictionary with file size and success status.
        """
        try:
            file_size = os.path.getsize(file_path)
            return {
                "file_size": file_size,
                "success": True
            }
        except Exception as e:
            return {
                "error": str(e),
                "success": False
            }