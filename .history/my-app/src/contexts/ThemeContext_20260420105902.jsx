/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

const THEME_COLORS = {
  light: {
    primary: '#3b82f6',
    secondary: '#1e40af',
    accent: '#f59e0b',
    success: '#10b981',
    danger: '#ef4444',
    warning: '#f59e0b',
    info: '#06b6d4',
    background: '#f8fafc',
    surface: '#ffffff',
    text: '#0f172a',
    textSecondary: '#64748b',
  },
  dark: {
    primary: '#60a5fa',
    secondary: '#3b82f6',
    accent: '#fbbf24',
    success: '#34d399',
    danger: '#f87171',
    warning: '#fbbf24',
    info: '#22d3ee',
    background: '#0f172a',
    surface: '#1e293b',
    text: '#e8ecf1',
    textSecondary: '#cbd5e1',
  },
};

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('app-theme');
    return saved || 'light';
  });

  const [color, setColor] = useState(() => {
    const saved = localStorage.getItem('app-color');
    return saved || 'blue';
  });

  useEffect(() => {
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('app-color', color);
  }, [color]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const changeTheme = (newTheme) => {
    if (newTheme === 'light' || newTheme === 'dark') {
      setTheme(newTheme);
    }
  };

  const changeColor = (newColor) => {
    setColor(newColor);
  };

  const colors = THEME_COLORS[theme] || THEME_COLORS.light;

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      color,
      colors,
      toggleTheme,
      changeTheme,
      changeColor,
      themeOptions: ['light', 'dark'],
      colorOptions: ['blue', 'purple', 'green', 'red', 'orange'],
    }}>
      {children}
    </ThemeContext.Provider>
  );
};