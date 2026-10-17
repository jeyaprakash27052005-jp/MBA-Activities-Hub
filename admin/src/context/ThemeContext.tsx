import React, { createContext, useContext, useEffect } from 'react';

interface ThemeContextType {
  theme: 'light';
}

const ThemeContext = createContext<ThemeContextType>({ theme: 'light' });

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    // Strictly enforce light screen mode across entire application as requested
    const root = document.documentElement;
    root.classList.remove('dark');
    localStorage.removeItem('mba_theme');
  }, []);

  return (
    <ThemeContext.Provider value={{ theme: 'light' }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
