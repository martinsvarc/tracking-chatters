import React from 'react';

interface HeaderProps {
  stats: {
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
  };
  onRefresh: () => void;
  isLoading: boolean;
}

/**
 * Header Component - Full-Width Responsive Grid Layout
 * 
 * REFACTORED FOR FULL-SCREEN UTILIZATION:
 * - Uses full-width responsive grid (3 cols mobile, 6 cols tablet, 9 cols desktop)
 * - Compact cards with smaller padding and font sizes for space efficiency
 * - No visual dividers - cleaner, uncluttered appearance
 * - All stats visible in single row on desktop, responsive stacking on mobile
 * 
 * Card Organization:
 * - Group 1: Business Overview Metrics (Total Chats, Response Rate, Conversion Rate)
 * - Group 2: Communication Quality Scores (Avg Acknowledgment, Avg Affection, Avg Personalization, Avg Girl Roleplay Skill)
 * - Group 3: Performance Metrics (Avg Sales Ability, Avg Response Time)
 */
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
    <div className="bg-gray-800 p-4">
      {/* Title and Refresh Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gradient-primary">Message Analyzer Platform</h1>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="btn-primary flex items-center gap-3 px-4 py-2 text-sm md:text-base"
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

      {/* Full-width responsive grid layout */}
      <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-9 gap-3 md:gap-4">
        {/* Group 1: Business Overview Metrics */}
        <div className="stats-card-crimson p-3 md:p-4">
          <div className="text-xs md:text-sm font-medium text-gray-300 mb-1">Total Chats</div>
          <div className="text-lg md:text-xl lg:text-2xl font-bold text-gradient-gold">
            {stats.totalChats}
          </div>
        </div>
        <div className="stats-card-primary p-3 md:p-4">
          <div className="text-xs md:text-sm font-medium text-gray-300 mb-1">Response Rate</div>
          <div className={`text-lg md:text-xl lg:text-2xl font-bold stat-glow ${formatScore(stats.responseRate)}`}>
            {stats.responseRate}%
          </div>
        </div>
        <div className="stats-card-crimson p-3 md:p-4">
          <div className="text-xs md:text-sm font-medium text-gray-300 mb-1">Conversion Rate</div>
          <div className={`text-lg md:text-xl lg:text-2xl font-bold stat-glow ${formatScore(stats.conversionRate)}`}>
            {stats.conversionRate}%
          </div>
        </div>

        {/* Group 2: Communication Quality Scores */}
        <div className="stats-card-primary p-3 md:p-4">
          <div className="text-xs md:text-sm font-medium text-gray-300 mb-1">Avg Acknowledgment</div>
          <div className={`text-lg md:text-xl lg:text-2xl font-bold stat-glow ${formatScore(stats.avgAcknowledgment)}`}>
            {stats.avgAcknowledgment}
          </div>
        </div>
        <div className="stats-card-gold p-3 md:p-4">
          <div className="text-xs md:text-sm font-medium text-gray-300 mb-1">Avg Affection</div>
          <div className={`text-lg md:text-xl lg:text-2xl font-bold stat-glow ${formatScore(stats.avgAffection)}`}>
            {stats.avgAffection}
          </div>
        </div>
        <div className="stats-card-gold p-3 md:p-4">
          <div className="text-xs md:text-sm font-medium text-gray-300 mb-1">Avg Personalization</div>
          <div className={`text-lg md:text-xl lg:text-2xl font-bold stat-glow ${formatScore(stats.avgPersonalization)}`}>
            {stats.avgPersonalization}
          </div>
        </div>
        <div className="stats-card-gold p-3 md:p-4">
          <div className="text-xs md:text-sm font-medium text-gray-300 mb-1">Avg Girl Roleplay Skill</div>
          <div className={`text-lg md:text-xl lg:text-2xl font-bold stat-glow ${formatScore(stats.avgGirlRoleplaySkill)}`}>
            {stats.avgGirlRoleplaySkill}
          </div>
        </div>

        {/* Group 3: Performance Metrics */}
        <div className="stats-card-primary p-3 md:p-4">
          <div className="text-xs md:text-sm font-medium text-gray-300 mb-1">Avg Sales Ability</div>
          <div className={`text-lg md:text-xl lg:text-2xl font-bold stat-glow ${formatScore(stats.avgSalesAbility)}`}>
            {stats.avgSalesAbility}
          </div>
        </div>
        <div className="stats-card-crimson p-3 md:p-4">
          <div className="text-xs md:text-sm font-medium text-gray-300 mb-1">Avg Response Time</div>
          <div className="text-lg md:text-xl lg:text-2xl font-bold text-gradient-gold">
            {formatResponseTime(stats.avgResponseTime)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
