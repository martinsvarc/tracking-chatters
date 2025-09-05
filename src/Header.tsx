import React from 'react';

interface HeaderProps {
  stats: {
    avgAcknowledgment: number;
    avgAffection: number;
    avgResponseTime: number;
    avgPersonalization: number;
    conversionRate: number;
    responseRate: number;
    totalChats: number;
    totalConverted: number;
  };
  onRefresh: () => void;
  isLoading: boolean;
}

const Header: React.FC<HeaderProps> = ({ stats, onRefresh, isLoading }) => {
  const formatScore = (score: number) => {
    if (score === 0) return 'text-gray-400';
    if (score >= 80) return 'text-green-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  const formatResponseTime = (time: number) => {
    return `${time}s`;
  };


  return (
    <div className="glow-card p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold text-gradient-primary">Message Analyzer Platform</h1>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="btn-primary flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Refreshing...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
        {/* Average Acknowledgment Score */}
        <div className="stats-card-primary p-4">
          <div className="text-sm font-medium text-gray-300 mb-1">Avg Acknowledgment</div>
          <div className={`text-2xl font-bold stat-glow ${formatScore(stats.avgAcknowledgment)}`}>
            {stats.avgAcknowledgment}
          </div>
        </div>

        {/* Average Affection Score */}
        <div className="stats-card-gold p-4">
          <div className="text-sm font-medium text-gray-300 mb-1">Avg Affection</div>
          <div className={`text-2xl font-bold stat-glow ${formatScore(stats.avgAffection)}`}>
            {stats.avgAffection}
          </div>
        </div>

        {/* Average Response Time */}
        <div className="stats-card-crimson p-4">
          <div className="text-sm font-medium text-gray-300 mb-1">Avg Response Time</div>
          <div className="text-2xl font-bold text-gradient-gold">
            {formatResponseTime(stats.avgResponseTime)}
          </div>
        </div>

        {/* Average Personalization Score */}
        <div className="stats-card-gold p-4">
          <div className="text-sm font-medium text-gray-300 mb-1">Avg Personalization</div>
          <div className={`text-2xl font-bold stat-glow ${formatScore(stats.avgPersonalization)}`}>
            {stats.avgPersonalization}
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="stats-card-crimson p-4">
          <div className="text-sm font-medium text-gray-300 mb-1">Conversion Rate</div>
          <div className={`text-2xl font-bold stat-glow ${formatScore(stats.conversionRate)}`}>
            {stats.conversionRate}%
          </div>
        </div>

        {/* Response Rate */}
        <div className="stats-card-primary p-4">
          <div className="text-sm font-medium text-gray-300 mb-1">Response Rate</div>
          <div className={`text-2xl font-bold stat-glow ${formatScore(stats.responseRate)}`}>
            {stats.responseRate}%
          </div>
        </div>

        {/* Total Chats */}
        <div className="stats-card-crimson p-4">
          <div className="text-sm font-medium text-gray-300 mb-1">Total Chats</div>
          <div className="text-2xl font-bold text-gradient-gold">
            {stats.totalChats}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
