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
 * Header Component with Reorganized Stats Cards and Logical Groupings
 * 
 * Card Organization:
 * - Group 1: Business Overview Metrics (Total Chats, Response Rate, Conversion Rate)
 * - Group 2: Communication Quality Scores (Avg Acknowledgment, Avg Affection, Avg Personalization, Avg Girl Roleplay Skill)
 * - Group 3: Performance Metrics (Avg Sales Ability, Avg Response Time)
 * 
 * Visual dividers separate each group for enhanced UI clarity
 * Responsive design: stacks vertically on mobile, horizontal on desktop
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
    <div className="glow-card p-4 lg:p-8 mb-6 lg:mb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 lg:mb-8 gap-4">
        <h1 className="text-2xl lg:text-4xl font-bold text-gradient-primary">Message Analyzer Platform</h1>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="btn-primary flex items-center gap-3 px-4 lg:px-6 py-2 lg:py-3 text-base lg:text-lg"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Refreshing...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </>
          )}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
        {/* Group 1: Business Overview Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6 flex-1">
          <div className="stats-card-crimson p-4 lg:p-6">
            <div className="text-sm lg:text-base font-medium text-gray-300 mb-1 lg:mb-2">Total Chats</div>
            <div className="text-2xl lg:text-3xl font-bold text-gradient-gold">
              {stats.totalChats}
            </div>
          </div>
          <div className="stats-card-primary p-4 lg:p-6">
            <div className="text-sm lg:text-base font-medium text-gray-300 mb-1 lg:mb-2">Response Rate</div>
            <div className={`text-2xl lg:text-3xl font-bold stat-glow ${formatScore(stats.responseRate)}`}>
              {stats.responseRate}%
            </div>
          </div>
          <div className="stats-card-crimson p-4 lg:p-6">
            <div className="text-sm lg:text-base font-medium text-gray-300 mb-1 lg:mb-2">Conversion Rate</div>
            <div className={`text-2xl lg:text-3xl font-bold stat-glow ${formatScore(stats.conversionRate)}`}>
              {stats.conversionRate}%
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="hidden lg:block w-px bg-gray-600 mx-2"></div>

        {/* Group 2: Communication Quality Scores */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 flex-1">
          <div className="stats-card-primary p-4 lg:p-6 border-l-2 border-gray-600 lg:border-l-0">
            <div className="text-sm lg:text-base font-medium text-gray-300 mb-1 lg:mb-2">Avg Acknowledgment</div>
            <div className={`text-2xl lg:text-3xl font-bold stat-glow ${formatScore(stats.avgAcknowledgment)}`}>
              {stats.avgAcknowledgment}
            </div>
          </div>
          <div className="stats-card-gold p-4 lg:p-6">
            <div className="text-sm lg:text-base font-medium text-gray-300 mb-1 lg:mb-2">Avg Affection</div>
            <div className={`text-2xl lg:text-3xl font-bold stat-glow ${formatScore(stats.avgAffection)}`}>
              {stats.avgAffection}
            </div>
          </div>
          <div className="stats-card-gold p-4 lg:p-6">
            <div className="text-sm lg:text-base font-medium text-gray-300 mb-1 lg:mb-2">Avg Personalization</div>
            <div className={`text-2xl lg:text-3xl font-bold stat-glow ${formatScore(stats.avgPersonalization)}`}>
              {stats.avgPersonalization}
            </div>
          </div>
          <div className="stats-card-gold p-4 lg:p-6">
            <div className="text-sm lg:text-base font-medium text-gray-300 mb-1 lg:mb-2">Avg Girl Roleplay Skill</div>
            <div className={`text-2xl lg:text-3xl font-bold stat-glow ${formatScore(stats.avgGirlRoleplaySkill)}`}>
              {stats.avgGirlRoleplaySkill}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="hidden lg:block w-px bg-gray-600 mx-2"></div>

        {/* Group 3: Performance Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6 flex-1">
          <div className="stats-card-primary p-4 lg:p-6 border-l-2 border-gray-600 lg:border-l-0">
            <div className="text-sm lg:text-base font-medium text-gray-300 mb-1 lg:mb-2">Avg Sales Ability</div>
            <div className={`text-2xl lg:text-3xl font-bold stat-glow ${formatScore(stats.avgSalesAbility)}`}>
              {stats.avgSalesAbility}
            </div>
          </div>
          <div className="stats-card-crimson p-4 lg:p-6">
            <div className="text-sm lg:text-base font-medium text-gray-300 mb-1 lg:mb-2">Avg Response Time</div>
            <div className="text-2xl lg:text-3xl font-bold text-gradient-gold">
              {formatResponseTime(stats.avgResponseTime)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
