import React, { useState } from 'react';

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
}

interface TableProps {
  threads: Thread[];
  isLoading: boolean;
}

type SortField = 'thread_id' | 'operator' | 'last_message' | 'converted';
type SortDirection = 'asc' | 'desc';

const Table: React.FC<TableProps> = ({ threads, isLoading }) => {
  const [sortField, setSortField] = useState<SortField>('last_message');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Use real data from API or fallback to mock data
  const displayThreads = threads.length > 0 ? threads : [
    {
      thread_id: 'thread_001',
      operator: 'Sarah',
      model: 'Isabella',
      converted: 'Yes',
      last_message: '2024-01-15T10:35:00Z',
      last_message_relative: '3 min ago',
      avg_response_time: 45,
      responded: 'Yes',
      message_count: 5
    },
    {
      thread_id: 'thread_002',
      operator: 'Emma',
      model: 'Sophia',
      converted: null,
      last_message: '2024-01-15T11:05:00Z',
      last_message_relative: '1 hour ago',
      avg_response_time: 120,
      responded: 'Yes',
      message_count: 3
    },
    {
      thread_id: 'thread_003',
      operator: 'Jessica',
      model: 'Claude',
      converted: 'Yes',
      last_message: '2024-01-15T14:21:00Z',
      last_message_relative: '2 hours ago',
      avg_response_time: 30,
      responded: 'No',
      message_count: 8
    }
  ];

  // Mock scoring data - in real app, this would be calculated
  const getMockScores = (threadId: string) => ({
    acknowledgment: Math.floor(Math.random() * 40) + 60, // 60-100
    affection: Math.floor(Math.random() * 40) + 60,
    personalization: Math.floor(Math.random() * 40) + 60
  });

  // Helper function to format relative time
  const formatRelativeTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds} sec ago`;
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} min ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  };

  const formatScore = (score: number) => {
    if (score >= 80) return 'text-green-400 bg-green-900/20';
    if (score >= 50) return 'text-yellow-400 bg-yellow-900/20';
    return 'text-red-400 bg-red-900/20';
  };


  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const toggleRowExpansion = (threadId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(threadId)) {
      newExpanded.delete(threadId);
    } else {
      newExpanded.add(threadId);
    }
    setExpandedRows(newExpanded);
  };

  const sortedThreads = [...displayThreads].sort((a, b) => {
    let aValue: any = a[sortField];
    let bValue: any = b[sortField];

    if (sortField === 'last_message') {
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
    }

    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  if (isLoading) {
    return (
      <div className="glow-card p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-600 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-600 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glow-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full table-fixed divide-y divide-gray-600">
          <thead className="bg-gray-800/50">
            <tr>
              <th className="w-20 px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-700/50" onClick={() => handleSort('thread_id')}>
                Thread ID
                {sortField === 'thread_id' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th className="w-24 px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-700/50" onClick={() => handleSort('operator')}>
                Operator
                {sortField === 'operator' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th className="w-24 px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-700/50" onClick={() => handleSort('last_message')}>
                Last Message
                {sortField === 'last_message' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th className="w-24 px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Acknowledgment Score
              </th>
              <th className="w-24 px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Affection Score
              </th>
              <th className="w-20 px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Responded
              </th>
              <th className="w-24 px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Personalization Score
              </th>
              <th className="w-20 px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-700/50" onClick={() => handleSort('converted')}>
                Converted
                {sortField === 'converted' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
            </tr>
          </thead>
          <tbody className="bg-transparent divide-y divide-gray-600">
            {sortedThreads.map((thread) => {
              const scores = getMockScores(thread.thread_id);
              const isExpanded = expandedRows.has(thread.thread_id);
              
              return (
                <React.Fragment key={thread.thread_id}>
                  <tr 
                    className="hover:bg-gray-700/30 cursor-pointer"
                    onClick={() => toggleRowExpansion(thread.thread_id)}
                  >
                    <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-100">
                      {thread.thread_id}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-100">
                      {thread.operator}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-100">
                      {thread.last_message_relative}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${formatScore(scores.acknowledgment)}`}>
                        {scores.acknowledgment}
                      </span>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${formatScore(scores.affection)}`}>
                        {scores.affection}
                      </span>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        thread.responded === 'Yes' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                      }`}>
                        {thread.responded}
                      </span>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${formatScore(scores.personalization)}`}>
                        {scores.personalization}
                      </span>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        thread.converted === 'Yes' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                      }`}>
                        {thread.converted || 'No'}
                      </span>
                    </td>
                  </tr>
                  
                  {/* Expanded row content */}
                  {isExpanded && (
                    <tr>
                      <td colSpan={8} className="px-3 py-4 bg-gray-800/30">
                        <div className="space-y-2">
                          <h4 className="font-medium text-gray-100 mb-2">Thread Details</h4>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-400">Model:</span>
                              <span className="text-gray-100 ml-2">{thread.model}</span>
                            </div>
                            <div>
                              <span className="text-gray-400">Messages:</span>
                              <span className="text-gray-100 ml-2">{thread.message_count}</span>
                            </div>
                            <div>
                              <span className="text-gray-400">Avg Response Time:</span>
                              <span className="text-gray-100 ml-2">
                                {thread.avg_response_time ? `${thread.avg_response_time}s` : 'N/A'}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-400">Last Message:</span>
                              <span className="text-gray-100 ml-2">{new Date(thread.last_message).toLocaleString()}</span>
                            </div>
                          </div>
                          <button className="text-blue-400 hover:text-blue-300 text-sm font-medium">
                            View All Messages
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {sortedThreads.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-300 text-lg">No threads found</div>
          <div className="text-gray-400 text-sm mt-2">Try adjusting your filters or add some data</div>
        </div>
      )}
    </div>
  );
};

export default Table;
