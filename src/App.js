import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider as MuiThemeProvider, CssBaseline } from '@mui/material';
import { ThemeProvider } from './contexts/ThemeContext';
import getTheme from './theme';
import './App.css';

// Components
import LoginRegister from './components/LoginRegister';
import Dashboard from './components/Dashboard';
import { useTheme } from './contexts/ThemeContext';

function AppContent() {
  const { isDarkMode } = useTheme();
  const theme = getTheme(isDarkMode ? 'dark' : 'light');
  const token = localStorage.getItem('token');

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      <div className="App" data-theme={isDarkMode ? 'dark' : 'light'}>
        <Routes>
          <Route path="/" element={<LoginRegister />} />
          <Route path="/login" element={<LoginRegister />} />
          <Route path="/dashboard/*" element={<Dashboard />} />
        </Routes>
      </div>
    </MuiThemeProvider>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;