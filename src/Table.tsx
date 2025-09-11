import React, { useState } from 'react';

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

interface Filters {
  operators: string[];
  models: string[];
  startDate: string;
  endDate: string;
}

interface TableProps {
  threads: Thread[];
  isLoading: boolean;
  filters?: Filters;
}

type SortField = 'thread_id' | 'operator' | 'last_message' | 'converted';
type SortDirection = 'asc' | 'desc';

/**
 * Table Component - Full-Width Optimized Layout
 * 
 * REFACTORED FOR FULL-SCREEN UTILIZATION:
 * - Full-width table with dynamic column widths (table-auto instead of table-fixed)
 * - Compact headers with abbreviated text (e.g., "Ack Score" instead of "Acknowledgment Score")
 * - Smaller padding and font sizes for space efficiency
 * - Horizontal scrolling only when necessary
 * - Full-height container with flex layout
 * - Truncated text with ellipsis for long content
 * 
 * Header Organization:
 * - Group 1: Basic Thread Information (Thread ID, Operator, Last Message)
 * - Group 2: Communication Quality Scores (Acknowledgment, Affection, Personalization, Girl Roleplay Skill)
 * - Group 3: Business Metrics (Sales Ability, Responded, Converted)
 */
const Table: React.FC<TableProps> = ({ threads, isLoading, filters }) => {
  const [sortField, setSortField] = useState<SortField>('last_message');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [messagesToShow, setMessagesToShow] = useState<{ [threadId: string]: number }>({});

  // Use real data from API
  const displayThreads = threads;


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
      // Initialize messages to show for this thread
      if (!messagesToShow[threadId]) {
        setMessagesToShow(prev => ({ ...prev, [threadId]: 10 }));
      }
    }
    setExpandedRows(newExpanded);
  };

  const loadMoreMessages = (threadId: string) => {
    setMessagesToShow(prev => ({
      ...prev,
      [threadId]: (prev[threadId] || 10) + 10
    }));
  };

  const formatMessageDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
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
    <div className="bg-gray-800 rounded-lg overflow-hidden h-full flex flex-col">
      {/* Scrollable Table Container - Full Height */}
      <div className="overflow-x-auto overflow-y-auto flex-1">
        <table className="w-full table-auto divide-y divide-gray-600">
          <thead className="bg-gray-700/50 sticky top-0 z-10">
            <tr>
              {/* Group 1: Basic Thread Information */}
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-600/50 min-w-[120px]" onClick={() => handleSort('thread_id')}>
                Thread ID
                {sortField === 'thread_id' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-600/50 min-w-[100px]" onClick={() => handleSort('operator')}>
                Operator
                {sortField === 'operator' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-600/50 min-w-[120px] border-r border-gray-500" onClick={() => handleSort('last_message')}>
                Last Message
                {sortField === 'last_message' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              
              {/* Group 2: Communication Quality Scores */}
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[100px]">
                Ack Score
              </th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[100px]">
                Affection
              </th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[100px]">
                Personal
              </th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[100px] border-r border-gray-500">
                Roleplay
              </th>
              
              {/* Group 3: Business Metrics */}
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[100px]">
                Sales
              </th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[80px]">
                Responded
              </th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-600/50 min-w-[80px]" onClick={() => handleSort('converted')}>
                Converted
                {sortField === 'converted' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
            </tr>
          </thead>
          <tbody className="bg-transparent divide-y divide-gray-600">
            {sortedThreads.map((thread) => {
              const isExpanded = expandedRows.has(thread.thread_id);
              
              return (
                <React.Fragment key={thread.thread_id}>
                  <tr 
                    className="hover:bg-gray-700/30 cursor-pointer h-10"
                    onClick={() => toggleRowExpansion(thread.thread_id)}
                  >
                    {/* Group 1: Basic Thread Information */}
                    <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-100 truncate">
                      {thread.thread_id}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-100 truncate">
                      {thread.operator}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-100 truncate border-r border-gray-500">
                      {thread.last_message_relative}
                    </td>
                    
                    {/* Group 2: Communication Quality Scores */}
                    <td className="px-3 py-2 whitespace-nowrap text-center">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${formatScore(thread.acknowledgment_score || 0)}`}>
                        {thread.acknowledgment_score || 'N/A'}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-center">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${formatScore(thread.affection_score || 0)}`}>
                        {thread.affection_score || 'N/A'}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-center">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${formatScore(thread.personalization_score || 0)}`}>
                        {thread.personalization_score || 'N/A'}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-center border-r border-gray-500">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${formatScore(thread.girl_roleplay_skill || 0)}`}>
                        {thread.girl_roleplay_skill || 'N/A'}
                      </span>
                    </td>
                    
                    {/* Group 3: Business Metrics */}
                    <td className="px-3 py-2 whitespace-nowrap text-center">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${formatScore(thread.sales_ability || 0)}`}>
                        {thread.sales_ability || 'N/A'}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-center">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        thread.responded === 'Yes' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                      }`}>
                        {thread.responded}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-center">
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
                      <td colSpan={10} className="px-3 py-3 bg-gray-700/30">
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium text-gray-100 mb-2">Thread Details</h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                            <div>
                              <span className="text-gray-400">Model:</span>
                              <span className="text-gray-100 ml-1">{thread.model}</span>
                            </div>
                            <div>
                              <span className="text-gray-400">Messages:</span>
                              <span className="text-gray-100 ml-1">{thread.message_count}</span>
                            </div>
                            <div>
                              <span className="text-gray-400">Avg Response Time:</span>
                              <span className="text-gray-100 ml-1">
                                {thread.avg_response_time ? `${thread.avg_response_time}s` : 'N/A'}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-400">Last Message:</span>
                              <span className="text-gray-100 ml-1">{new Date(thread.last_message).toLocaleString()}</span>
                            </div>
                            <div>
                              <span className="text-gray-400">Sales Ability:</span>
                              <span className="text-gray-100 ml-1">{thread.sales_ability || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-gray-400">Girl Roleplay Skill:</span>
                              <span className="text-gray-100 ml-1">{thread.girl_roleplay_skill || 'N/A'}</span>
                            </div>
                          </div>
                          
                          {/* Messages Display */}
                          {thread.messages && thread.messages.length > 0 && (
                            <div className="mt-3">
                              <h5 className="text-sm font-medium text-gray-100 mb-2">Messages ({thread.messages.length})</h5>
                              <div className="space-y-2 max-h-64 overflow-y-auto">
                                {thread.messages
                                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                                  .slice(0, messagesToShow[thread.thread_id] || 10)
                                  .map((message) => (
                                    <div
                                      key={message.id}
                                      className={`p-2 rounded ${
                                        message.type === 'outgoing'
                                          ? 'bg-blue-900/20 border-l-2 border-blue-500'
                                          : 'bg-gray-700/30 border-l-2 border-gray-500'
                                      }`}
                                    >
                                      <div className="flex justify-between items-start mb-1">
                                        <span className={`text-xs font-medium ${
                                          message.type === 'outgoing' ? 'text-blue-300' : 'text-gray-300'
                                        }`}>
                                          {message.type === 'outgoing' ? 'Operator' : 'Customer'}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                          {formatMessageDate(message.date)}
                                        </span>
                                      </div>
                                      <p className="text-xs text-gray-100 whitespace-pre-wrap break-words">
                                        {message.message}
                                      </p>
                                    </div>
                                  ))}
                              </div>
                              
                              {/* Load More Button */}
                              {thread.messages.length > (messagesToShow[thread.thread_id] || 10) && (
                                <button
                                  onClick={() => loadMoreMessages(thread.thread_id)}
                                  className="mt-2 text-blue-400 hover:text-blue-300 text-xs font-medium"
                                >
                                  Load More Messages ({thread.messages.length - (messagesToShow[thread.thread_id] || 10)} remaining)
                                </button>
                              )}
                            </div>
                          )}
                          
                          {(!thread.messages || thread.messages.length === 0) && (
                            <div className="text-gray-400 text-xs italic">
                              No messages found for this thread.
                            </div>
                          )}
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
      
      {sortedThreads.length === 0 && !isLoading && (
        <div className="text-center py-8">
          <div className="text-gray-300 text-sm">No conversation threads found</div>
          <div className="text-gray-400 text-xs mt-1">
            {filters && (filters.operators.length > 0 || filters.models.length > 0 || filters.startDate || filters.endDate)
              ? 'Try adjusting your filters or clear them to see all data'
              : 'Add conversation data using the API or test with sample data'
            }
          </div>
        </div>
      )}
    </div>
  );
};

export default Table;
