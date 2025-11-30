import { useState, useEffect } from 'react';

const OnboardingTutorial = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const steps = [
    {
      id: 'navbar',
      title: 'Welcome to High5! 👋',
      message: 'This is your navigation bar. Here you can access all the main features of the app.',
      position: 'bottom',
      targetSelector: '[data-tutorial="navbar"]'
    },
    {
      id: 'home',
      title: 'Home Dashboard',
      message: 'Your home page shows your enrolled courses and quick access to your learning materials.',
      position: 'bottom',
      targetSelector: '[data-tutorial="home"]'
    },
    {
      id: 'courses',
      title: 'Browse Courses',
      message: 'Explore all available AP courses and enroll in the ones you want to study.',
      position: 'bottom',
      targetSelector: '[data-tutorial="courses"]'
    },
    {
      id: 'practice',
      title: 'Practice Tests',
      message: 'Take AI-generated practice MCQs powered by official AP Course and Exam Description (CED) content. Upload text responses or images for FRQ grading and get detailed feedback to prepare for your exams.',
      position: 'bottom',
      targetSelector: '[data-tutorial="practice"]'
    },
    {
      id: 'flashcards',
      title: 'Flashcards',
      message: 'Create and study personalized flashcards to help you memorize key concepts, terms, and definitions for your AP exams. Organize them by folder and track your progress.',
      position: 'bottom',
      targetSelector: '[data-tutorial="flashcards"]'
    },
    {
      id: 'community',
      title: 'Community',
      message: 'Ask any questions related to AP course topics and see questions from other students. Get answers from the community and help others learn.',
      position: 'bottom',
      targetSelector: '[data-tutorial="community"]'
    },
    {
      id: 'calendar',
      title: 'Study Calendar',
      message: 'Plan out your study sessions and schedule your learning. Stay organized and track your progress toward your goals.',
      position: 'bottom',
      targetSelector: '[data-tutorial="calendar"]'
    },
    {
      id: 'stats',
      title: 'My Stats',
      message: 'View your performance and track your progress. See how many questions you\'ve answered correctly and monitor your learning journey.',
      position: 'bottom',
      targetSelector: '[data-tutorial="stats"]'
    },
    {
      id: 'settings',
      title: 'Settings & Profile',
      message: 'Customize your profile, settings, and view your learning statistics.',
      position: 'bottom',
      targetSelector: '[data-tutorial="settings"]'
    }
  ];

  useEffect(() => {
    // Check if user is a guest
    const isGuest = localStorage.getItem('isGuest') === 'true';
    
    // Always show tutorial for guests
    if (isGuest) {
      setTimeout(() => setIsVisible(true), 500);
      return;
    }
    
    // For logged-in users, check if they've seen the tutorial
    const hasSeenTutorial = localStorage.getItem('hasSeenTutorial');
    // TEMPORARY: Uncomment to test tutorial (forces it to show)
    const forceShowTutorial = localStorage.getItem('forceShowTutorial');
    
    if (!hasSeenTutorial || forceShowTutorial === 'true') {
      setTimeout(() => setIsVisible(true), 500);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTutorial();
    }
  };

  const handleSkip = () => {
    completeTutorial();
  };

  const completeTutorial = () => {
    // Don't save completion for guests - always show tutorial
    const isGuest = localStorage.getItem('isGuest') === 'true';
    if (!isGuest) {
      localStorage.setItem('hasSeenTutorial', 'true');
    }
    setIsVisible(false);
    onComplete?.();
  };

  if (!isVisible) return null;

  const currentStepData = steps[currentStep];
  const targetElement = document.querySelector(currentStepData.targetSelector);
  
  // Fallback to a reasonable position if element not found
  const rect = targetElement?.getBoundingClientRect() || { 
    top: 0, 
    left: 0, 
    width: 0, 
    height: 0 
  };

  const getTooltipStyle = () => {
    const offset = 20;
    const popupWidth = 360; // maxWidth from the tooltip div
    const screenWidth = window.innerWidth;
    let top, left;

    switch (currentStepData.position) {
      case 'top':
        top = rect.top - offset;
        left = rect.left + rect.width / 2;
        break;
      case 'bottom':
        top = rect.bottom + offset;
        left = rect.left + rect.width / 2;
        break;
      case 'left':
        top = rect.top + rect.height / 2;
        left = rect.left - offset;
        break;
      case 'right':
        top = rect.top + rect.height / 2;
        left = rect.right + offset;
        break;
      default:
        top = rect.bottom + offset;
        left = rect.left + rect.width / 2;
    }

    // Adjust left position to keep popup on screen
    const halfWidth = popupWidth / 2;
    if (left - halfWidth < 20) {
      left = halfWidth + 20; // Keep 20px from left edge
    } else if (left + halfWidth > screenWidth - 20) {
      left = screenWidth - halfWidth - 20; // Keep 20px from right edge
    }

    return {
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      transform: 'translate(-50%, 0)',
      zIndex: 10000
    };
  };

  return (
    <>
      {/* Dark Overlay */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          zIndex: 9998
        }}
      />

      {/* Highlight Box */}
      {targetElement && (
        <div
          style={{
            position: 'fixed',
            top: `${rect.top}px`,
            left: `${rect.left}px`,
            width: `${rect.width}px`,
            height: `${rect.height}px`,
            border: '4px solid #3B82F6',
            borderRadius: '8px',
            zIndex: 9999,
            pointerEvents: 'none',
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.85), 0 0 20px rgba(59, 130, 246, 0.5)',
            backgroundColor: 'rgba(255, 255, 255, 0.15)'
          }}
        />
      )}

      {/* Tooltip */}
      <div
        style={getTooltipStyle()}
      >
        <div
          style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            padding: '1.5rem',
            minWidth: '350px',
            maxWidth: '360px',
            width: 'auto',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(0, 0, 0, 0.1)'
          }}
        >
          <h3 style={{
            margin: '0 0 0.5rem 0',
            fontSize: '1.25rem',
            fontWeight: 600,
            color: '#022037'
          }}>
            {currentStepData.title}
          </h3>
          
          <p style={{
            margin: '0 0 1.5rem 0',
            fontSize: '0.95rem',
            color: '#234456',
            lineHeight: 1.6
          }}>
            {currentStepData.message}
          </p>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{
              fontSize: '0.875rem',
              color: '#234456',
              fontWeight: 600
            }}>
              Step {currentStep + 1} of {steps.length}
            </span>
            
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={handleSkip}
                style={{
                  background: 'transparent',
                  color: '#234456',
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  borderRadius: '6px',
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                }}
              >
                Skip
              </button>
              
              <button
                onClick={handleNext}
                style={{
                  background: '#0078C8',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.5rem 1.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.opacity = '0.9';
                }}
                onMouseLeave={(e) => {
                  e.target.style.opacity = '1';
                }}
              >
                {currentStep === steps.length - 1 ? 'Got it!' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OnboardingTutorial;
