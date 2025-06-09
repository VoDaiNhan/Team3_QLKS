import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginRegister from './components/LoginRegister';
import Dashboard from './components/Dashboard';
import { ThemeProvider } from './contexts/ThemeContext';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <div className="app-container">
        <Router>
          <Routes>
            <Route path="/login" element={<LoginRegister />} />
            <Route path="/dashboard/*" element={<Dashboard />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </div>
    </ThemeProvider>
  );
}

export default App; 