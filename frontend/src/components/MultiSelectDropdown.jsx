import React, { useState, useRef, useEffect } from 'react';
import './MultiSelectDropdown.css';

const MultiSelectDropdown = ({
  options = [],
  selectedValues = [],
  onChange,
  label,
  placeholder = "Select options",
  searchPlaceholder = "Search...",
  colorMap = {}
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Filter options based on search query
  const filteredOptions = options.filter(option =>
    option.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        closeDropdown();
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

  // Function to handle closing with animation
  const closeDropdown = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
      setSearchQuery('');
      setHighlightedIndex(-1);
    }, 200); // Match animation duration
  };

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
          handleToggle(filteredOptions[highlightedIndex].id);
        }
        break;
      case 'Escape':
        e.preventDefault();
        closeDropdown();
        break;
      default:
        break;
    }
  };

  // Scroll highlighted option into view
  useEffect(() => {
    if (highlightedIndex >= 0) {
      const highlightedElement = document.getElementById(`multi-dropdown-option-${highlightedIndex}`);
      if (highlightedElement) {
        highlightedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [highlightedIndex]);

  const handleToggle = (optionId) => {
    const newValues = selectedValues.includes(optionId)
      ? selectedValues.filter(id => id !== optionId)
      : [...selectedValues, optionId];
    onChange(newValues);
  };

  const toggleDropdown = () => {
    if (isOpen) {
      closeDropdown();
    } else {
      setIsOpen(true);
    }
  };

  const handleSelectAll = () => {
    if (selectedValues.length === filteredOptions.length) {
      // Deselect all filtered options
      const filteredIds = filteredOptions.map(opt => opt.id);
      onChange(selectedValues.filter(id => !filteredIds.includes(id)));
    } else {
      // Select all filtered options
      const allFilteredIds = filteredOptions.map(opt => opt.id);
      const combined = [...new Set([...selectedValues, ...allFilteredIds])];
      onChange(combined);
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange([]);
  };

  const allFilteredSelected = filteredOptions.length > 0 &&
    filteredOptions.every(opt => selectedValues.includes(opt.id));

  return (
    <div className="multi-select-container" ref={dropdownRef} onKeyDown={handleKeyDown}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={toggleDropdown}
        className={`multi-select-trigger ${isOpen ? 'multi-select-trigger-open' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={label}
      >
        <div className="multi-select-trigger-content">
          <span className="multi-select-trigger-text">{label || placeholder}</span>
          {selectedValues.length > 0 && (
            <div className="multi-select-badge-group">
              <span className="multi-select-badge">{selectedValues.length} selected</span>
              <button
                type="button"
                onClick={handleClear}
                className="multi-select-clear-btn"
                aria-label="Clear all selections"
              >
                ✕
              </button>
            </div>
          )}
        </div>
        <svg
          className="multi-select-chevron"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
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
      {(isOpen || isClosing) && (
        <div className={`multi-select-panel ${isClosing ? 'multi-select-panel-closing' : ''}`}>
          {/* Search input */}
          <div className="multi-select-search-container">
            <svg className="multi-select-search-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
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
              placeholder={searchPlaceholder}
              className="multi-select-search"
              aria-label="Search options"
              onClick={(e) => e.stopPropagation()}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSearchQuery('');
                }}
                className="multi-select-search-clear"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Options list */}
          <div className="multi-select-options-list" role="listbox">
            {filteredOptions.length === 0 ? (
              <div className="multi-select-no-results">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ opacity: 0.3, marginBottom: '0.5rem' }}>
                  <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 4"/>
                  <path d="M18 28C18 28 20 26 24 26C28 26 30 28 30 28" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="18" cy="20" r="2" fill="currentColor"/>
                  <circle cx="30" cy="20" r="2" fill="currentColor"/>
                </svg>
                <p>No courses found</p>
              </div>
            ) : (
              filteredOptions.map((option, index) => {
                const isSelected = selectedValues.includes(option.id);
                const isHighlighted = highlightedIndex === index;

                return (
                  <label
                    key={option.id}
                    id={`multi-dropdown-option-${index}`}
                    className={`multi-select-option ${isHighlighted ? 'multi-select-option-highlighted' : ''} ${isSelected ? 'multi-select-option-selected' : ''}`}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="multi-select-option-content">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggle(option.id)}
                        className="multi-select-checkbox"
                        aria-label={option.name}
                      />
                      <div
                        className="multi-select-color-dot"
                        style={{ backgroundColor: colorMap[option.id] || '#6B7280' }}
                      />
                      <span className="multi-select-option-label">{option.name}</span>
                    </div>
                    {isSelected && (
                      <svg className="multi-select-check-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path
                          d="M13 4L6 11L3 8"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </label>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiSelectDropdown;
