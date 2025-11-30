import React, { useState, useRef, useEffect } from 'react';
import './GlassDropdown.css';

const GlassDropdown = ({ value, onChange, options, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Filter options based on search query
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get the label of currently selected option
  const selectedOption = options.find(opt => opt.value === value);
  const selectedLabel = selectedOption ? selectedOption.label : 'Select an option';
  const selectedIcon = selectedOption ? selectedOption.icon : '';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchQuery('');
        setHighlightedIndex(-1);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Reset highlighted index when search query changes
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [searchQuery]);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          handleSelect(filteredOptions[highlightedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSearchQuery('');
        setHighlightedIndex(-1);
        break;
      default:
        break;
    }
  };

  // Scroll highlighted option into view
  useEffect(() => {
    if (highlightedIndex >= 0) {
      const highlightedElement = document.getElementById(`dropdown-option-${highlightedIndex}`);
      if (highlightedElement) {
        highlightedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [highlightedIndex]);

  const handleSelect = (option) => {
    onChange(option.value);
    setIsOpen(false);
    setSearchQuery('');
    setHighlightedIndex(-1);
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    if (isOpen) {
      setSearchQuery('');
      setHighlightedIndex(-1);
    }
  };

  return (
    <div style={styles.container} ref={dropdownRef} onKeyDown={handleKeyDown}>
      {/* Selected value display */}
      <button
        type="button"
        onClick={toggleDropdown}
        className="glass-dropdown-trigger"
        style={styles.trigger}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={label}
      >
        <div style={styles.triggerContent}>
          {selectedIcon && <span style={styles.triggerIcon}>{selectedIcon}</span>}
          <span style={styles.triggerText}>{selectedLabel}</span>
        </div>
        <svg
          style={{
            ...styles.chevron,
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
        >
          <path
            d="M5 7.5L10 12.5L15 7.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div className="glass-dropdown-panel" style={styles.panel}>
          {/* Search input */}
          <div className="glass-dropdown-search-container" style={styles.searchContainer}>
            <svg style={styles.searchIcon} width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M7 12C9.76142 12 12 9.76142 12 7C12 4.23858 9.76142 2 7 2C4.23858 2 2 4.23858 2 7C2 9.76142 4.23858 12 7 12Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M14 14L10.5 10.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search options..."
              className="glass-dropdown-search"
              style={styles.searchInput}
              aria-label="Search options"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="glass-dropdown-clear"
                style={styles.clearButton}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Options list */}
          <div className="glass-dropdown-options" style={styles.optionsList} role="listbox">
            {filteredOptions.length === 0 ? (
              <div style={styles.noResults}>No results found</div>
            ) : (
              filteredOptions.map((option, index) => (
                <button
                  key={option.value}
                  id={`dropdown-option-${index}`}
                  type="button"
                  onClick={() => handleSelect(option)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={`glass-dropdown-option ${highlightedIndex === index ? 'glass-dropdown-option-highlighted' : ''} ${value === option.value ? 'glass-dropdown-option-selected' : ''}`}
                  style={{ color: 'var(--text-primary)' }}
                  role="option"
                  aria-selected={value === option.value}
                >
                  {option.icon && <span style={styles.optionIcon}>{option.icon}</span>}
                  <span style={styles.optionLabel}>{option.label}</span>
                  {value === option.value && (
                    <svg style={styles.checkIcon} width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M13 4L6 11L3 8"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    position: 'relative',
    width: '100%',
  },
  trigger: {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.125rem 1.5rem',
    borderRadius: '1.5rem',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
    transition: 'all 0.2s ease',
    outline: 'none',
  },
  triggerContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  triggerIcon: {
    fontSize: '1.125rem',
    lineHeight: 1,
  },
  triggerText: {
    textAlign: 'left',
    letterSpacing: '-0.01em',
  },
  chevron: {
    transition: 'transform 0.2s ease',
    color: 'var(--text-secondary)',
    flexShrink: 0,
  },
  panel: {
    position: 'absolute',
    top: 'calc(100% + 0.75rem)',
    left: 0,
    right: 0,
    zIndex: 1000,
    borderRadius: '1.5rem',
    overflow: 'hidden',
    animation: 'slideIn 0.2s ease-out',
  },
  searchContainer: {
    position: 'relative',
    padding: '1rem 1.25rem',
  },
  searchIcon: {
    position: 'absolute',
    left: '1.75rem',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--text-secondary)',
    pointerEvents: 'none',
  },
  searchInput: {
    width: '100%',
    padding: '0.75rem 2.75rem 0.75rem 2.5rem',
    borderRadius: '0.75rem',
    fontSize: '0.9375rem',
    outline: 'none',
    transition: 'border-color 0.2s ease',
    color: 'var(--text-primary)',
  },
  clearButton: {
    position: 'absolute',
    right: '1.75rem',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'rgba(100, 116, 139, 0.1)',
    border: 'none',
    borderRadius: '50%',
    width: '1.375rem',
    height: '1.375rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    transition: 'all 0.2s ease',
  },
  optionsList: {
    maxHeight: '400px',
    overflowY: 'auto',
    padding: '0.75rem 0.75rem 1rem 0.75rem',
  },
  optionIcon: {
    fontSize: '1rem',
    lineHeight: 1,
    flexShrink: 0,
  },
  optionLabel: {
    flex: 1,
  },
  checkIcon: {
    color: '#3B82F6',
    flexShrink: 0,
  },
  noResults: {
    padding: '3rem 1.5rem',
    textAlign: 'center',
    color: 'var(--text-secondary)',
    fontSize: '0.9375rem',
    fontWeight: 500,
  },
};

export default GlassDropdown;
