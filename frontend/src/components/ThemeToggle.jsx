import React, { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import './ThemeToggle.css';

// SVG Icons
const SunIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

const MoonIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

export default function ThemeToggle() {
  const { theme, resolvedTheme, toggleTheme } = useTheme();
  const [systemPreference, setSystemPreference] = useState('light');

  // Update system preference when it changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const updateSystemPreference = (e) => {
      setSystemPreference(e.matches ? 'dark' : 'light');
    };
    
    // Get initial system preference
    setSystemPreference(mediaQuery.matches ? 'dark' : 'light');
    
    // Listen for changes
    mediaQuery.addEventListener('change', updateSystemPreference);
    return () => mediaQuery.removeEventListener('change', updateSystemPreference);
  }, []);

  // Use system preference if theme is system, otherwise use resolved theme
  const displayTheme = theme === 'system' ? systemPreference : resolvedTheme;

  return (
    <div className="theme-toggle-container">
      <button
        className="theme-slider"
        onClick={toggleTheme}
        title={`Switch to ${displayTheme === 'light' ? 'dark' : 'light'} mode`}
        aria-label="Toggle theme"
      >
        <div className="slider-track">
          <div className={`slider-thumb ${displayTheme}`}>
            {displayTheme === 'light' ? <SunIcon /> : <MoonIcon />}
          </div>
        </div>
      </button>
    </div>
  );
}
