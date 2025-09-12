import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FilterBar from './FilterBar';

interface Message {
  id: number;
  type: string;
  message: string;
  date: string;
}

interface Thread {
  thread_id: string;
  operator: string;
  model: string;
  converted: string | null;
  last_message: string;
  last_message_relative: string;
  avg_response_time: number | null;
  responded: string;
  message_count: number;
  acknowledgment_score: number | null;
  affection_score: number | null;
  personalization_score: number | null;
  sales_ability: number | null;
  girl_roleplay_skill: number | null;
  messages: Message[];
}

interface Stats {
  avgAcknowledgment: number;
  avgAffection: number;
  avgResponseTime: number;
  avgPersonalization: number;
  avgSalesAbility: number;
  avgGirlRoleplaySkill: number;
  conversionRate: number;
  responseRate: number;
  totalChats: number;
  totalConverted: number;
  operatorMessages60min: number;
  newChats60min: number;
}

interface Filters {
  operators: string[];
  models: string[];
  startDate: string;
  endDate: string;
  lastMessageSince: string;
  showAnalyzedOnly: boolean;
  lastMessageType?: string;
}

// Use relative URLs for Vercel deployment, fallback to localhost for development
const API_BASE_URL = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000');

/**
 * ChatsView Component - WhatsApp-style Chat Interface
 * 
 * Features:
 * - Grid layout with up to 10 chat widgets
 * - WhatsApp/Messenger-style conversation bubbles
 * - Auto-refresh every 5 seconds
 * - Smooth reordering with framer-motion animations
 * - Real-time stats display
 * - FilterBar integration with last message type toggle
 */
const ChatsView: React.FC = () => {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [allThreads, setAllThreads] = useState<Thread[]>([]); // Store all threads for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [stats, setStats] = useState<Stats>({
    avgAcknowledgment: 0,
    avgAffection: 0,
    avgResponseTime: 0,
    avgPersonalization: 0,
    avgSalesAbility: 0,
    avgGirlRoleplaySkill: 0,
    conversionRate: 0,
    responseRate: 0,
    totalChats: 0,
    totalConverted: 0,
    operatorMessages60min: 0,
    newChats60min: 0
  });
  const [filters, setFilters] = useState<Filters>({
    operators: [],
    models: [],
    startDate: '',
    endDate: '',
    lastMessageSince: 'all',
    showAnalyzedOnly: false,
    lastMessageType: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Fetch threads from API with chat view support
  const fetchThreads = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      params.append('chatView', 'true'); // Enable chat view mode
      params.append('limit', '10'); // Limit to 10 chats
      
      if (filters.operators.length > 0) {
        params.append('operator', filters.operators.join(','));
      }
      if (filters.models.length > 0) {
        params.append('model', filters.models.join(','));
      }
      if (filters.startDate) {
        params.append('start', filters.startDate);
      }
      if (filters.endDate) {
        params.append('end', filters.endDate);
      }
      if (filters.lastMessageSince && filters.lastMessageSince !== 'all') {
        params.append('lastMessageSince', filters.lastMessageSince);
      }
      if (filters.showAnalyzedOnly) {
        params.append('analyzedOnly', 'true');
      }
      if (filters.lastMessageType) {
        params.append('lastMessageType', filters.lastMessageType);
      }

      const response = await fetch(`${API_BASE_URL}/api/threads?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Sort by last_message descending
      const sortedThreads = data
        .sort((a: Thread, b: Thread) => new Date(b.last_message).getTime() - new Date(a.last_message).getTime());
      
      setAllThreads(sortedThreads);
      
      // Calculate pagination
      const startIndex = (currentPage - 1) * 10;
      const endIndex = startIndex + 10;
      const paginatedThreads = sortedThreads.slice(startIndex, endIndex);
      
      setThreads(paginatedThreads);
    } catch (err) {
      console.error('Error fetching threads:', err);
      setError('Failed to fetch chats. Make sure the backend server is running.');
      setThreads([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch stats from API
  const fetchStats = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.operators.length > 0) {
        params.append('operator', filters.operators.join(','));
      }
      if (filters.models.length > 0) {
        params.append('model', filters.models.join(','));
      }
      if (filters.startDate) {
        params.append('start', filters.startDate);
      }
      if (filters.endDate) {
        params.append('end', filters.endDate);
      }
      if (filters.lastMessageSince && filters.lastMessageSince !== 'all') {
        params.append('lastMessageSince', filters.lastMessageSince);
      }
      if (filters.showAnalyzedOnly) {
        params.append('analyzedOnly', 'true');
      }
      if (filters.lastMessageType) {
        params.append('lastMessageType', filters.lastMessageType);
      }

      const response = await fetch(`${API_BASE_URL}/api/stats?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  // Handle filter changes
  const handleFiltersChange = (newFilters: Filters) => {
    setFilters(newFilters);
  };

  // Handle refresh button click
  const handleRefresh = () => {
    fetchThreads();
    fetchStats();
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  // Scroll to bottom of chat container
  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  // Handle refresh filters (for when new data is added)
  const handleRefreshFilters = () => {
    // This will trigger the FilterBar to refresh its options
  };

  // Handle AI modal open/close (placeholder)
  const handleAIClick = () => {
    alert('AI Query feature coming soon!');
  };

  const handleRunAIAnalysis = () => {
    alert('AI Analysis feature coming soon!');
  };

  // Format timestamp for display
  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  // Format message for display (handle emojis and long messages)
  const formatMessage = (message: string) => {
    if (message.length > 100) {
      return message.substring(0, 100) + '...';
    }
    return message;
  };

  // Fetch data on component mount and when filters change
  useEffect(() => {
    fetchThreads();
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // Update pagination when allThreads changes
  useEffect(() => {
    const startIndex = (currentPage - 1) * 10;
    const endIndex = startIndex + 10;
    const paginatedThreads = allThreads.slice(startIndex, endIndex);
    setThreads(paginatedThreads);
  }, [allThreads, currentPage]);

  // Scroll to bottom when threads change
  useEffect(() => {
    setTimeout(scrollToBottom, 100); // Small delay to ensure DOM is updated
  }, [threads]);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchThreads();
      fetchStats();
    }, 5000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // Calculate pagination info
  const totalPages = Math.ceil(allThreads.length / 10);
  const startIndex = (currentPage - 1) * 10;

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* Slim Header with Stats Aligned */}
      <div className="bg-gray-800 p-2 border-b border-gray-700">
        <div className="flex justify-between items-center">
          {/* Left: Title */}
          <h1 className="text-xl font-bold text-white">
            Chat View - Message Analyzer Platform
          </h1>
          
          {/* Right: Stats */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-gray-300">Operator Messages Last 60 min:</span>
              <span className="text-blue-400 font-semibold">{stats.operatorMessages60min}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-gray-300">New Chats Last 60 min:</span>
              <span className="text-green-400 font-semibold">{stats.newChats60min}</span>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                  Refreshing...
                </>
              ) : (
                <>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area with Scroll to Bottom */}
      <div className="flex-1 overflow-hidden px-4 py-4 pb-20">
        {/* Error Message */}
        {error && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6 mb-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-300">Connection Error</h3>
                <p className="text-sm text-red-200 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Chat Widgets Container with Reverse Order and Scroll to Bottom */}
        <div 
          ref={chatContainerRef}
          className="overflow-y-auto h-full"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 pb-4">
          <AnimatePresence>
            {threads.map((thread, index) => (
              <motion.div
                key={thread.thread_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="bg-gray-800 rounded-lg shadow-lg h-80 flex flex-col"
              >
                {/* Chat Header - Darker Design */}
                <div className="bg-gray-700 p-3 rounded-t-lg border-b border-gray-600">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-white text-sm">
                        {thread.operator}
                      </h3>
                      <p className="text-xs text-gray-300">{thread.model}</p>
                    </div>
                    <div className="text-xs text-gray-300">
                      {formatTimestamp(thread.last_message)}
                    </div>
                  </div>
                </div>

                {/* Messages Area - Darker Design */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {thread.messages && thread.messages.length > 0 ? (
                    thread.messages
                      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                      .slice(-10) // Show last 10 messages
                      .map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.type === 'outgoing' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                              message.type === 'outgoing'
                                ? 'bg-blue-700 text-white rounded-l-lg'
                                : 'bg-gray-600 text-white rounded-r-lg'
                            }`}
                          >
                            <p className="break-words">{formatMessage(message.message)}</p>
                            <p className={`text-xs mt-1 ${
                              message.type === 'outgoing' ? 'text-blue-200' : 'text-gray-300'
                            }`}>
                              {formatTimestamp(message.date)}
                            </p>
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="text-center text-gray-400 text-sm py-8">
                      No messages yet
                    </div>
                  )}
                </div>

                {/* Chat Footer - Darker Design */}
                <div className="bg-gray-700 p-2 rounded-b-lg border-t border-gray-600">
                  <div className="flex items-center justify-between text-xs text-gray-300">
                    <span>{thread.message_count} messages</span>
                    <span className={`px-2 py-1 rounded ${
                      thread.responded === 'Yes' ? 'bg-green-600 text-green-100' : 'bg-red-600 text-red-100'
                    }`}>
                      {thread.responded}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

            {/* Loading/Empty State */}
            {threads.length === 0 && !isLoading && (
              <div className="col-span-full flex items-center justify-center h-64">
                <div className="text-center text-gray-400">
                  <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p className="text-lg font-medium">No chats found</p>
                  <p className="text-sm">Try adjusting your filters or check back later</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Pagination Navigation */}
        {allThreads.length > 10 && (
          <div className="flex justify-end p-2 mt-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="bg-gray-700 text-white p-2 rounded hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <span className="text-sm text-gray-300 px-3">
                Page {currentPage} of {totalPages}
              </span>
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="bg-gray-700 text-white p-2 rounded hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* FilterBar Component - Fixed Bottom */}
      <FilterBar 
        onFiltersChange={handleFiltersChange}
        onAIClick={handleAIClick}
        onRunAIAnalysis={handleRunAIAnalysis}
        onRefreshFilters={handleRefreshFilters}
      />
    </div>
  );
};

export default ChatsView;
