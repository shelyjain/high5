import React, { useState, useEffect } from 'react';
import { useVoice } from '../context/ThemeContext';

const TextToSpeechButton = ({ text, className = '', style = {} }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const { selectedVoice } = useVoice();

  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleToggleSpeech = () => {
    if (!window.speechSynthesis) {
      alert('Text-to-speech is not supported in this browser.');
      return;
    }

    if (isPlaying && !isPaused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    } else if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    } else {
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      utterance.onstart = () => {
        setIsPlaying(true);
        setIsPaused(false);
      };
      
      utterance.onend = () => {
        setIsPlaying(false);
        setIsPaused(false);
      };
      
      utterance.onerror = () => {
        setIsPlaying(false);
        setIsPaused(false);
      };
      
      window.speechSynthesis.speak(utterance);
    }
  };

  const getButtonIcon = () => {
    if (isPlaying && !isPaused) {
      // Pause icon
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <rect x="6" y="4" width="4" height="16" rx="1" />
          <rect x="14" y="4" width="4" height="16" rx="1" />
        </svg>
      );
    } else if (isPaused) {
      // Play icon
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z" />
        </svg>
      );
    } else {
      // Speaker icon
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.26 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
        </svg>
      );
    }
  };

  const getButtonTitle = () => {
    if (isPlaying && !isPaused) {
      return 'Pause reading';
    } else if (isPaused) {
      return 'Resume reading';
    } else {
      return 'Read aloud';
    }
  };

  return (
    <button
      onClick={handleToggleSpeech}
      title={getButtonTitle()}
      className={className}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        fontSize: '16px',
        padding: '4px',
        borderRadius: '4px',
        transition: 'background-color 0.2s ease',
        ...style
      }}
      onMouseEnter={(e) => {
        e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
      }}
      onMouseLeave={(e) => {
        e.target.style.backgroundColor = 'transparent';
      }}
    >
      {getButtonIcon()}
    </button>
  );
};

export default TextToSpeechButton;
