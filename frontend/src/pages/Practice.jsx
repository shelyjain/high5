import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getCourseById } from "../data/apCourses";
import { getUnitsForCourse, getQuestionsForUnit, getAdaptivePracticeQuestions } from "../utils/api";
import QuestionCard from "../components/QuestionCard";

export default function Practice({
  selectedCourse,
  onEnsureCourseSelection,
  onBackToDashboard,
  userProfile,
}) {
  const { courseId } = useParams();

  const courseFromRoute = courseId ? getCourseById(courseId) : null;
  const selectedCourseId = selectedCourse?.id ?? null;
  const routeCourseId = courseFromRoute?.id ?? null;
  const activeCourse = courseFromRoute ?? selectedCourse ?? null;
  const courseName = activeCourse?.name ?? "your AP course";
  const activeCourseId = activeCourse?.id ?? null;

  // State for unit selection and questions
  const [units, setUnits] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [loadingUnitNumber, setLoadingUnitNumber] = useState(null);
  const [error, setError] = useState(null);
  const [showQuestions, setShowQuestions] = useState(false);
  const [isAdaptiveMode, setIsAdaptiveMode] = useState(false);
  const [showAdaptiveButton, setShowAdaptiveButton] = useState(false);

  useEffect(() => {
    if (!courseFromRoute || !onEnsureCourseSelection) return;
    if (selectedCourseId === routeCourseId) return;
    onEnsureCourseSelection(courseFromRoute);
  }, [courseFromRoute, onEnsureCourseSelection, selectedCourseId, routeCourseId]);

  // Load units when course is available
  const loadUnits = useCallback(async () => {
    if (!activeCourseId) {
      console.log('No active course ID found');
      return;
    }
    
    console.log('Loading units for course:', activeCourseId);
    setLoading(true);
    setError(null);
    
    try {
      const response = await getUnitsForCourse(activeCourseId);
      setUnits(response.units || []);
    } catch (err) {
      setError(err.message);
      console.error('Failed to load units:', err);
    } finally {
      setLoading(false);
    }
  }, [activeCourseId]);

  useEffect(() => {
    if (activeCourseId) {
      console.log('Loading units for course:', activeCourseId);
      loadUnits();
    } else {
      console.log('No active course found, not loading units');
    }
  }, [activeCourseId, loadUnits]);

  const handleUnitSelect = async (unit) => {
    if (!activeCourseId) {
      setError('Course not available for practice.');
      return;
    }

    setLoadingQuestions(true);
    setLoadingUnitNumber(unit.number);
    setError(null);
    setIsAdaptiveMode(false);
    
    try {
      const isAuthenticated = !!userProfile?.uid;
      const response = await getQuestionsForUnit(activeCourseId, unit.number, isAuthenticated);
      
      // Check if this course doesn't have MCQ sections
      if (response.questions && response.questions.source === 'no-mcq') {
        setError(response.questions.message || 'This AP exam does not have multiple choice questions.');
        return;
      }
      
      setQuestions(response.questions || []);
      setSelectedUnit(unit);
      setCurrentQuestionIndex(0);
      setShowQuestions(true);
      setShowAdaptiveButton(isAuthenticated && response.questions?.length >= 12);
      
      // Update the unit to show it has questions
      setUnits(prevUnits => 
        prevUnits.map(u => 
          u.number === unit.number 
            ? { ...u, hasQuestions: true }
            : u
        )
      );
    } catch (err) {
      setError(err.message);
      console.error('Failed to load questions:', err);
    } finally {
      setLoadingQuestions(false);
      setLoadingUnitNumber(null);
    }
  };

  const handleBackToUnits = () => {
    setShowQuestions(false);
    setSelectedUnit(null);
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setIsAdaptiveMode(false);
    setShowAdaptiveButton(false);
  };

  const handleAdaptivePractice = async () => {
    if (!activeCourseId || !selectedUnit) {
      setError('Course or unit not available for adaptive practice.');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Get previous answers from localStorage
      const existingStats = JSON.parse(localStorage.getItem('mcqStats') || '{}');
      const courseStats = existingStats[activeCourseId] || {};
      const previousAnswers = courseStats.recentScores || [];
      
      // Convert scores to answer format expected by backend
      const formattedAnswers = previousAnswers.map((score, index) => ({
        isCorrect: score === 100,
        questionId: `q${index + 1}`,
        topic: 'general' // We could enhance this to track specific topics
      }));

      const response = await getAdaptivePracticeQuestions(activeCourseId, selectedUnit.number, formattedAnswers);
      setQuestions(response.questions || []);
      setCurrentQuestionIndex(0);
      setIsAdaptiveMode(true);
      setShowAdaptiveButton(false);
    } catch (err) {
      setError(err.message);
      console.error('Failed to load adaptive questions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  if (!activeCourse) {
    return (
      <section style={styles.wrapper}>
        <div style={styles.header}>
          <h1 style={styles.title}>Practice Hub</h1>
          <p style={styles.subtitle}>
            Pick a course before jumping into practice. Head to AP Courses to get
            set up, or open a course workspace to start.
          </p>
        </div>
        <div style={styles.buttonRow}>
          <button style={styles.secondaryButton} onClick={onBackToDashboard}>
            Back to Dashboard
          </button>
        </div>
      </section>
    );
  }

  if (showQuestions && questions.length > 0) {
    return (
      <section style={styles.wrapper}>
        <div style={styles.header}>
          <h1 style={styles.title}>
            {courseName} - Unit {selectedUnit.number}
            {isAdaptiveMode && <span style={styles.adaptiveBadge}>Adaptive Practice</span>}
          </h1>
          <p style={styles.subtitle}>
            Question {currentQuestionIndex + 1} of {questions.length}
            {isAdaptiveMode && <span style={styles.adaptiveSubtitle}> - Personalized for your weak areas</span>}
          </p>
        </div>

        {showAdaptiveButton && !isAdaptiveMode && (
          <div style={styles.adaptiveButtonContainer}>
            <button 
              style={styles.adaptiveButton}
              onClick={handleAdaptivePractice}
              disabled={loading}
            >
              {loading ? 'Generating...' : 'Generate Adaptive Practice (6 questions)'}
            </button>
            <p style={styles.adaptiveButtonDescription}>
              Get personalized questions based on your previous performance
            </p>
          </div>
        )}

        <QuestionCard
          question={questions[currentQuestionIndex]}
          questionNumber={currentQuestionIndex + 1}
          totalQuestions={questions.length}
          onNext={handleNextQuestion}
          onPrevious={handlePreviousQuestion}
          onBackToUnits={handleBackToUnits}
          canGoNext={currentQuestionIndex < questions.length - 1}
          canGoPrevious={currentQuestionIndex > 0}
          courseId={activeCourseId}
          userProfile={userProfile}
        />
      </section>
    );
  }

  return (
    <section style={styles.wrapper}>
      <div style={styles.header}>
        <h1 style={styles.title}>Practice Hub</h1>
        <p style={styles.subtitle}>
          Choose a unit to practice with AI-generated questions for <strong>{courseName}</strong>.
          {userProfile?.uid ? (
            <span style={styles.authInfo}> You'll get 12 questions per unit.</span>
          ) : (
            <span style={styles.guestInfo}> You'll get 6 questions per unit.</span>
          )}
        </p>
      </div>

      {loading && (
        <div style={styles.loadingContainer}>
          <p style={styles.loadingText}>Loading units...</p>
        </div>
      )}

      {error && (
        <div style={styles.errorContainer}>
          <p style={styles.errorText}>{error}</p>
          <button style={styles.retryButton} onClick={loadUnits}>
            Retry
          </button>
        </div>
      )}

      {!loading && !error && units.length > 0 && (
        <div style={styles.unitsGrid}>
          {units.map((unit) => (
            <div
              key={unit.number}
              style={styles.unitCard}
              onClick={() => handleUnitSelect(unit)}
            >
              <h3 style={styles.unitTitle}>Unit {unit.number}</h3>
              <div style={styles.unitStatus}>
                {loadingUnitNumber === unit.number ? (
                  <>
                    <div style={styles.loadingSpinner}></div>
                    <span style={styles.loadingText}>Generating...</span>
                  </>
                ) : (
                  <>
                    <span style={{
                      ...styles.statusBadge,
                      ...(unit.hasQuestions ? styles.statusGenerated : styles.statusPending)
                    }}>
                      {unit.hasQuestions ? 'Generated' : 'Generate Questions'}
                    </span>
                    <div style={styles.questionCountInfo}>
                      {userProfile?.uid ? '12 questions' : '6 questions'}
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && !error && units.length === 0 && (
        <div style={styles.noUnitsContainer}>
          <p style={styles.noUnitsText}>
            No units found for this course. Please ensure the CED PDF is placed in the backend.
          </p>
        </div>
      )}

      <div style={styles.buttonRow}>
        <button style={styles.secondaryButton} onClick={onBackToDashboard}>
          Back to Dashboard
        </button>
      </div>
    </section>
  );
}

const styles = {
  wrapper: {
    width: "100%",
    maxWidth: "1200px",
    margin: "0 auto",
    backgroundColor: "var(--bg-secondary)",
    borderRadius: "1.5rem",
    padding: "3rem 4rem",
    boxShadow: "0 20px 40px var(--shadow-color), 0 0 0 1px var(--border-color)",
    boxSizing: "border-box",
    color: "var(--text-primary)",
    transition: "all 0.3s ease",
    backdropFilter: "blur(10px)",
  },
  header: {
    marginBottom: "1.5rem",
  },
  title: {
    fontSize: "2.5rem",
    fontWeight: 800,
    marginBottom: "0.5rem",
    transition: "color 0.3s ease",
    background: "linear-gradient(135deg, var(--text-primary) 0%, #0078C8 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },
  subtitle: {
    fontSize: "1.1rem",
    color: "var(--text-secondary)",
    margin: 0,
    transition: "color 0.3s ease",
  },
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "2rem",
  },
  loadingText: {
    fontSize: "1.1rem",
    color: "var(--text-secondary)",
    margin: 0,
    transition: "color 0.3s ease",
  },
  errorContainer: {
    backgroundColor: "rgba(220, 38, 38, 0.1)",
    border: "1px solid rgba(220, 38, 38, 0.3)",
    borderRadius: "0.75rem",
    padding: "1.5rem",
    marginBottom: "1.5rem",
    textAlign: "center",
    transition: "background-color 0.3s ease, border-color 0.3s ease",
  },
  errorText: {
    color: "#DC2626",
    margin: "0 0 1rem 0",
    fontSize: "1rem",
  },
  retryButton: {
    padding: "0.5rem 1rem",
    backgroundColor: "#DC2626",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "0.5rem",
    fontWeight: 600,
    cursor: "pointer",
  },
  unitsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "1.5rem",
    marginBottom: "2rem",
  },
  unitCard: {
    backgroundColor: "var(--bg-primary)",
    borderRadius: "1rem",
    padding: "1.5rem",
    border: "2px solid var(--border-color)",
    cursor: "pointer",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 12px var(--shadow-color)",
    color: "var(--text-primary)",
  },
  unitTitle: {
    fontSize: "1.25rem",
    fontWeight: 700,
    color: "var(--text-primary)",
    margin: "0 0 0.5rem 0",
    transition: "color 0.3s ease",
  },
  unitSubtitle: {
    fontSize: "0.95rem",
    color: "var(--text-secondary)",
    margin: "0 0 1rem 0",
    transition: "color 0.3s ease",
  },
  unitStatus: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "0.5rem",
  },
  statusBadge: {
    padding: "0.25rem 0.75rem",
    borderRadius: "1rem",
    fontSize: "0.8rem",
    fontWeight: 600,
  },
  statusGenerated: {
    backgroundColor: "rgba(34, 197, 94, 0.2)",
    color: "#22C55E",
  },
  statusPending: {
    backgroundColor: "rgba(251, 191, 36, 0.2)",
    color: "#FBbf24",
  },
  loadingSpinner: {
    width: "16px",
    height: "16px",
    border: "2px solid rgba(255, 255, 255, 0.3)",
    borderTop: "2px solid var(--text-primary)",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    marginBottom: "0.25rem",
  },
  loadingText: {
    fontSize: "0.8rem",
    color: "var(--text-secondary)",
    fontWeight: 500,
  },
  noUnitsContainer: {
    backgroundColor: "var(--bg-primary)",
    borderRadius: "0.75rem",
    padding: "2rem",
    textAlign: "center",
    marginBottom: "1.5rem",
    border: "1px solid var(--border-color)",
    transition: "background-color 0.3s ease, border-color 0.3s ease",
  },
  noUnitsText: {
    color: "var(--text-secondary)",
    margin: 0,
    fontSize: "1rem",
    transition: "color 0.3s ease",
  },
  buttonRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "1rem",
  },
  primaryButton: {
    alignSelf: "flex-start",
    padding: "0.85rem 1.75rem",
    backgroundColor: "#0078C8",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "0.75rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "opacity 0.2s ease",
  },
  secondaryButton: {
    padding: "0.75rem 1.5rem",
    backgroundColor: "var(--bg-primary)",
    color: "var(--text-primary)",
    border: "1px solid var(--border-color)",
    borderRadius: "0.75rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.3s ease",
  },
  disabledButton: {
    backgroundColor: "var(--text-secondary)",
    cursor: "not-allowed",
    opacity: 0.7,
  },
  adaptiveBadge: {
    fontSize: "0.8rem",
    fontWeight: 600,
    color: "#0078C8",
    backgroundColor: "rgba(0, 120, 200, 0.15)",
    padding: "0.25rem 0.75rem",
    borderRadius: "1rem",
    marginLeft: "1rem",
  },
  adaptiveSubtitle: {
    color: "#0078C8",
    fontWeight: 500,
  },
  adaptiveButtonContainer: {
    backgroundColor: "var(--bg-primary)",
    border: "2px solid #0078C8",
    borderRadius: "1rem",
    padding: "1.5rem",
    marginBottom: "1.5rem",
    textAlign: "center",
    transition: "background-color 0.3s ease",
  },
  adaptiveButton: {
    padding: "0.85rem 1.75rem",
    backgroundColor: "#0078C8",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "0.75rem",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: "1rem",
    marginBottom: "0.5rem",
    transition: "all 0.2s ease",
  },
  adaptiveButtonDescription: {
    color: "var(--text-secondary)",
    fontSize: "0.9rem",
    margin: 0,
    fontStyle: "italic",
    transition: "color 0.3s ease",
  },
  authInfo: {
    color: "#0078C8",
    fontWeight: 600,
  },
  guestInfo: {
    color: "var(--text-secondary)",
    fontStyle: "italic",
    transition: "color 0.3s ease",
  },
  questionCountInfo: {
    fontSize: "0.8rem",
    color: "var(--text-secondary)",
    fontWeight: 500,
    transition: "color 0.3s ease",
  },
};
