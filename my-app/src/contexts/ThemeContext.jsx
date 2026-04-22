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
    surface: '#ffffff',
    text: '#0f172a',
    textSecondary: '#475569',
    sidebarBg: '#ffffff',
    sidebarBorder: '#e2e8f0',
    sidebarSurface: '#f8fafc',
    sidebarHover: '#eef4ff',
  },
  dark: {
    primary: '#60a5fa',
    secondary: '#3b82f6',
    accent: '#fbbf24',
    success: '#34d399',
    danger: '#f87171',
    warning: '#fbbf24',
    info: '#22d3ee',
    background: '#0f1c33',
    surface: '#10263f',
    text: '#eef5ff',
    textSecondary: '#c7d5ea',
    sidebarBg: '#0c1830',
    sidebarBorder: 'rgba(102, 135, 182, 0.24)',
    sidebarSurface: 'rgba(16, 38, 63, 0.94)',
    sidebarHover: 'rgba(24, 49, 82, 1)',
  },
};

const THEME_VARIABLE_MAP = {
  light: {
    '--bg-primary': '#ffffff',
    '--bg-secondary': '#f8fafc',
    '--bg-tertiary': '#eef4ff',
    '--text-primary': '#0f172a',
    '--text-secondary': '#475569',
    '--border-color': '#dbe4f0',
    '--accent-color': '#3b82f6',
  },
  dark: {
    '--bg-primary': '#0f1c33',
    '--bg-secondary': '#10263f',
    '--bg-tertiary': '#183153',
    '--text-primary': '#eef5ff',
    '--text-secondary': '#c7d5ea',
    '--border-color': 'rgba(102, 135, 182, 0.24)',
    '--accent-color': '#60a5fa',
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
    // Apply theme colors to CSS custom properties
    const colors = THEME_COLORS[theme] || THEME_COLORS.light;
    const root = document.documentElement;
    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--theme-${key}`, value);
    });
    Object.entries(THEME_VARIABLE_MAP[theme] || THEME_VARIABLE_MAP.light).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
    root.style.colorScheme = theme === 'dark' ? 'dark' : 'light';
    // Apply theme class to body for global styling
    document.body.className = theme;
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('app-color', color);
  }, [color]);

  const changeTheme = (newTheme) => {
    setTheme(newTheme);
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
      changeTheme,
      changeColor,
      themeOptions: ['light', 'dark'],
      colorOptions: ['blue', 'purple', 'green', 'red', 'orange'],
    }}>
      {children}
    </ThemeContext.Provider>
  );
};
