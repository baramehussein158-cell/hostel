/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

const THEME_COLORS = {
  light: {
    primary: '#16a34a',
    secondary: '#0f766e',
    accent: '#6df2a2',
    success: '#22c55e',
    danger: '#ef4444',
    warning: '#f59e0b',
    info: '#14b8a6',
    background: '#f5f7fb',
    surface: '#ffffff',
    text: '#0f172a',
    textSecondary: '#475569',
    sidebarBg: '#ffffff',
    sidebarBorder: '#dbe4f0',
    sidebarSurface: '#f8fafc',
    sidebarHover: '#edf7f0',
  },
  dark: {
    primary: '#6df2a2',
    secondary: '#22c55e',
    accent: '#6df2a2',
    success: '#34d399',
    danger: '#f87171',
    warning: '#fbbf24',
    info: '#2dd4bf',
    background: '#0a1220',
    surface: '#111827',
    text: '#eef5ff',
    textSecondary: '#c7d5ea',
    sidebarBg: '#0a1220',
    sidebarBorder: 'rgba(109, 242, 162, 0.16)',
    sidebarSurface: 'rgba(17, 24, 39, 0.96)',
    sidebarHover: 'rgba(24, 39, 54, 1)',
  },
};

const THEME_VARIABLE_MAP = {
  light: {
    '--bg-primary': '#f5f7fb',
    '--bg-secondary': '#ffffff',
    '--bg-tertiary': '#edf7f0',
    '--text-primary': '#0f172a',
    '--text-secondary': '#475569',
    '--border-color': '#dbe4f0',
    '--accent-color': '#16a34a',
  },
  dark: {
    '--bg-primary': '#0a1220',
    '--bg-secondary': '#111827',
    '--bg-tertiary': '#172033',
    '--text-primary': '#eef5ff',
    '--text-secondary': '#c7d5ea',
    '--border-color': 'rgba(109, 242, 162, 0.16)',
    '--accent-color': '#6df2a2',
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
    return saved || 'green';
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
      colorOptions: ['green', 'blue', 'purple', 'red', 'orange'],
    }}>
      {children}
    </ThemeContext.Provider>
  );
};
