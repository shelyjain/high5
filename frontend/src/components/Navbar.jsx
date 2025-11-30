import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

// Custom SVG Gear Icon
const GearIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.258 9.77251 19.9887C9.5799 19.7194 9.31074 19.5143 9 19.4C8.69838 19.2669 8.36381 19.2272 8.03941 19.286C7.71502 19.3448 7.41568 19.4995 7.18 19.73L7.12 19.79C6.93425 19.976 6.71368 20.1235 6.47088 20.2241C6.22808 20.3248 5.96783 20.3766 5.705 20.3766C5.44217 20.3766 5.18192 20.3248 4.93912 20.2241C4.69632 20.1235 4.47575 19.976 4.29 19.79C4.10405 19.6043 3.95653 19.3837 3.85588 19.1409C3.75523 18.8981 3.70343 18.6378 3.70343 18.375C3.70343 18.1122 3.75523 17.8519 3.85588 17.6091C3.95653 17.3663 4.10405 17.1457 4.29 16.96L4.35 16.9C4.58054 16.6643 4.73519 16.365 4.794 16.0406C4.85282 15.7162 4.81312 15.3816 4.68 15.08C4.55324 14.7842 4.34276 14.532 4.07447 14.3543C3.80618 14.1766 3.49179 14.0813 3.17 14.08H3C2.46957 14.08 1.96086 13.8693 1.58579 13.4942C1.21071 13.1191 1 12.6104 1 12.08C1 11.5496 1.21071 11.0409 1.58579 10.6658C1.96086 10.2907 2.46957 10.08 3 10.08H3.09C3.42099 10.0723 3.742 9.96512 4.0113 9.77251C4.28059 9.5799 4.48572 9.31074 4.6 9C4.73312 8.69838 4.77282 8.36381 4.714 8.03941C4.65519 7.71502 4.50054 7.41568 4.27 7.18L4.21 7.12C4.02405 6.93425 3.87653 6.71368 3.77588 6.47088C3.67523 6.22808 3.62343 5.96783 3.62343 5.705C3.62343 5.44217 3.67523 5.18192 3.77588 4.93912C3.87653 4.69632 4.02405 4.47575 4.21 4.29C4.39575 4.10405 4.61632 3.95653 4.85912 3.85588C5.10192 3.75523 5.36217 3.70343 5.625 3.70343C5.88783 3.70343 6.14808 3.75523 6.39088 3.85588C6.63368 3.95653 6.85425 4.10405 7.04 4.29L7.1 4.35C7.33568 4.58054 7.63502 4.73519 7.95941 4.794C8.28381 4.85282 8.61838 4.81312 8.92 4.68H9C9.29577 4.55324 9.54802 4.34276 9.72569 4.07447C9.90337 3.80618 9.99872 3.49179 10 3.17V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0013 3.41179 14.0966 3.72618 14.2743 3.99447C14.452 4.26276 14.7042 4.47324 15 4.6C15.3016 4.73312 15.6362 4.77282 15.9606 4.714C16.285 4.65519 16.5843 4.50054 16.82 4.27L16.88 4.21C17.0657 4.02405 17.2863 3.87653 17.5291 3.77588C17.7719 3.67523 18.0322 3.62343 18.295 3.62343C18.5578 3.62343 18.8181 3.67523 19.0609 3.77588C19.3037 3.87653 19.5243 4.02405 19.71 4.21C19.896 4.39575 20.0435 4.61632 20.1441 4.85912C20.2448 5.10192 20.2966 5.36217 20.2966 5.625C20.2966 5.88783 20.2448 6.14808 20.1441 6.39088C20.0435 6.63368 19.896 6.85425 19.71 7.04L19.65 7.1C19.4195 7.33568 19.2648 7.63502 19.206 7.95941C19.1472 8.28381 19.1869 8.61838 19.32 8.92V9C19.4468 9.29577 19.6572 9.54802 19.9255 9.72569C20.1938 9.90337 20.5082 9.99872 20.83 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.5882 14.0013 20.2738 14.0966 20.0055 14.2743C19.7372 14.452 19.5268 14.7042 19.4 15Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Custom Warning Icon for Logout Modal
const WarningIcon = ({ isLight }) => (
  <svg
    width="56"
    height="56"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle
      cx="12"
      cy="12"
      r="10"
      stroke="#FF5A5F"
      strokeWidth="2"
      fill="none"
    />
    <path
      d="M12 8V12"
      stroke="#FF5A5F"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <circle
      cx="12"
      cy="16"
      r="1"
      fill="#FF5A5F"
    />
  </svg>
);

const navItems = [
  { path: "/dashboard", label: "Dashboard" },
  { path: "/courses", label: "AP Courses" },
  { path: "/community", label: "Community" },
  { path: "/calendar", label: "Study Calendar" },
  { path: "/stats", label: "My Stats" },
  { path: "/practice", label: "Practice" },
  { path: "/flashcards", label: "Flashcards" },
];

export default function Navbar({ onLogout }) {
  const location = useLocation();
  const { resolvedTheme } = useTheme();
  const [isLogoutHovered, setIsLogoutHovered] = useState(false);
  const [isNavbarHovered, setIsNavbarHovered] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isModalClosing, setIsModalClosing] = useState(false);
  const [isFlashcardsDropdownOpen, setIsFlashcardsDropdownOpen] = useState(false);

  const isLight = resolvedTheme === 'light';
  const textColor = isLight ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.8)';
  const inactiveTextColor = isLight ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.6)';
  const activeTextColor = isLight ? '#0078C8' : '#64B5F6';
  const borderColor = isLight ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.15)';

  // Handle modal close with animation
  const handleCloseModal = () => {
    setIsModalClosing(true);
    setTimeout(() => {
      setShowLogoutConfirm(false);
      setIsModalClosing(false);
    }, 200);
  };

  // Handle keyboard events
  React.useEffect(() => {
    if (!showLogoutConfirm) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleCloseModal();
      } else if (e.key === 'Enter') {
        onLogout();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showLogoutConfirm, onLogout]);

  // Prevent body scroll and background interaction when modal is open
  React.useEffect(() => {
    if (showLogoutConfirm) {
      document.body.style.overflow = 'hidden';
      document.body.style.pointerEvents = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.pointerEvents = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.pointerEvents = '';
    };
  }, [showLogoutConfirm]);

  return (
    <header style={styles.container}>
      <div
        style={{
          ...styles.inner,
          background: isLight ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.08)',
          border: `1px solid ${borderColor}`,
          ...(isLogoutHovered && {
            boxShadow: "0 8px 32px rgba(255, 0, 0, 0.3), 0 0 40px rgba(255, 90, 95, 0.5), 0 0 80px rgba(255, 90, 95, 0.4)",
            border: "1px solid rgba(255, 90, 95, 0.5)",
          }),
          ...(!isLogoutHovered && isNavbarHovered && {
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.15), 0 0 40px rgba(59, 130, 255, 0.3), 0 0 60px rgba(59, 130, 255, 0.2)",
            border: isLight ? "1px solid rgba(0, 120, 200, 0.3)" : "1px solid rgba(59, 130, 255, 0.3)",
          }),
        }}
        onMouseEnter={(e) => {
          setIsNavbarHovered(true);
        }}
        onMouseLeave={(e) => {
          setIsNavbarHovered(false);
        }}
      >
        <NavLink to="/dashboard" style={styles.brand}>
          <img 
            src="/logo.png" 
            alt="High5 Logo" 
            style={{
              width: "32px",
              height: "32px",
              marginRight: "8px",
              borderRadius: "6px"
            }}
          />
          <span style={{ color: isLight ? '#000000' : '#FFFFFF' }}>High</span>
          <span style={{
            color: isLight ? '#0078C8' : '#3B82FF',
            textShadow: isLight
              ? '0 0 10px rgba(0, 120, 200, 0.4), 0 0 20px rgba(0, 120, 200, 0.2)'
              : `0 0 10px #3B82FF, 0 0 20px #3B82FF, 0 0 30px #3B82FF, 0 0 40px #2563EB, 0 0 70px #2563EB, 0 0 80px #2563EB, 0 0 100px #1D4ED8, 0 0 150px #1E40AF`
          }}>5</span>
        </NavLink>
        <nav style={styles.nav} data-tutorial="navbar">
          {navItems.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (item.path === "/practice" &&
                location.pathname.startsWith("/practice"));
            
            // Map paths to tutorial data attributes
            const getTutorialAttr = (path) => {
              if (path === '/dashboard') return 'home';
              if (path === '/courses') return 'courses';
              if (path === '/practice') return 'practice';
              if (path === '/flashcards') return 'flashcards';
              if (path === '/community') return 'community';
              if (path === '/calendar') return 'calendar';
              if (path === '/stats') return 'stats';
              return null;
            };
            
            // Special handling for Flashcards dropdown
            if (item.path === '/flashcards') {
              return (
                <div
                  key={item.path}
                  style={{ position: 'relative', display: 'flex', alignItems: 'center' }}
                  onMouseEnter={() => setIsFlashcardsDropdownOpen(true)}
                  onMouseLeave={() => setIsFlashcardsDropdownOpen(false)}
                >
                  <button
                    data-tutorial={getTutorialAttr(item.path)}
                    style={{
                      ...styles.link,
                      color: textColor,
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '0 0 0.25rem 0',
                      ...(isActive ? {
                        color: activeTextColor,
                        borderBottomColor: activeTextColor,
                        fontWeight: 700,
                        textShadow: isLight ? "0 0 10px rgba(0, 120, 200, 0.3)" : "0 0 10px rgba(100, 181, 246, 0.4)"
                      } : {
                        color: inactiveTextColor,
                        borderBottomColor: "transparent",
                        fontWeight: 600
                      }),
                      ...(isFlashcardsDropdownOpen && {
                        color: activeTextColor,
                        textShadow: isLight
                          ? "0 0 20px rgba(0, 120, 200, 0.6), 0 0 30px rgba(0, 120, 200, 0.4)"
                          : "0 0 20px rgba(100, 181, 246, 0.8), 0 0 30px rgba(100, 181, 246, 0.5)"
                      })
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.textShadow = isLight
                        ? "0 0 20px rgba(0, 120, 200, 0.6), 0 0 30px rgba(0, 120, 200, 0.4)"
                        : "0 0 20px rgba(100, 181, 246, 0.8), 0 0 30px rgba(100, 181, 246, 0.5)";
                      e.currentTarget.style.color = activeTextColor;
                    }}
                    onMouseLeave={(e) => {
                      if (!isFlashcardsDropdownOpen) {
                        e.currentTarget.style.textShadow = isActive
                          ? (isLight ? "0 0 10px rgba(0, 120, 200, 0.3)" : "0 0 10px rgba(100, 181, 246, 0.4)")
                          : "none";
                        e.currentTarget.style.color = isActive ? activeTextColor : inactiveTextColor;
                      }
                    }}
                  >
                    Flashcards
                  </button>

                  {/* Dropdown Menu */}
                  {isFlashcardsDropdownOpen && (
                    <div style={{
                      ...styles.dropdown,
                      backgroundColor: isLight ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.08)',
                      border: `1px solid ${borderColor}`,
                      boxShadow: isLight
                        ? '0 8px 32px rgba(0, 120, 200, 0.2), 0 0 40px rgba(0, 120, 200, 0.1)'
                        : '0 8px 32px rgba(59, 130, 255, 0.3), 0 0 40px rgba(59, 130, 255, 0.2)',
                      backdropFilter: 'blur(12px)',
                    }}>
                      <NavLink
                        to="/flashcards?tab=manage"
                        style={{
                          ...styles.dropdownItem,
                          color: inactiveTextColor,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = activeTextColor;
                          e.currentTarget.style.textShadow = isLight
                            ? "0 0 20px rgba(0, 120, 200, 0.6), 0 0 30px rgba(0, 120, 200, 0.4)"
                            : "0 0 20px rgba(100, 181, 246, 0.8), 0 0 30px rgba(100, 181, 246, 0.5)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = inactiveTextColor;
                          e.currentTarget.style.textShadow = "none";
                        }}
                      >
                        Manage Flashcards
                      </NavLink>
                      <NavLink
                        to="/flashcards?tab=study"
                        style={{
                          ...styles.dropdownItem,
                          color: inactiveTextColor,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = activeTextColor;
                          e.currentTarget.style.textShadow = isLight
                            ? "0 0 20px rgba(0, 120, 200, 0.6), 0 0 30px rgba(0, 120, 200, 0.4)"
                            : "0 0 20px rgba(100, 181, 246, 0.8), 0 0 30px rgba(100, 181, 246, 0.5)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = inactiveTextColor;
                          e.currentTarget.style.textShadow = "none";
                        }}
                      >
                        Study Mode
                      </NavLink>
                    </div>
                  )}
                </div>
              );
            }
            
            return (
              <NavLink
                key={item.path}
                to={item.path}
                data-tutorial={getTutorialAttr(item.path)}
                style={{
                  ...styles.link,
                  color: textColor,
                  ...(isActive ? {
                    color: activeTextColor,
                    borderBottomColor: activeTextColor,
                    fontWeight: 700,
                    textShadow: isLight ? "0 0 10px rgba(0, 120, 200, 0.3)" : "0 0 10px rgba(100, 181, 246, 0.4)"
                  } : {
                    color: inactiveTextColor,
                    borderBottomColor: "transparent",
                    fontWeight: 600
                  }),
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.textShadow = isLight
                    ? "0 0 20px rgba(0, 120, 200, 0.6), 0 0 30px rgba(0, 120, 200, 0.4)"
                    : "0 0 20px rgba(100, 181, 246, 0.8), 0 0 30px rgba(100, 181, 246, 0.5)";
                  e.currentTarget.style.color = activeTextColor;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.textShadow = isActive
                    ? (isLight ? "0 0 10px rgba(0, 120, 200, 0.3)" : "0 0 10px rgba(100, 181, 246, 0.4)")
                    : "none";
                  e.currentTarget.style.color = isActive ? activeTextColor : inactiveTextColor;
                }}
              >
                {item.label}
              </NavLink>
            );
          })}
        </nav>
        <div style={styles.rightSection}>
          <NavLink
            to="/settings"
            data-tutorial="settings"
            style={{
              ...styles.settingsLink,
              color: textColor,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "rotate(90deg) scale(1.1)";
              e.currentTarget.style.color = activeTextColor;
              e.currentTarget.style.filter = isLight
                ? "drop-shadow(0 0 8px rgba(0, 120, 200, 0.6)) drop-shadow(0 0 12px rgba(0, 120, 200, 0.4))"
                : "drop-shadow(0 0 8px rgba(100, 181, 246, 0.6)) drop-shadow(0 0 12px rgba(100, 181, 246, 0.4))";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "rotate(0deg) scale(1)";
              e.currentTarget.style.color = textColor;
              e.currentTarget.style.filter = "none";
            }}
          >
            <GearIcon />
          </NavLink>
          <button
            style={styles.logout}
            onClick={() => setShowLogoutConfirm(true)}
            onMouseEnter={(e) => {
              setIsLogoutHovered(true);
              e.currentTarget.style.boxShadow = "0 0 20px rgba(255, 90, 95, 0.6), 0 0 40px rgba(255, 90, 95, 0.4)";
              e.currentTarget.style.backgroundColor = "#FF3B3F";
            }}
            onMouseLeave={(e) => {
              setIsLogoutHovered(false);
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.backgroundColor = "#FF5A5F";
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div
          style={{
            ...styles.modalOverlay,
            backgroundColor: isLight ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.7)',
            animation: isModalClosing ? 'fadeOut 0.2s ease-out' : 'fadeIn 0.2s ease-out',
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleCloseModal();
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-modal-title"
        >
          <div
            style={{
              ...styles.modalContent,
              backgroundColor: isLight ? '#FFFFFF' : '#1E1E1E',
              borderColor: isLight ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.15)',
              boxShadow: isLight
                ? '0 20px 60px rgba(0, 0, 0, 0.2), 0 0 40px rgba(255, 90, 95, 0.3), 0 0 80px rgba(255, 90, 95, 0.2), 0 0 120px rgba(255, 90, 95, 0.15)'
                : '0 20px 60px rgba(0, 0, 0, 0.8), 0 0 50px rgba(255, 90, 95, 0.6), 0 0 100px rgba(255, 90, 95, 0.5), 0 0 150px rgba(255, 90, 95, 0.4), 0 0 200px rgba(255, 90, 95, 0.3)',
              animation: isModalClosing ? 'slideOut 0.2s ease-out' : 'slideIn 0.3s ease-out',
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
          >
            {/* Global close button */}
            <button
              type="button"
              style={{
                ...styles.closeButton,
                position: 'absolute',
                right: '1rem',
                top: '1rem',
                color: isLight ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)',
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleCloseModal();
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.1)';
                e.currentTarget.style.color = isLight ? '#000' : '#FFF';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = isLight ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)';
              }}
              aria-label="Close"
            >
              ✕
            </button>

            {/* Icon Section */}
            <div style={styles.modalIconSection}>
              <div style={{
                animation: 'warningPulse 2s ease-in-out infinite',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <WarningIcon isLight={isLight} />
              </div>
            </div>

            <div style={styles.modalHeader}>
              <h3
                id="logout-modal-title"
                style={{
                  ...styles.modalTitle,
                  color: isLight ? '#000000' : '#FFFFFF',
                  textAlign: 'center',
                  width: '100%',
                  lineHeight: '2rem',
                  margin: 0,
                  paddingRight: '3rem',
                }}
              >
                Confirm Logout
              </h3>
            </div>
            <div style={styles.modalBody}>
              <p style={{
                ...styles.modalText,
                color: isLight ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.8)',
              }}>
                Are you sure you want to logout? Any unsaved changes will be lost.
              </p>
            </div>
            <div style={styles.modalFooter}>
                <button
                  style={{
                    ...styles.cancelButton,
                    color: isLight ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.8)',
                    borderColor: isLight ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.2)',
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleCloseModal();
                  }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.borderColor = isLight ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.4)';
                  e.currentTarget.style.color = isLight ? '#000000' : '#FFFFFF';
                  e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
                  e.currentTarget.style.boxShadow = isLight
                    ? '0 6px 20px rgba(0, 0, 0, 0.15), 0 0 30px rgba(0, 120, 200, 0.2)'
                    : '0 6px 20px rgba(0, 0, 0, 0.4), 0 0 30px rgba(100, 181, 246, 0.3), 0 0 50px rgba(100, 181, 246, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.borderColor = isLight ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.2)';
                  e.currentTarget.style.color = isLight ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.8)';
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                Cancel
              </button>
              <button
                style={{
                  ...styles.confirmLogoutButton,
                  boxShadow: '0 0 20px rgba(255, 90, 95, 0.3)',
                }}
                 onClick={(e) => {
                   e.preventDefault();
                   e.stopPropagation();
                   handleCloseModal();
                   onLogout();
                 }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#FF3B3F';
                  e.currentTarget.style.boxShadow = '0 0 35px rgba(255, 90, 95, 0.7), 0 0 60px rgba(255, 90, 95, 0.5), 0 6px 20px rgba(255, 90, 95, 0.4), 0 0 100px rgba(255, 90, 95, 0.3)';
                  e.currentTarget.style.transform = 'translateY(-3px) scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#FF5A5F';
                  e.currentTarget.style.boxShadow = '0 0 20px rgba(255, 90, 95, 0.3)';
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

const styles = {
  container: {
    width: "100%",
    padding: "0",
    position: "sticky",
    top: "0",
    left: 0,
    right: 0,
    zIndex: 50,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    pointerEvents: "none",
    boxSizing: "border-box",
  },
  inner: {
    width: "100%",
    maxWidth: "100%",
    padding: "1rem 2rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "3rem",
    boxSizing: "border-box",
    borderRadius: "0 0 1.5rem 1.5rem",
    background: "rgba(255, 255, 255, 0.08)",
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    borderTop: "none",
    boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.15)",
    pointerEvents: "auto",
    transition: "background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease, backdrop-filter 0.3s ease",
  },
  brand: {
    fontSize: "1.25rem",
    fontWeight: 700,
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
  },
  nav: {
    display: "flex",
    gap: "2rem",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  link: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: "1rem",
    fontWeight: 600,
    paddingBottom: "0.25rem",
    borderBottom: "2px solid transparent",
    transition: "color 0.2s ease, border-color 0.2s ease, text-shadow 0.3s ease",
    textDecoration: "none",
  },
  activeLink: {
    color: "#64B5F6",
    borderBottomColor: "#64B5F6",
    fontWeight: 700,
    textShadow: "0 0 10px rgba(100, 181, 246, 0.4)",
  },
  inactiveLink: {
    color: "rgba(255, 255, 255, 0.6)",
    borderBottomColor: "transparent",
    fontWeight: 600,
  },
  rightSection: {
    display: "flex",
    alignItems: "center",
    gap: "1.5rem",
  },
  settingsLink: {
    color: "rgba(255, 255, 255, 0.8)",
    textDecoration: "none",
    fontSize: "1.3rem",
    fontWeight: 600,
    padding: "0.5rem",
    borderRadius: "6px",
    transition: "color 0.3s ease, background-color 0.2s ease, transform 0.3s ease, filter 0.3s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    lineHeight: 0,
  },
  logout: {
    padding: "0.65rem 1.5rem",
    backgroundColor: "#FF5A5F",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "9999px",
    fontWeight: 600,
    fontSize: "0.95rem",
    cursor: "pointer",
    transition: "background-color 0.2s ease, box-shadow 0.3s ease",
    whiteSpace: "nowrap",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    backdropFilter: "blur(8px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    pointerEvents: "auto",
  },
  modalContent: {
    backgroundColor: "var(--bg-primary)",
    borderRadius: "1.25rem",
    border: "1px solid var(--border-color)",
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
    maxWidth: "440px",
    width: "90%",
    maxHeight: "90vh",
    overflow: "hidden",
    pointerEvents: "auto",
    position: "relative",
  },
  modalIconSection: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "2rem 1.5rem 1rem 1.5rem",
  },
  modalHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 1.5rem 1rem 1.5rem",
    borderBottom: "1px solid var(--border-color)",
    position: "relative",
  },
  modalTitle: {
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "var(--text-primary)",
    margin: 0,
  },
  closeButton: {
    background: "transparent",
    border: "none",
    fontSize: "1.25rem",
    color: "var(--text-secondary)",
    cursor: "pointer",
    padding: "0.375rem",
    borderRadius: "0.5rem",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "2.25rem",
    height: "2.25rem",
    minWidth: "2.25rem",
    minHeight: "2.25rem",
    pointerEvents: "auto",
    lineHeight: 1,
    fontWeight: "normal",
    textAlign: "center",
  },
  modalBody: {
    padding: "1.5rem 1.5rem",
  },
  modalText: {
    fontSize: "1.05rem",
    color: "var(--text-secondary)",
    margin: 0,
    lineHeight: 1.6,
    textAlign: "center",
  },
  modalFooter: {
    display: "flex",
    gap: "1rem",
    padding: "1rem 1.5rem 1.5rem 1.5rem",
    justifyContent: "center",
  },
  cancelButton: {
    padding: "0.85rem 2rem",
    backgroundColor: "transparent",
    color: "var(--text-secondary)",
    border: "2px solid var(--border-color)",
    borderRadius: "0.75rem",
    fontWeight: 600,
    fontSize: "1rem",
    cursor: "pointer",
    transition: "all 0.2s ease",
    pointerEvents: "auto",
    userSelect: "none",
    outline: "none",
  },
  confirmLogoutButton: {
    padding: "0.85rem 2rem",
    backgroundColor: "#FF5A5F",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "0.75rem",
    fontWeight: 600,
    fontSize: "1rem",
    cursor: "pointer",
    transition: "all 0.2s ease",
    pointerEvents: "auto",
    userSelect: "none",
    outline: "none",
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: '-50%',
    width: '200px',
    borderRadius: '0.5rem',
    overflow: 'hidden',
    zIndex: 10,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(12px)',
    background: 'rgba(255, 255, 255, 0.08)',
  },
  dropdownItem: {
    padding: '0.75rem 1.5rem',
    fontSize: '0.95rem',
    fontWeight: 600,
    color: 'rgba(255, 255, 255, 0.6)',
    textDecoration: 'none',
    display: 'block',
    transition: 'color 0.2s ease, text-shadow 0.3s ease',
    borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
    cursor: 'pointer',
  },
};