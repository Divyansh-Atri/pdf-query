import React, { useRef, useState } from 'react';
import axios from 'axios';
import { Upload, File, Calendar, FileText } from 'lucide-react';

const FileUpload = ({ 
  onFileUpload, 
  documents, 
  currentDocument, 
  onDocumentSelect, 
  loading 
}) => {
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileUpload = async (file) => {
    if (file.type !== 'application/pdf') {
      alert('Please upload only PDF files');
      return;
    }

    const result = await onFileUpload(file);
    if (!result.success) {
      alert(result.error);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleDeleteDocument = async (doc) => {
    if (!window.confirm(`Are you sure you want to delete '${doc.filename}' and all its chats?`)) return;
    try {
      await axios.delete(`http://localhost:8000/documents/${doc.id}`);
      // Refresh document list
      if (currentDocument && currentDocument.id === doc.id) {
        onDocumentSelect(null);
      }
      // Remove from local list
      if (typeof window !== 'undefined') {
        window.location.reload(); // quick fix to refresh state everywhere
      }
    } catch (e) {
      alert('Failed to delete document.');
    }
  };

  // Sort documents by upload_date descending (most recent first)
  const sortedDocuments = [...documents].sort((a, b) => new Date(b.upload_date) - new Date(a.upload_date));

  return (
    <div className="h-full flex flex-col">
      {/* Upload Area */}
      <div className="mb-4 md:mb-6">
        <h2 className="text-base md:text-lg font-semibold mb-3 md:mb-4">Upload Document</h2>
        <div
          className={`border-2 border-dashed rounded-lg p-4 md:p-6 text-center cursor-pointer transition-colors ${
            dragActive 
              ? 'border-green-500 bg-green-50' 
              : 'border-gray-300 hover:border-green-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-10 h-10 md:w-12 md:h-12 text-gray-400 mx-auto mb-3 md:mb-4" />
          <p className="text-gray-600 mb-1 md:mb-2 text-sm md:text-base">
            {loading ? 'Processing...' : 'Click to upload or drag and drop'}
          </p>
          <p className="text-xs md:text-sm text-gray-500">PDF files only</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileSelect}
            className="hidden"
            disabled={loading}
          />
        </div>
      </div>

      {/* Document List */}
      <div className="flex-1 overflow-y-auto">
        <h3 className="text-sm md:text-md font-semibold mb-3 md:mb-4">Uploaded Documents</h3>
        <div className="space-y-2 md:space-y-3">
          {sortedDocuments.map((doc) => (
            <div
              key={doc.id}
              className={`relative p-3 md:p-4 rounded-lg border cursor-pointer transition-colors ${
                currentDocument?.id === doc.id
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => onDocumentSelect(doc)}
            >
              <div className="flex items-start space-x-3">
                <File className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs md:text-sm font-medium text-gray-900 truncate">
                    {doc.filename}
                  </p>
                  <div className="flex flex-wrap items-center space-x-2 md:space-x-4 mt-1">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-500">
                        {formatDate(doc.upload_date)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <FileText className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-500">
                        {doc.page_count} pages
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatFileSize(doc.file_size)}
                  </p>
                </div>
                {/* Delete button */}
                <button
                  className="ml-2 text-red-500 hover:text-red-700 p-1 rounded focus:outline-none"
                  onClick={e => { e.stopPropagation(); handleDeleteDocument(doc); }}
                  title="Delete document"
                >
                  &#10005;
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FileUpload;