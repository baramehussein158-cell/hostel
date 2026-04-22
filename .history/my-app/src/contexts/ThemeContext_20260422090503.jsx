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
    textSecondary: '#64748b',
    sidebarBg: '#f3f4f6',
    sidebarBorder: 'rgba(209, 213, 219, 0.5)',
    sidebarSurface: '#ffffff',
    sidebarHover: '#f0f1f3',
    borderColor: '#e5e7eb',
  },
  dark: {
    primary: '#3b82f6',
    secondary: '#1e40af',
    accent: '#f59e0b',
    success: '#10b981',
    danger: '#ef4444',
    warning: '#f59e0b',
    info: '#06b6d4',
    background: '#333333',
    surface: '#1f2937',
    text: '#f3f4f6',
    textSecondary: '#d1d5db',
    sidebarBg: '#1f2937',
    sidebarBorder: 'rgba(75, 85, 99, 0.5)',
    sidebarSurface: '#111827',
    sidebarHover: '#1f2937',
    borderColor: '#374151',
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
    // Apply theme class to body for global styling
    document.body.className = theme;
    document.body.style.backgroundColor = colors.background;
    document.body.style.color = colors.text;
    document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('app-color', color);
  }, [color]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const changeColor = (newColor) => {
    setColor(newColor);
  };

  const colors = THEME_COLORS[theme] || THEME_COLORS.light;

  return (
    <ThemeContext.Provider value={{ 
      theme,
      toggleTheme,
      color,
      colors,
      changeColor,
      themeOptions: ['light', 'dark'],
      colorOptions: ['blue', 'purple', 'green', 'red', 'orange'],
    }}>
      {children}
    </ThemeContext.Provider>
  );
};