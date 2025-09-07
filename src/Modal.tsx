import React, { useState } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: {
    operators: string[];
    models: string[];
    startDate: string;
    endDate: string;
  };
  mode: 'query' | 'analysis';
  onAnalysisSuccess?: () => void;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, filters, mode, onAnalysisSuccess }) => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // AI Analysis specific state
  const [chatCount, setChatCount] = useState(100);
  const [threadDepth, setThreadDepth] = useState(30);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === 'query' && !query.trim()) return;
    if (mode === 'analysis' && (chatCount <= 0 || threadDepth <= 0)) return;

    setIsLoading(true);
    
    try {
      if (mode === 'query') {
        // Mock AI response for query mode - in real app, this would call the backend API
        setTimeout(() => {
          const mockResponse = `Analyzing selected data based on your query: "${query}"

Based on the current filters:
- Operators: ${filters.operators.length > 0 ? filters.operators.join(', ') : 'All'}
- Models: ${filters.models.length > 0 ? filters.models.join(', ') : 'All'}
- Date Range: ${filters.startDate || 'No start date'} to ${filters.endDate || 'No end date'}

Here's what I found:
• The selected conversations show an average acknowledgment score of 78
• Response times are averaging 45 seconds
• Personalization scores are highest for Sarah and Emma operators
• GPT-4 model shows better conversion rates compared to other models

Recommendations:
1. Focus on improving response times for better user engagement
2. Consider training operators on personalization techniques
3. Monitor GPT-4 performance for potential scaling

This is a mock response. In the real implementation, this would analyze actual filtered data from your database.`;
          setResponse(mockResponse);
          setIsLoading(false);
        }, 2000);
      } else {
        // Real API call for analysis mode
        const API_BASE_URL = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000');
        
        const analysisPayload = {
          filters: {
            operators: filters.operators,
            models: filters.models,
            startDate: filters.startDate,
            endDate: filters.endDate
          },
          numberOfChats: chatCount,
          threadDepth: threadDepth
        };

        console.log('🚀 Sending analysis request:', analysisPayload);

        const response = await fetch(`${API_BASE_URL}/api/analyze`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(analysisPayload)
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('✅ Analysis response:', result);

        // Call success callback to refresh data if analysis was successful
        if (result.webhookSuccess && onAnalysisSuccess) {
          onAnalysisSuccess();
        }

        setResponse(`AI Analysis Results

Analysis Parameters:
- Chat Count: ${chatCount} conversations
- Thread Depth: ${threadDepth} messages per thread
- Applied Filters: ${filters.operators.length > 0 ? filters.operators.join(', ') : 'All operators'}, ${filters.models.length > 0 ? filters.models.join(', ') : 'All models'}
- Timeframe: ${filters.startDate || 'No start date'} to ${filters.endDate || 'No end date'}

Analysis Summary:
• Successfully sent ${result.threadsAnalyzed || 0} threads to webhook for analysis
• Payload sent to: https://n8n.automatedsolarbiz.com/webhook/b69cd496-1b6d-42f5-88c8-4af3697c2db8
• Webhook response: ${result.webhookSuccess ? 'Success' : 'Failed'}

Next Steps:
1. The webhook will process the thread data and perform AI analysis
2. Analysis results will be returned via the webhook callback
3. Scores will be automatically updated in the database
4. Data has been refreshed to show any updated analysis scores

Status: ${result.webhookSuccess ? '✅ Analysis sent successfully!' : '❌ Failed to send analysis'}

This analysis has been sent to the external AI processing service for comprehensive evaluation.`);
      }
    } catch (error) {
      console.error('❌ Error during analysis:', error);
      setResponse(`❌ Analysis Failed

Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}

Please check:
1. Backend server is running
2. Database connection is active
3. Webhook URL is accessible
4. Network connectivity is stable

Try again or contact support if the issue persists.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setQuery('');
    setResponse('');
    setIsLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-gray-600">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-600">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">
                {mode === 'query' ? 'AI Query Assistant' : 'Run AI Analysis'}
              </h2>
              <p className="text-sm text-gray-300">
                {mode === 'query' ? 'Ask questions about your filtered data' : 'Configure and run comprehensive analysis'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-200 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Active Filters Display */}
        <div className="p-4 bg-gray-700 border-b border-gray-600">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-gray-200">Active Filters:</span>
            {filters.operators.length > 0 && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-900/30 text-blue-300">
                Operators: {filters.operators.join(', ')}
              </span>
            )}
            {filters.models.length > 0 && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-900/30 text-green-300">
                Models: {filters.models.join(', ')}
              </span>
            )}
            {filters.startDate && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-900/30 text-purple-300">
                From: {filters.startDate}
              </span>
            )}
            {filters.endDate && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-900/30 text-purple-300">
                To: {filters.endDate}
              </span>
            )}
            {filters.operators.length === 0 && filters.models.length === 0 && !filters.startDate && !filters.endDate && (
              <span className="text-sm text-gray-400">No filters applied - analyzing all data</span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Form Input */}
          <form onSubmit={handleSubmit} className="mb-6">
            <div className="space-y-4">
              {mode === 'query' ? (
                <div>
                  <label htmlFor="query" className="block text-sm font-medium text-gray-200 mb-2">
                    Ask a question about your data
                  </label>
                  <textarea
                    id="query"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="e.g., Which operator has the highest conversion rate? What are the trends in response times? How can we improve personalization scores?"
                    className="w-full px-4 py-3 border border-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none bg-gray-700 text-white placeholder-gray-400"
                    rows={3}
                    disabled={isLoading}
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="chatCount" className="block text-sm font-medium text-gray-200 mb-2">
                        Number of Chats
                      </label>
                      <input
                        type="number"
                        id="chatCount"
                        value={chatCount}
                        onChange={(e) => setChatCount(parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-700 text-white"
                        min="1"
                        max="10000"
                        disabled={isLoading}
                      />
                    </div>
                    <div>
                      <label htmlFor="threadDepth" className="block text-sm font-medium text-gray-200 mb-2">
                        Thread Depth (messages)
                      </label>
                      <input
                        type="number"
                        id="threadDepth"
                        value={threadDepth}
                        onChange={(e) => setThreadDepth(parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-700 text-white"
                        min="1"
                        max="1000"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </div>
              )}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={
                    (mode === 'query' && !query.trim()) || 
                    (mode === 'analysis' && (chatCount <= 0 || threadDepth <= 0)) ||
                    isLoading
                  }
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      {mode === 'query' ? 'Analyzing...' : 'Running Analysis...'}
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      {mode === 'query' ? 'Analyze Data' : 'Run Analysis'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* Response Area */}
          {response && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-900/30 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-white">Analysis Results</h3>
              </div>
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap text-sm text-gray-200 font-sans leading-relaxed">
                    {response}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-300">Analyzing your data...</p>
                <p className="text-sm text-gray-400 mt-1">This may take a few moments</p>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!response && !isLoading && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">
                {mode === 'query' ? 'Ask a Question' : 'Configure Analysis'}
              </h3>
              <p className="text-gray-300 max-w-md mx-auto">
                {mode === 'query' 
                  ? 'Use the AI assistant to analyze your conversation data. Ask questions about performance metrics, trends, or optimization opportunities.'
                  : 'Configure the analysis parameters to run a comprehensive analysis of your conversation data. Set the timeframe, chat count, and thread depth.'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;
