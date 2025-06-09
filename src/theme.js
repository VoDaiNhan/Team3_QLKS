import { createTheme } from '@mui/material/styles';

const getTheme = (mode) => {
  const isDark = mode === 'dark';

  return createTheme({
    palette: {
      mode: isDark ? 'dark' : 'light',
      primary: {
        main: isDark ? '#818cf8' : '#4f46e5',
        light: isDark ? '#93c5fd' : '#818cf8',
        dark: isDark ? '#6366f1' : '#3730a3',
        contrastText: '#ffffff',
      },
      secondary: {
        main: isDark ? '#34d399' : '#10b981',
        light: isDark ? '#6ee7b7' : '#34d399',
        dark: isDark ? '#059669' : '#047857',
        contrastText: '#ffffff',
      },
      background: {
        default: isDark ? '#0f172a' : '#f8fafc',
        paper: isDark ? '#1e293b' : '#ffffff',
      },
      error: {
        main: isDark ? '#f87171' : '#ef4444',
        light: isDark ? '#fca5a5' : '#f87171',
        dark: isDark ? '#dc2626' : '#b91c1c',
      },
      warning: {
        main: isDark ? '#fbbf24' : '#f59e0b',
        light: isDark ? '#fcd34d' : '#fbbf24',
        dark: isDark ? '#d97706' : '#b45309',
      },
      info: {
        main: isDark ? '#60a5fa' : '#3b82f6',
        light: isDark ? '#93c5fd' : '#60a5fa',
        dark: isDark ? '#2563eb' : '#1d4ed8',
      },
      success: {
        main: isDark ? '#34d399' : '#10b981',
        light: isDark ? '#6ee7b7' : '#34d399',
        dark: isDark ? '#059669' : '#047857',
      },
      text: {
        primary: isDark ? '#f8fafc' : '#0f172a',
        secondary: isDark ? '#e2e8f0' : '#334155',
        disabled: isDark ? '#cbd5e1' : '#64748b',
      },
      divider: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
    },
    shape: {
      borderRadius: 16,
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontWeight: 700,
        fontSize: '2.5rem',
      },
      h2: {
        fontWeight: 600,
        fontSize: '2rem',
      },
      h3: {
        fontWeight: 600,
        fontSize: '1.5rem',
      },
      h4: {
        fontWeight: 600,
        fontSize: '1.25rem',
      },
      button: {
        fontWeight: 600,
      },
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            padding: '1.5rem',
            backgroundColor: isDark ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(12px)',
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
            boxShadow: isDark 
              ? '0 8px 32px rgba(0, 0, 0, 0.3)' 
              : '0 8px 32px rgba(0, 0, 0, 0.1)',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            padding: '0.75rem 1.5rem',
            textTransform: 'none',
            fontSize: '1rem',
          },
          contained: {
            boxShadow: isDark 
              ? '0 4px 14px 0 rgba(129, 140, 248, 0.3)'
              : '0 4px 14px 0 rgba(79, 70, 229, 0.25)',
            '&:hover': {
              boxShadow: isDark
                ? '0 6px 20px 0 rgba(129, 140, 248, 0.4)'
                : '0 6px 20px 0 rgba(79, 70, 229, 0.35)',
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 12,
            },
          },
        },
      },
      MuiTableContainer: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            backgroundColor: isDark ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(12px)',
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
          },
        },
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            '& .MuiTableCell-head': {
              fontWeight: 600,
              color: isDark ? '#f8fafc' : '#1e293b',
              borderBottom: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
            },
          },
        },
      },
      MuiTableBody: {
        styleOverrides: {
          root: {
            '& .MuiTableCell-body': {
              color: isDark ? '#f8fafc' : '#1e293b',
              borderBottom: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
            },
          },
        },
      },
    },
  });
};

export default getTheme;
