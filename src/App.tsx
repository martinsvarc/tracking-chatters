import React, { useState, useEffect } from 'react';
import Header from './Header';
import Table from './Table';
import FilterBar from './FilterBar';
import Modal from './Modal';

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
}

interface Filters {
  operators: string[];
  models: string[];
  startDate: string;
  endDate: string;
  lastMessageSince: string;
  showAnalyzedOnly: boolean;
}

// Use relative URLs for Vercel deployment, fallback to localhost for development
const API_BASE_URL = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000');

const App: React.FC = () => {
  const [threads, setThreads] = useState<Thread[]>([]);
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
    totalConverted: 0
  });
  const [filters, setFilters] = useState<Filters>({
    operators: [],
    models: [],
    startDate: '',
    endDate: '',
    lastMessageSince: 'all',
    showAnalyzedOnly: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'query' | 'analysis'>('query');
  const [error, setError] = useState<string | null>(null);

  // Fetch threads from API
  const fetchThreads = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
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

      const response = await fetch(`${API_BASE_URL}/api/threads?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setThreads(data);
    } catch (err) {
      console.error('Error fetching threads:', err);
      setError('Failed to fetch threads. Make sure the backend server is running.');
      // Set empty array as fallback
      setThreads([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch stats from API with filter parameters
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

      const response = await fetch(`${API_BASE_URL}/api/stats?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Error fetching stats:', err);
      // Keep existing stats on error
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

  // Handle refresh filters (for when new data is added)
  const handleRefreshFilters = () => {
    // This will trigger the FilterBar to refresh its options
    // The FilterBar will handle the actual API call
  };

  // Handle AI modal open/close
  const handleAIClick = () => {
    setModalMode('query');
    setIsModalOpen(true);
  };

  const handleRunAIAnalysis = () => {
    setModalMode('analysis');
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  // Handle successful analysis - refresh data to show updated scores
  const handleAnalysisSuccess = () => {
    // Refresh threads and stats to show any updated analysis scores
    fetchThreads();
    fetchStats();
  };

  // Fetch data on component mount and when filters change
  useEffect(() => {
    fetchThreads();
    fetchStats();
  }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header Component - Full Width */}
      <Header 
        stats={stats} 
        onRefresh={handleRefresh} 
        isLoading={isLoading}
      />

      {/* Main Content Area - Grid Layout */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Error Message */}
        {error && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6 mb-8">
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

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Filter Sidebar - Left Column */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <div className="sticky top-8">
              <FilterBar 
                onFiltersChange={handleFiltersChange}
                onAIClick={handleAIClick}
                onRunAIAnalysis={handleRunAIAnalysis}
                onRefreshFilters={handleRefreshFilters}
              />
            </div>
          </div>

          {/* Table Area - Right Columns */}
          <div className="lg:col-span-3 order-1 lg:order-2">
            <Table threads={threads} isLoading={isLoading} filters={filters} />
          </div>
        </div>
      </div>

      {/* Modal Component */}
      <Modal 
        isOpen={isModalOpen}
        onClose={handleModalClose}
        filters={filters}
        mode={modalMode}
        onAnalysisSuccess={handleAnalysisSuccess}
      />
    </div>
  );
};

export default App;