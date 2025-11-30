import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('system');
  const [resolvedTheme, setResolvedTheme] = useState('light');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'system';
    setTheme(savedTheme);
    
    if (savedTheme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setResolvedTheme(prefersDark ? 'dark' : 'light');
    } else {
      setResolvedTheme(savedTheme);
    }
    
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      setResolvedTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute('data-theme', resolvedTheme);
    document.body.setAttribute('data-theme', resolvedTheme);
  }, [resolvedTheme]);

  const toggleTheme = () => {
    const newTheme = resolvedTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    setResolvedTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const setSystemTheme = () => {
    setTheme('system');
    localStorage.setItem('theme', 'system');
    
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setResolvedTheme(prefersDark ? 'dark' : 'light');
  };

  const value = {
    theme,
    resolvedTheme,
    toggleTheme,
    setSystemTheme,
    isLoading,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

const VoiceContext = createContext();

export function VoiceProvider({ children }) {
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const voiceMapping = {
    // Original voices
    'Microsoft David Desktop': 'Deep',
    'Samantha': 'Bright',
    'Alex': 'Smooth',
    'Microsoft Zira Desktop': 'Clear',
    'Daniel': 'Calm',
    'Karen': 'Warm',
    'Google US English': 'Quick',
    'Victoria': 'Crisp',
    'Microsoft Mark Desktop': 'Mellow',
    'Bruce': 'Sharp',
    'Moira': 'Soft',
    'Microsoft Hazel Desktop': 'Energetic',
    'Junior': 'Steady',
    'Microsoft Susan Desktop': 'Gentle',
    'Google UK English': 'Punchy',
    // Additional variations
    'David': 'Deep',
    'Zira': 'Clear',
    'Mark': 'Mellow',
    'Susan': 'Gentle',
    'Hazel': 'Energetic',
    'Rishi': 'Quick',
    'Fiona': 'Bright',
    // More common names
    'Ralph': 'Deep',
    'Martha': 'Gentle',
    'Kathy': 'Clear',
    'Eddy': 'Quick',
    'Sandy': 'Warm',
    'Rocko': 'Sharp',
    'Nicky': 'Smooth',
    'Gordon': 'Mellow',
    'Shelley': 'Soft',
    'Reed': 'Calm',
    'Grandpa': 'Deep',
    'Grandma': 'Bright',
    'Fred': 'Steady',
    'Jester': 'Energetic',
    'Good News': 'Punchy',
    'Organ': 'Crisp',
  };

  const getVoiceDescription = (voiceName) => {
    return voiceMapping[voiceName] || voiceName;
  };

  useEffect(() => {
    const loadVoices = () => {
      if (window.speechSynthesis) {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          // Get all English voices
          const englishVoices = voices.filter(v => v.lang.startsWith('en'));
          
          // Filter to ONLY our 15 mapped voices
          const ourVoices = englishVoices.filter(v => voiceMapping[v.name]);
          
          setAvailableVoices(ourVoices);
          
          const savedVoiceName = localStorage.getItem('selectedVoice');
          if (savedVoiceName) {
            const voice = ourVoices.find(v => v.name === savedVoiceName);
            setSelectedVoice(voice || ourVoices[0]);
          } else {
            setSelectedVoice(ourVoices[0]);
          }
          
          setIsLoading(false);
        }
      }
    };

    loadVoices();
    
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const changeVoice = (voiceName) => {
    const voice = availableVoices.find(v => v.name === voiceName);
    if (voice) {
      setSelectedVoice(voice);
      localStorage.setItem('selectedVoice', voiceName);
    }
  };

  const value = {
    selectedVoice,
    availableVoices,
    changeVoice,
    isLoading,
    getVoiceDescription,
  };

  return (
    <VoiceContext.Provider value={value}>
      {children}
    </VoiceContext.Provider>
  );
}

export function useVoice() {
  const context = useContext(VoiceContext);
  if (!context) {
    throw new Error('useVoice must be used within a VoiceProvider');
  }
  return context;
}
