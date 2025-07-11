import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';
import axios from 'axios';

const ChatInterface = ({ currentDocument, onQuestionSubmit, chatHistory, setChatHistory }) => {
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || !currentDocument || isLoading) return;

    setIsLoading(true);
    try {
      await onQuestionSubmit(inputValue);
      setInputValue('');
    } catch (error) {
      setInputValue('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = async () => {
    if (!currentDocument) return;
    if (!window.confirm('Are you sure you want to delete all chats for this document?')) return;
    try {
      await axios.delete(`http://localhost:8000/questions/${currentDocument.id}`);
      // Refetch chat history from backend to ensure it's cleared
      const response = await axios.get(`http://localhost:8000/questions/${currentDocument.id}`);
      setChatHistory(
        response.data.flatMap(q => [
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
        ])
      );
    } catch (e) {
      alert('Failed to clear chat history.');
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!currentDocument) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center">
          <Bot className="w-12 h-12 md:w-16 md:h-16 text-gray-400 mx-auto mb-3 md:mb-4" />
          <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-1 md:mb-2">
            No document selected
          </h3>
          <p className="text-xs md:text-base text-gray-600">
            Please upload or select a PDF document to start asking questions.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Chat Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 md:px-6 md:py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2 md:space-x-3">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-green-500 rounded-full flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-base md:text-lg font-semibold text-gray-900">AI Assistant</h2>
            <p className="text-xs md:text-sm text-gray-500">
              Discussing: {currentDocument.filename}
            </p>
          </div>
        </div>
        {/* Clear Chat Button */}
        <button
          className="text-xs md:text-sm text-red-500 border border-red-200 rounded px-2 py-1 hover:bg-red-50 ml-2"
          onClick={handleClearChat}
          disabled={!chatHistory.length}
        >
          Clear Chat
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 min-h-0 max-h-[60vh] md:max-h-[70vh] overflow-y-auto p-3 md:p-6 space-y-3 md:space-y-4">
        {chatHistory.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-full md:max-w-2xl px-3 md:px-4 py-2 rounded-lg ${
                message.type === 'user'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <div className="flex items-start space-x-2">
                {message.type === 'bot' && (
                  <Bot className="w-4 h-4 md:w-5 md:h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <p className="text-xs md:text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatTime(message.timestamp)}
                  </p>
                </div>
                {message.type === 'user' && (
                  <User className="w-4 h-4 md:w-5 md:h-5 text-green-100 mt-0.5 flex-shrink-0" />
                )}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-3 md:px-4 py-2">
              <div className="flex items-center space-x-2">
                <Bot className="w-4 h-4 md:w-5 md:h-5 text-gray-500" />
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="bg-white border-t border-gray-200 p-3 md:p-4">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Send a message..."
            className="flex-1 px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-xs md:text-base"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="px-3 md:px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-xs md:text-base"
          >
            <Send className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;