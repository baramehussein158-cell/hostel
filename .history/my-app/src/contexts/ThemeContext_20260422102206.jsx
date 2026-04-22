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
    background: '#ffffff',
    surface: '#f8fafc',
    text: '#0f172a',
    textSecondary: '#64748b',
    sidebarBg: '#1e293b',
    sidebarBorder: 'rgba(148, 163, 184, 0.34)',
    sidebarSurface: 'rgba(30, 41, 59, 0.9)',
    sidebarHover: 'rgba(30, 41, 59, 1)',
  },
  dark: {
    primary: '#60a5fa',
    secondary: '#3b82f6',
    accent: '#fbbf24',
    success: '#34d399',
    danger: '#f87171',
    warning: '#fbbf24',
    info: '#22d3ee',
    background: '#333333',
    surface: '#1f2937',
    text: '#f9fafb',
    textSecondary: '#d1d5db',
    sidebarBg: '#111827',
    sidebarBorder: 'rgba(75, 85, 99, 0.34)',
    sidebarSurface: 'rgba(17, 24, 39, 0.9)',
    sidebarHover: 'rgba(17, 24, 39, 1)',
  },
};

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light');

  const [color, setColor] = useState(() => {
    const saved = localStorage.getItem('app-color');
    return saved || 'blue';
  });

  useEffect(() => {
    localStorage.setItem('app-theme', theme);
    // Apply theme colors to CSS custom properties
    const colors = THEME_COLORS[theme] || THEME_COLORS.light;
    const root = document.documentElement;
    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--theme-${key}`, value);
    });
    // Apply theme class to body for global styling
    document.body.className = theme;
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('app-color', color);
  }, [color]);

  const changeColor = (newColor) => {
    setColor(newColor);
  };

  const colors = THEME_COLORS[theme] || THEME_COLORS.light;

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      color,
      colors,
      changeColor,
      themeOptions: ['light'],
      colorOptions: ['blue', 'purple', 'green', 'red', 'orange'],
    }}>
      {children}
    </ThemeContext.Provider>
  );
};