import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import App from './App';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00ff9d',
    },
    background: {
      default: '#000000',
      paper: 'rgba(28, 28, 30, 0.92)',
    },
    text: {
      primary: '#ffffff',
      secondary: 'rgba(255, 255, 255, 0.7)',
    },
    success: {
      main: '#30d158',
      dark: '#28b74c',
    },
    error: {
      main: '#ff453a',
      dark: '#d91f35',
    },
    warning: {
      main: '#ffd60a',
      dark: '#e6c00a',
    },
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Icons", "Helvetica Neue", Helvetica, Arial, sans-serif',
    h1: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Icons", "Helvetica Neue", Helvetica, Arial, sans-serif',
      fontWeight: 700,
      letterSpacing: '-0.025em',
    },
    h2: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Icons", "Helvetica Neue", Helvetica, Arial, sans-serif',
      fontWeight: 700,
      letterSpacing: '-0.025em',
    },
    h3: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Icons", "Helvetica Neue", Helvetica, Arial, sans-serif',
      fontWeight: 600,
      letterSpacing: '-0.025em',
    },
    h4: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Icons", "Helvetica Neue", Helvetica, Arial, sans-serif',
      fontWeight: 600,
      letterSpacing: '-0.02em',
    },
    h5: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Icons", "Helvetica Neue", Helvetica, Arial, sans-serif',
      fontWeight: 600,
      letterSpacing: '-0.02em',
    },
    h6: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Icons", "Helvetica Neue", Helvetica, Arial, sans-serif',
      fontWeight: 600,
      letterSpacing: '-0.015em',
    },
    body1: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Icons", "Helvetica Neue", Helvetica, Arial, sans-serif',
      letterSpacing: '-0.01em',
    },
    body2: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Icons", "Helvetica Neue", Helvetica, Arial, sans-serif',
      letterSpacing: '-0.01em',
    },
    button: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Icons", "Helvetica Neue", Helvetica, Arial, sans-serif',
      fontWeight: 500,
      letterSpacing: '-0.01em',
    },
  },
  shape: {
    borderRadius: 4,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: 'linear-gradient(180deg, #000000 0%, #1c1c1e 100%)',
          minHeight: '100vh',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: 'rgba(28, 28, 30, 0.92)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          borderRadius: 4,
        },
      },
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          '@media (min-width: 1200px)': {
            maxWidth: '1080px',
          },
        },
      },
    },
  },
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>
); 