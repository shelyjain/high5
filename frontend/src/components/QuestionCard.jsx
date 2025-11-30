import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext.jsx';
import TextToSpeechButton from './TextToSpeechButton';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  onNext,
  onPrevious,
  onBackToUnits,
  canGoNext,
  canGoPrevious,
  courseId,
  userProfile
}) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  // Dark theme style overrides
  const darkStyles = {
    container: {
      backgroundColor: '#1F2937',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
    },
    option: {
      border: '2px solid #374151',
      backgroundColor: '#374151',
    },
    selectedOption: {
      backgroundColor: '#1E3A8A',
      borderColor: '#0078C8',
    },
    correctOption: {
      backgroundColor: '#14532D',
      borderColor: '#16A34A',
    },
    incorrectOption: {
      backgroundColor: '#7F1D1D',
      borderColor: '#DC2626',
    },
    disabledOption: {
      backgroundColor: '#2C2C2C',
      borderColor: '#374151',
    },
    progressText: {
      color: '#94A3B8',
    },
    questionText: {
      color: '#F1F5F9',
    },
    optionLetter: {
      color: '#CBD5E1',
    },
    optionText: {
      color: '#E2E8F0',
    },
    explanationContainer: {
      backgroundColor: '#374151',
    },
    explanationTitle: {
      color: '#E2E8F0',
    },
    explanationText: {
      color: '#CBD5E1',
    },
    secondaryButton: {
      backgroundColor: '#374151',
      color: '#F8FAFC',
    },
    backButton: {
      color: '#94A3B8',
    },
  };
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  // Reset state when question changes
  useEffect(() => {
    setSelectedAnswer(null);
    setSubmitted(false);
    setShowExplanation(false);
  }, [question.id, questionNumber]);

  const handleAnswerSelect = (answer) => {
    if (!submitted) {
      setSelectedAnswer(answer);
    }
  };

  const handleSubmit = async () => {
    if (selectedAnswer) {
      setSubmitted(true);
      setShowExplanation(true);
      
      // Track stats for this question
      if (courseId) {
        await trackQuestionStats(courseId, selectedAnswer === question.correctAnswer);
      }
    }
  };

  const trackQuestionStats = async (courseId, isCorrect) => {
    try {
      // For logged-in users: save to Firebase
      if (userProfile && userProfile.uid) {
        try {
          const userRef = doc(db, 'users', userProfile.uid);
          const currentScore = isCorrect ? 100 : 0;
          
          // Read current stats, update, then write back
          const userSnap = await getDoc(userRef);
          const userData = userSnap.data();
          const userStats = userData?.stats || {};
          
          // Initialize course stats if needed
          if (!userStats[courseId]) {
            userStats[courseId] = {
              totalQuestions: 0,
              correct: 0,
              recentScores: []
            };
          }
          
          // Update stats
          userStats[courseId].totalQuestions = (userStats[courseId].totalQuestions || 0) + 1;
          if (isCorrect) {
            userStats[courseId].correct = (userStats[courseId].correct || 0) + 1;
          }
          
          // Update last practiced timestamp
          userStats[courseId].lastPracticed = new Date().toISOString();
          
          // Add to recent scores (keep last 20)
          if (!userStats[courseId].recentScores) {
            userStats[courseId].recentScores = [];
          }
          userStats[courseId].recentScores.push(currentScore);
          if (userStats[courseId].recentScores.length > 20) {
            userStats[courseId].recentScores = userStats[courseId].recentScores.slice(-20);
          }
          
          // Update streak (track practice session for streak calculation)
          const today = new Date().toISOString().split('T')[0];
          if (!userData.streakData) {
            userData.streakData = {
              currentStreak: 0,
              longestStreak: 0,
              lastPracticeDate: null,
              practiceDays: {}
            };
          }
          
          // Mark today as practiced (15+ minutes if user answers 10+ questions)
          if (userStats[courseId].totalQuestions >= 10) {
            userData.streakData.practiceDays[today] = true;
            userData.streakData.lastPracticeDate = today;
            
            // Calculate streak
            let streak = 0;
            let currentDate = new Date();
            for (let i = 0; i < 100; i++) {
              const dateKey = currentDate.toISOString().split('T')[0];
              if (userData.streakData.practiceDays[dateKey]) {
                streak++;
                currentDate.setDate(currentDate.getDate() - 1);
              } else {
                break;
              }
            }
            
            userData.streakData.currentStreak = streak;
            userData.streakData.longestStreak = Math.max(streak, userData.streakData.longestStreak || 0);
          }
          
          // Write back to Firebase
          await updateDoc(userRef, {
            stats: userStats,
            streakData: userData.streakData
          });
          
          console.log('✅ Stats updated to Firebase:', {
            courseId,
            totalQuestions: userStats[courseId].totalQuestions,
            correct: userStats[courseId].correct,
            isCorrect,
            streak: userData.streakData.currentStreak
          });
        } catch (firebaseError) {
          console.error('Error updating Firebase stats:', firebaseError);
        }
      } else {
        // For guests: save to localStorage
        const existingStats = JSON.parse(localStorage.getItem('mcqStats') || '{}');
        
        if (!existingStats[courseId]) {
          existingStats[courseId] = {
            totalQuestions: 0,
            correct: 0,
            recentScores: [],
            sessions: []
          };
        }
        
        existingStats[courseId].totalQuestions += 1;
        if (isCorrect) {
          existingStats[courseId].correct += 1;
        }
        
        // Update last practiced timestamp
        existingStats[courseId].lastPracticed = new Date().toISOString();
        
        const currentScore = isCorrect ? 100 : 0;
        existingStats[courseId].recentScores.push(currentScore);
        if (existingStats[courseId].recentScores.length > 20) {
          existingStats[courseId].recentScores.shift();
        }
        
        localStorage.setItem('mcqStats', JSON.stringify(existingStats));
        console.log('✅ Stats updated to localStorage (guest):', courseId);
      }
    } catch (error) {
      console.error('Error tracking question stats:', error);
    }
  };

  const handleNext = () => {
    if (canGoNext) {
      onNext();
    }
  };

  const handlePrevious = () => {
    if (canGoPrevious) {
      onPrevious();
    }
  };

  const isCorrect = submitted && selectedAnswer === question.correctAnswer;

  if (!question) {
    return (
      <div style={styles.container}>
        <p style={styles.errorText}>No question data available</p>
      </div>
    );
  }

  return (
    <div style={{ ...styles.container, ...(isDark ? darkStyles.container : {}) }}>
      <div style={styles.header}>
        <div style={styles.progress}>
          <span style={{ ...styles.progressText, ...(isDark ? darkStyles.progressText : {}) }}>
            Question {questionNumber} of {totalQuestions}
          </span>
        </div>
      </div>

      <div style={styles.questionContainer}>
        <div style={styles.questionHeader}>
          <h2 style={{ ...styles.questionText, ...(isDark ? darkStyles.questionText : {}) }}>
            {question.question}
          </h2>
          <TextToSpeechButton 
            text={question.question}
            style={{ marginLeft: '8px' }}
          />
        </div>

        <div style={styles.optionsContainer}>
          {question.options.map((option, index) => {
            const optionLetter = String.fromCharCode(65 + index); // A, B, C, D
            const isSelected = selectedAnswer === optionLetter;
            const isCorrectOption = optionLetter === question.correctAnswer;
            
            let optionStyle = { ...styles.option, ...(isDark ? darkStyles.option : {}) };
            if (submitted) {
              if (isCorrectOption) {
                optionStyle = { ...optionStyle, ...styles.correctOption, ...(isDark ? darkStyles.correctOption : {}) };
              } else if (isSelected && !isCorrectOption) {
                optionStyle = { ...optionStyle, ...styles.incorrectOption, ...(isDark ? darkStyles.incorrectOption : {}) };
              } else {
                optionStyle = { ...optionStyle, ...styles.disabledOption, ...(isDark ? darkStyles.disabledOption : {}) };
              }
            } else if (isSelected) {
              optionStyle = { ...optionStyle, ...styles.selectedOption, ...(isDark ? darkStyles.selectedOption : {}) };
            }

            return (
              <div
                key={index}
                style={optionStyle}
                onClick={() => handleAnswerSelect(optionLetter)}
              >
                <span style={{ ...styles.optionLetter, ...(isDark ? darkStyles.optionLetter : {}) }}>{optionLetter}.</span>
                <span style={{ ...styles.optionText, ...(isDark ? darkStyles.optionText : {}) }}>{option.replace(/^[A-D]\.\s*/, '')}</span>
              </div>
            );
          })}
        </div>

        {!submitted && (
          <button
            style={{
              ...styles.submitButton,
              ...(selectedAnswer ? {} : styles.disabledSubmitButton)
            }}
            onClick={handleSubmit}
            disabled={!selectedAnswer}
          >
            Submit Answer
          </button>
        )}

        {submitted && (
          <div style={styles.resultContainer}>
            <div style={styles.resultHeader}>
              <span style={{
                ...styles.resultText,
                ...(isCorrect ? styles.correctResult : styles.incorrectResult)
              }}>
                {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
              </span>
            </div>

            {showExplanation && (
              <div style={{ ...styles.explanationContainer, ...(isDark ? darkStyles.explanationContainer : {}) }}>
                <h4 style={{ ...styles.explanationTitle, ...(isDark ? darkStyles.explanationTitle : {}) }}>Explanation:</h4>
                <div style={styles.explanationHeader}>
                  <p style={{ ...styles.explanationText, ...(isDark ? darkStyles.explanationText : {}) }}>
                    {question.explanation}
                  </p>
                  <TextToSpeechButton 
                    text={question.explanation}
                    style={{ marginLeft: '8px' }}
                  />
                </div>
              </div>
            )}

            <div style={styles.navigationContainer}>
              <button
                style={{
                  ...styles.navButton,
                  ...styles.secondaryButton,
                  ...(isDark ? darkStyles.secondaryButton : {}),
                  ...(!canGoPrevious ? styles.disabledButton : {})
                }}
                onClick={handlePrevious}
                disabled={!canGoPrevious}
              >
                Previous
              </button>

              <button
                style={{
                  ...styles.navButton,
                  ...styles.primaryButton,
                  ...(!canGoNext ? styles.disabledButton : {})
                }}
                onClick={handleNext}
                disabled={!canGoNext}
              >
                {canGoNext ? 'Next Question' : 'Finish'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div style={styles.footer}>
        <button style={{ ...styles.backButton, ...(isDark ? darkStyles.backButton : {}) }} onClick={onBackToUnits}>
          Back to Units
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: "1rem",
    padding: "2rem",
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.1)",
    marginBottom: "1.5rem",
  },
  header: {
    marginBottom: "1.5rem",
  },
  progress: {
    textAlign: "center",
  },
  progressText: {
    fontSize: "0.9rem",
    color: "#64748B",
    fontWeight: 600,
  },
  questionContainer: {
    marginBottom: "1.5rem",
  },
  questionHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    marginBottom: '1.5rem',
  },
  questionText: {
    fontSize: "1.25rem",
    fontWeight: 600,
    color: "#0F172A",
    margin: 0,
    lineHeight: 1.6,
    flex: 1,
  },
  optionsContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
    marginBottom: "1.5rem",
  },
  option: {
    display: "flex",
    alignItems: "flex-start",
    padding: "1rem",
    border: "2px solid #E2E8F0",
    borderRadius: "0.75rem",
    cursor: "pointer",
    transition: "all 0.2s ease",
    backgroundColor: "#FFFFFF",
  },
  selectedOption: {
    borderColor: "#0078C8",
    backgroundColor: "#F0F9FF",
  },
  correctOption: {
    borderColor: "#16A34A",
    backgroundColor: "#F0FDF4",
  },
  incorrectOption: {
    borderColor: "#DC2626",
    backgroundColor: "#FEF2F2",
  },
  disabledOption: {
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    cursor: "not-allowed",
    opacity: 0.7,
  },
  optionLetter: {
    fontSize: "1rem",
    fontWeight: 700,
    color: "#475569",
    marginRight: "0.75rem",
    minWidth: "1.5rem",
  },
  optionText: {
    fontSize: "1rem",
    color: "#0F172A",
    lineHeight: 1.5,
    flex: 1,
  },
  submitButton: {
    width: "100%",
    padding: "0.875rem 1.5rem",
    backgroundColor: "#0078C8",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "0.75rem",
    fontSize: "1rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "background-color 0.2s ease",
  },
  disabledSubmitButton: {
    backgroundColor: "#94A3B8",
    cursor: "not-allowed",
  },
  resultContainer: {
    marginTop: "1.5rem",
  },
  resultHeader: {
    textAlign: "center",
    marginBottom: "1rem",
  },
  resultText: {
    fontSize: "1.25rem",
    fontWeight: 700,
  },
  correctResult: {
    color: "#16A34A",
  },
  incorrectResult: {
    color: "#DC2626",
  },
  explanationContainer: {
    backgroundColor: "#F8FAFC",
    borderRadius: "0.75rem",
    padding: "1.25rem",
    marginBottom: "1.5rem",
  },
  explanationTitle: {
    fontSize: "1rem",
    fontWeight: 600,
    color: "#0F172A",
    margin: "0 0 0.5rem 0",
  },
  explanationHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
  },
  explanationText: {
    fontSize: "0.95rem",
    color: "#475569",
    margin: 0,
    lineHeight: 1.6,
    flex: 1,
  },
  navigationContainer: {
    display: "flex",
    gap: "1rem",
    justifyContent: "center",
  },
  navButton: {
    padding: "0.75rem 1.5rem",
    border: "none",
    borderRadius: "0.75rem",
    fontSize: "0.95rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  primaryButton: {
    backgroundColor: "#0078C8",
    color: "#FFFFFF",
  },
  secondaryButton: {
    backgroundColor: "#E2E8F0",
    color: "#0F172A",
  },
  disabledButton: {
    backgroundColor: "#94A3B8",
    color: "#FFFFFF",
    cursor: "not-allowed",
    opacity: 0.7,
  },
  footer: {
    borderTop: "1px solid #E2E8F0",
    paddingTop: "1rem",
    textAlign: "center",
  },
  backButton: {
    backgroundColor: "transparent",
    border: "none",
    color: "#64748B",
    fontSize: "0.9rem",
    fontWeight: 600,
    cursor: "pointer",
    textDecoration: "underline",
  },
  errorText: {
    color: "#DC2626",
    textAlign: "center",
    fontSize: "1rem",
  },
};