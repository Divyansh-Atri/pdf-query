import React, { useRef } from 'react';

const Layout = ({ children, onHeaderUploadClick, fileInputRef }) => {
  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 md:px-6 md:py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
          <div className="flex-1 flex justify-center items-center">
            <h1 className="text-lg md:text-xl font-semibold text-gray-900">pdf-query</h1>
          </div>
          
          <div className="flex items-center space-x-2 md:space-x-4">
            <button
              className="bg-gray-100 text-gray-700 px-3 md:px-4 py-2 rounded-lg border border-gray-300 text-xs md:text-base"
              onClick={onHeaderUploadClick}
              type="button"
            >
              Upload PDF
            </button>
            {/* Hidden file input for header upload */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              style={{ display: 'none' }}
              onClick={e => { e.target.value = null; }} // allow re-uploading same file
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  );
};

export default Layout;