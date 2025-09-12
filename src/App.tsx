import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomeScreen from './HomeScreen';
import RowsView from './RowsView';
import ChatsView from './ChatsView';

/**
 * App Component - Main Application Router
 * 
 * Features:
 * - React Router setup with BrowserRouter
 * - HomeScreen as default route (/)
 * - RowsView for table functionality (/rows)
 * - Clean navigation between different app sections
 * - Full-screen layout support
 */
const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gray-900">
        <Routes>
          {/* Home Screen - Default route with Bento board layout */}
          <Route path="/" element={<HomeScreen />} />
          
          {/* Rows View - Table-based interface */}
          <Route path="/rows" element={<RowsView />} />
          
          {/* Chats View - WhatsApp-style chat interface */}
          <Route path="/chats" element={<ChatsView />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;