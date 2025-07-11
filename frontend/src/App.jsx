import React, { useState, useEffect, useRef } from 'react';
import ChatInterface from './components/ChatInterface';
import FileUpload from './components/FileUpload';
import Layout from './components/Layout';
import axios from 'axios';
import './App.css';

const API_BASE_URL = 'http://localhost:8000';

function App() {
  const [currentDocument, setCurrentDocument] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const headerFileInputRef = useRef(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    if (currentDocument) {
      fetchChatHistory(currentDocument.id).then(setChatHistory);
    } else {
      setChatHistory([]);
    }
  }, [currentDocument]);

  const fetchDocuments = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/documents`);
      setDocuments(response.data);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const fetchChatHistory = async (documentId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/questions/${documentId}`);
      // Transform backend data to ChatInterface format
      return response.data.flatMap(q => [
        {
          id: `q-${q.id}`,
          type: 'user',
          content: q.question,
          timestamp: new Date(q.timestamp)
        },
        {
          id: `a-${q.id}`,
          type: 'bot',
          content: q.answer,
          timestamp: new Date(q.timestamp)
        }
      ]);
    } catch (error) {
      return [];
    }
  };

  const handleFileUpload = async (file) => {
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const newDocument = {
        id: response.data.document_id,
        filename: response.data.filename,
        page_count: response.data.page_count,
        file_size: response.data.file_size,
        upload_date: new Date().toISOString(),
      };

      setDocuments([...documents, newDocument]);
      setCurrentDocument(newDocument);
      setLoading(false);
      
      return { success: true, document: newDocument };
    } catch (error) {
      setLoading(false);
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Upload failed' 
      };
    }
  };

  const handleQuestionSubmit = async (question) => {
    if (!currentDocument) return { success: false, error: 'No document selected' };

    const formData = new FormData();
    formData.append('document_id', currentDocument.id);
    formData.append('question', question);

    try {
      const response = await axios.post(`${API_BASE_URL}/ask`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Append new Q&A to chat history
      setChatHistory(prev => [
        ...prev,
        {
          id: `q-${Date.now()}`,
          type: 'user',
          content: question,
          timestamp: new Date()
        },
        {
          id: `a-${Date.now() + 1}`,
          type: 'bot',
          content: response.data.answer,
          timestamp: new Date()
        }
      ]);

      return { success: true, data: response.data };
    } catch (error) {
      setChatHistory(prev => [
        ...prev,
        {
          id: `q-${Date.now()}`,
          type: 'user',
          content: question,
          timestamp: new Date()
        },
        {
          id: `a-${Date.now() + 1}`,
          type: 'bot',
          content: error.response?.data?.detail || 'Question processing failed',
          timestamp: new Date()
        }
      ]);
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Question processing failed' 
      };
    }
  };

  // Handler for header upload button
  const handleHeaderUploadClick = () => {
    if (headerFileInputRef.current) {
      headerFileInputRef.current.click();
    }
  };

  // Handler for header file input change
  const handleHeaderFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      await handleFileUpload(file);
    }
  };

  return (
    <Layout onHeaderUploadClick={handleHeaderUploadClick} fileInputRef={headerFileInputRef}>
      <div className="h-full flex flex-col md:flex-row">
        {/* Sidebar toggle for all screens */}
        {!sidebarOpen && (
          <button
            className="fixed top-4 left-4 z-30 bg-green-500 text-white p-2 rounded-full shadow-lg focus:outline-none md:top-6 md:left-6"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}

        {/* Sidebar overlay for mobile and desktop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-40 z-20"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div
          className={`fixed z-30 top-0 left-0 h-full w-4/5 max-w-xs md:w-1/3 bg-white border-r border-gray-200 p-4 md:p-6 transform transition-transform duration-300 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
          style={{ boxShadow: sidebarOpen ? '0 2px 8px rgba(0,0,0,0.15)' : 'none' }}
        >
          {/* Close button for all screens */}
          <div className="flex justify-end mb-2">
            <button
              className="text-gray-500 hover:text-gray-700 p-1"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <FileUpload
            onFileUpload={handleFileUpload}
            documents={documents}
            currentDocument={currentDocument}
            onDocumentSelect={doc => {
              setCurrentDocument(doc);
              setSidebarOpen(false);
            }}
            loading={loading}
          />
        </div>

        {/* Right Panel - Chat Interface */}
        <div className={`flex-1 md:w-2/3 flex flex-col ml-0 md:ml-0 transition-all duration-300 ${sidebarOpen ? 'pointer-events-none select-none opacity-30' : ''}`} style={{ minHeight: 0 }}>
          <ChatInterface
            currentDocument={currentDocument}
            onQuestionSubmit={handleQuestionSubmit}
            chatHistory={chatHistory}
            setChatHistory={setChatHistory}
          />
        </div>
      </div>
      {/* Hidden file input for header upload, with onChange handler */}
      <input
        ref={headerFileInputRef}
        type="file"
        accept=".pdf"
        style={{ display: 'none' }}
        onChange={handleHeaderFileChange}
      />
    </Layout>
  );
}

export default App;