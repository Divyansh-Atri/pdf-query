from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func
from datetime import datetime

Base = declarative_base()

class Document(Base):
    __tablename__ = "documents"
    
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, unique=True, index=True)
    original_filename = Column(String)
    file_path = Column(String)
    upload_date = Column(DateTime, default=func.now())
    text_content = Column(Text)
    page_count = Column(Integer)
    file_size = Column(Integer)

class Question(Base):
    __tablename__ = "questions"
    
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, index=True)
    question_text = Column(Text)
    answer_text = Column(Text)
    timestamp = Column(DateTime, default=func.now())