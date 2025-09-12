import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * HomeScreen Component - Apple Bento Board Style
 * 
 * Features:
 * - Responsive grid layout with two main tiles
 * - Apple-inspired design with soft gradients and rounded corners
 * - Hover effects and smooth transitions
 * - Navigation to different app sections
 * - Mobile-first responsive design
 */
const HomeScreen: React.FC = () => {
  const navigate = useNavigate();

  const handleRowsClick = () => {
    navigate('/rows');
  };

  const handleChatsClick = () => {
    navigate('/chats');
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      {/* Header */}
      <div className="mb-12 text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
          Message Analyzer Platform
        </h1>
        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto">
          Analyze and optimize your message threads with AI-powered insights
        </p>
      </div>

      {/* Bento Board Grid */}
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Rows Tile */}
          <div 
            onClick={handleRowsClick}
            className="group cursor-pointer bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-8 hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105"
          >
            <div className="flex flex-col items-center text-center">
              {/* Table Icon */}
              <div className="mb-6">
                <svg 
                  className="w-16 h-16 text-white group-hover:scale-110 transition-transform duration-300" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M3 10h18M3 14h18m-9-4v8m-7 0V4a1 1 0 011-1h16a1 1 0 011 1v16a1 1 0 01-1 1H4a1 1 0 01-1-1z" 
                  />
                </svg>
              </div>
              
              {/* Title */}
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                Rows
              </h2>
              
              {/* Description */}
              <p className="text-blue-100 text-lg mb-4">
                View and analyze message threads in a comprehensive table format
              </p>
              
              {/* Features List */}
              <div className="text-blue-200 text-sm space-y-1">
                <div>• Real-time data filtering</div>
                <div>• AI-powered analysis</div>
                <div>• Performance metrics</div>
              </div>
            </div>
          </div>

          {/* Chats Tile */}
          <div 
            onClick={handleChatsClick}
            className="group cursor-pointer bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl p-8 hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300 hover:scale-105"
          >
            <div className="flex flex-col items-center text-center">
              {/* Chat Icon */}
              <div className="mb-6">
                <svg 
                  className="w-16 h-16 text-white group-hover:scale-110 transition-transform duration-300" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
                  />
                </svg>
              </div>
              
              {/* Title */}
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                Chats
              </h2>
              
              {/* Description */}
              <p className="text-purple-100 text-lg mb-4">
                Interactive chat interface with WhatsApp-style conversations
              </p>
              
              {/* Features List */}
              <div className="text-purple-200 text-sm space-y-1">
                <div>• Real-time chat widgets</div>
                <div>• Auto-refresh every 5s</div>
                <div>• Message filtering</div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info Section */}
        <div className="mt-12 text-center">
          <div className="bg-gray-800/50 rounded-xl p-6 max-w-2xl mx-auto">
            <h3 className="text-xl font-semibold text-white mb-3">
              Platform Features
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-300">
              <div className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                AI Analysis
              </div>
              <div className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Real-time Data
              </div>
              <div className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Advanced Filtering
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;
