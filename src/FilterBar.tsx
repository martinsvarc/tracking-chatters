import React, { useState } from 'react';

interface FilterBarProps {
  onFiltersChange: (filters: {
    operators: string[];
    models: string[];
    startDate: string;
    endDate: string;
  }) => void;
  onAIClick: () => void;
  onRunAIAnalysis: () => void;
}

const FilterBar: React.FC<FilterBarProps> = ({ onFiltersChange, onAIClick, onRunAIAnalysis }) => {
  const [operators, setOperators] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [showOperatorDropdown, setShowOperatorDropdown] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);

  // Mock data - in real app, this would come from API
  const availableOperators = ['Sarah', 'Emma', 'Jessica', 'Maya', 'Luna'];
  const availableModels = ['Isabella', 'Sophia', 'Olivia', 'Ava', 'Emma'];

  const handleOperatorToggle = (operator: string) => {
    const newOperators = operators.includes(operator)
      ? operators.filter(op => op !== operator)
      : [...operators, operator];
    setOperators(newOperators);
    updateFilters({ operators: newOperators, models, startDate: '', endDate: '' });
  };

  const handleModelToggle = (model: string) => {
    const newModels = models.includes(model)
      ? models.filter(m => m !== model)
      : [...models, model];
    setModels(newModels);
    updateFilters({ operators, models: newModels, startDate: '', endDate: '' });
  };


  const updateFilters = (newFilters: {
    operators: string[];
    models: string[];
    startDate: string;
    endDate: string;
  }) => {
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    setOperators([]);
    setModels([]);
    onFiltersChange({ operators: [], models: [], startDate: '', endDate: '' });
  };

  const hasActiveFilters = operators.length > 0 || models.length > 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 nav-blur border-t border-gray-600 shadow-lg z-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Operator Filter */}
          <div className="relative">
            <button
              onClick={() => setShowOperatorDropdown(!showOperatorDropdown)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                operators.length > 0 
                  ? 'bg-blue-900/30 border-blue-500 text-blue-300' 
                  : 'bg-gray-700/50 border-gray-500 text-gray-300 hover:bg-gray-600/50'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              Operator
              {operators.length > 0 && (
                <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                  {operators.length}
                </span>
              )}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showOperatorDropdown && (
              <div className="absolute bottom-full left-0 mb-2 w-48 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-10">
                <div className="p-2">
                  {availableOperators.map(operator => (
                    <label key={operator} className="flex items-center space-x-2 p-2 hover:bg-gray-700 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={operators.includes(operator)}
                        onChange={() => handleOperatorToggle(operator)}
                        className="rounded border-gray-500 text-blue-500 focus:ring-blue-400 bg-gray-700"
                      />
                      <span className="text-sm text-gray-300">{operator}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Model Name Filter */}
          <div className="relative">
            <button
              onClick={() => setShowModelDropdown(!showModelDropdown)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                models.length > 0 
                  ? 'bg-blue-900/30 border-blue-500 text-blue-300' 
                  : 'bg-gray-700/50 border-gray-500 text-gray-300 hover:bg-gray-600/50'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Model Name
              {models.length > 0 && (
                <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                  {models.length}
                </span>
              )}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showModelDropdown && (
              <div className="absolute bottom-full left-0 mb-2 w-48 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-10">
                <div className="p-2">
                  {availableModels.map(model => (
                    <label key={model} className="flex items-center space-x-2 p-2 hover:bg-gray-700 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={models.includes(model)}
                        onChange={() => handleModelToggle(model)}
                        className="rounded border-gray-500 text-blue-500 focus:ring-blue-400 bg-gray-700"
                      />
                      <span className="text-sm text-gray-300">{model}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>


          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-gray-200 hover:bg-gray-700/50 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear Filters
            </button>
          )}

          {/* Run AI Analysis Button */}
          <button
            onClick={onRunAIAnalysis}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-200 shadow-lg"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Run AI Analysis
          </button>

          {/* AI Query Button */}
          <button
            onClick={onAIClick}
            className="ml-auto flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            AI Query
          </button>
        </div>
      </div>

      {/* Click outside to close dropdowns */}
      {(showOperatorDropdown || showModelDropdown) && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => {
            setShowOperatorDropdown(false);
            setShowModelDropdown(false);
          }}
        />
      )}
    </div>
  );
};

export default FilterBar;
