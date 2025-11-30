import React, { useState, useEffect } from "react";
import { apCourses } from "../data/apCourses";
import { collection, addDoc, getDocs, query, orderBy, where } from "firebase/firestore";
import { db } from "../firebase";

export default function Community({ userProfile }) {
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("");
  const [units, setUnits] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [expandedAnswers, setExpandedAnswers] = useState(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const isGuest = !userProfile || !userProfile.uid;

  // Toggle answer expansion
  const toggleAnswer = (questionId) => {
    const newExpanded = new Set(expandedAnswers);
    if (newExpanded.has(questionId)) {
      newExpanded.delete(questionId);
    } else {
      newExpanded.add(questionId);
    }
    setExpandedAnswers(newExpanded);
  };

  // Generate random animal name for anonymous users
  const generateAnonymousName = () => {
    const animals = [
      'Lion', 'Tiger', 'Eagle', 'Dolphin', 'Wolf', 'Bear', 'Fox', 'Hawk', 'Shark', 'Panther',
      'Falcon', 'Cheetah', 'Lynx', 'Owl', 'Raven', 'Cobra', 'Phoenix', 'Dragon', 'Griffin', 'Unicorn',
      'Elephant', 'Rhino', 'Giraffe', 'Zebra', 'Penguin', 'Otter', 'Seal', 'Whale', 'Octopus', 'Butterfly',
      'Bee', 'Spider', 'Ant', 'Beetle', 'Ladybug', 'Firefly', 'Cricket', 'Grasshopper', 'Mantis', 'Dragonfly'
    ];
    const randomAnimal = animals[Math.floor(Math.random() * animals.length)];
    return `Anonymous ${randomAnimal}`;
  };

  // Load questions from Firebase
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const questionsRef = collection(db, 'communityQuestions');
        const q = query(questionsRef, orderBy('timestamp', 'desc'));
        const querySnapshot = await getDocs(q);
        
        const loadedQuestions = [];
        querySnapshot.forEach((doc) => {
          loadedQuestions.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        setQuestions(loadedQuestions);
      } catch (error) {
        console.error('Error loading questions:', error);
        setQuestions([]);
      }
    };

    loadQuestions();
  }, []);

  // Save questions to Firebase
  const saveQuestionToFirebase = async (questionData) => {
    try {
      const questionsRef = collection(db, 'communityQuestions');
      await addDoc(questionsRef, questionData);
      
      // Update local state
      setQuestions(prev => [questionData, ...prev]);
    } catch (error) {
      console.error('Error saving question:', error);
      throw error;
    }
  };

  // Handle course selection
  const handleCourseChange = (courseId) => {
    setSelectedCourse(courseId);
    setSelectedUnit("");
    
    if (courseId) {
      setIsLoading(true);
      // Get units for the selected course
      fetch(`http://localhost:5001/api/questions/units/${courseId}`)
        .then(response => {
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          return response.json();
        })
        .then(data => {
          if (data.units) {
            // Convert the units format to simple strings
            const unitStrings = data.units.map(unit => 
              typeof unit === 'string' ? unit : `Unit ${unit.number}`
            );
            setUnits(unitStrings);
          } else {
            setUnits([]);
          }
        })
        .catch(error => {
          console.error('Error fetching units:', error);
          // Use fallback units if backend is not available
          const fallbackUnits = [
            "Unit 1: Foundations",
            "Unit 2: Core Concepts", 
            "Unit 3: Applications",
            "Unit 4: Advanced Topics",
            "Unit 5: Review & Practice"
          ];
          setUnits(fallbackUnits);
          console.log('Using fallback units due to backend error');
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setUnits([]);
    }
  };

  // Filter questions by course and unit
  const filteredQuestions = questions.filter(q => 
    q.course === selectedCourse && 
    (selectedUnit === "" || q.unit === selectedUnit)
  );

  // Handle asking a new question
  const handleAskQuestion = async () => {
    if (!newQuestion.trim() || !selectedCourse || !selectedUnit) {
      alert("Please select a course, unit, and enter your question.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('http://localhost:5001/api/community/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: newQuestion,
          course: selectedCourse,
          unit: selectedUnit,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const questionData = {
          question: newQuestion,
          answer: data.answer,
          course: selectedCourse,
          unit: selectedUnit,
          timestamp: new Date().toISOString(),
          author: generateAnonymousName(),
        };

        await saveQuestionToFirebase(questionData);
        setNewQuestion("");
      } else {
        alert("Error: " + data.message);
      }
    } catch (error) {
      console.error('Error asking question:', error);
      alert("Failed to submit question. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle deleting a question (removed for anonymous system)
  // const handleDeleteQuestion = (questionId) => {
  //   if (window.confirm("Are you sure you want to delete this question?")) {
  //     const updatedQuestions = questions.filter(q => q.id !== questionId);
  //     saveQuestions(updatedQuestions);
  //   }
  // };

  return (
    <section style={styles.wrapper}>
      <header style={styles.header}>
        <h1 style={styles.title}>Community Q&A</h1>
        <p style={styles.subtitle}>
          Ask questions about AP courses and get AI-powered answers. 
          See other students' questions and learn together!
        </p>
      </header>

      {/* Course and Unit Selection */}
      <div style={styles.selectionContainer}>
        <div style={styles.selectGroup}>
          <label style={styles.label}>Choose AP Course:</label>
          <select
            value={selectedCourse}
            onChange={(e) => handleCourseChange(e.target.value)}
            style={styles.select}
          >
            <option value="">Select a course...</option>
            {apCourses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </select>
        </div>

        <div style={styles.selectGroup}>
          <label style={styles.label}>Choose Unit:</label>
          <select
            value={selectedUnit}
            onChange={(e) => setSelectedUnit(e.target.value)}
            style={styles.select}
            disabled={!selectedCourse}
          >
            <option value="">Select a unit...</option>
            {isLoading ? (
              <option value="" disabled>Loading units...</option>
            ) : (
              units.map((unit, index) => (
                <option key={index} value={unit}>
                  {unit}
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* Ask New Question */}
      {selectedCourse && selectedUnit && (
        <div style={styles.askContainer}>
          <h3 style={styles.askTitle}>Ask a Question</h3>
          {isGuest ? (
            <div style={styles.guestMessage}>
              <p style={styles.guestMessageText}>Login to ask questions and engage with the community!</p>
            </div>
          ) : (
            <div style={styles.askForm}>
              <textarea
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                placeholder="Type your question here..."
                style={styles.questionInput}
                rows={3}
              />
              <button
                onClick={handleAskQuestion}
                disabled={isSubmitting || !newQuestion.trim()}
                style={{
                  ...styles.askButton,
                  opacity: isSubmitting || !newQuestion.trim() ? 0.6 : 1,
                }}
              >
                {isSubmitting ? "Asking..." : "Ask Question"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Questions and Answers */}
      <div style={styles.questionsContainer}>
        <h3 style={styles.questionsTitle}>
          Questions & Answers
          {selectedCourse && (
            <span style={styles.courseInfo}>
              {apCourses.find(c => c.id === selectedCourse)?.name}
              {selectedUnit && ` • ${selectedUnit}`}
            </span>
          )}
        </h3>

        {filteredQuestions.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>
              {selectedCourse && selectedUnit
                ? "No questions yet for this unit. Be the first to ask!"
                : "Select a course and unit to view questions and answers."}
            </p>
          </div>
        ) : (
          <div style={styles.questionsList}>
            {filteredQuestions.map((q) => (
              <div key={q.id} style={styles.questionCard}>
                <div style={styles.questionHeader}>
                  <div style={styles.questionMeta}>
                    <span style={styles.author}>{q.author}</span>
                    <span style={styles.timestamp}>
                      {new Date(q.timestamp).toLocaleDateString()}
                    </span>
                    <span style={styles.unit}>{q.unit}</span>
                  </div>
                </div>
                
                <div style={styles.questionContent}>
                  <h4 style={styles.questionText}>{q.question}</h4>
                </div>
                
                <div style={styles.answerContent}>
                  <button
                    onClick={() => toggleAnswer(q.id)}
                    style={styles.answerToggle}
                  >
                    <div style={styles.answerHeader}>
                      <span style={styles.aiLabel}>AI Answer</span>
                      <span style={styles.toggleIcon}>
                        {expandedAnswers.has(q.id) ? '▼' : '▶'}
                      </span>
                    </div>
                  </button>
                  
                  {expandedAnswers.has(q.id) && (
                    <div style={styles.answerText}>{q.answer}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
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
    display: "flex",
    flexDirection: "column",
    gap: "2.5rem",
    color: "var(--text-primary)",
    transition: "all 0.3s ease",
    backdropFilter: "blur(10px)",
  },
  header: {
    textAlign: "center",
    marginBottom: "1rem",
  },
  title: {
    fontSize: "2.5rem",
    fontWeight: 800,
    color: "var(--text-primary)",
    margin: 0,
    marginBottom: "0.5rem",
    background: "linear-gradient(135deg, var(--text-primary) 0%, #0078C8 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },
  subtitle: {
    fontSize: "1.2rem",
    color: "var(--text-secondary)",
    margin: 0,
    fontWeight: 500,
  },
  selectionContainer: {
    display: "flex",
    gap: "2rem",
    alignItems: "end",
    padding: "2rem",
    backgroundColor: "var(--bg-primary)",
    borderRadius: "16px",
    boxShadow: "0 8px 24px var(--shadow-color)",
    border: "1px solid var(--border-color)",
  },
  selectGroup: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  label: {
    fontSize: "1rem",
    fontWeight: 600,
    color: "var(--text-primary)",
  },
  select: {
    padding: "0.75rem 1rem",
    fontSize: "1rem",
    border: "2px solid var(--border-color)",
    borderRadius: "8px",
    backgroundColor: "var(--bg-secondary)",
    color: "var(--text-primary)",
    cursor: "pointer",
    transition: "border-color 0.3s ease",
  },
  askContainer: {
    padding: "2rem",
    backgroundColor: "var(--bg-primary)",
    borderRadius: "16px",
    boxShadow: "0 8px 24px var(--shadow-color)",
    border: "1px solid var(--border-color)",
  },
  askTitle: {
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "var(--text-primary)",
    margin: 0,
    marginBottom: "1rem",
  },
  askForm: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  questionInput: {
    padding: "1rem",
    fontSize: "1rem",
    border: "2px solid var(--border-color)",
    borderRadius: "8px",
    backgroundColor: "var(--bg-secondary)",
    color: "var(--text-primary)",
    resize: "vertical",
    minHeight: "80px",
    fontFamily: "inherit",
  },
  askButton: {
    padding: "1rem 2rem",
    fontSize: "1rem",
    fontWeight: 600,
    backgroundColor: "#0078C8",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "all 0.3s ease",
    alignSelf: "flex-start",
  },
  questionsContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
  },
  questionsTitle: {
    fontSize: "1.8rem",
    fontWeight: 700,
    color: "var(--text-primary)",
    margin: 0,
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  },
  courseInfo: {
    fontSize: "1rem",
    fontWeight: 500,
    color: "var(--text-secondary)",
    backgroundColor: "var(--bg-primary)",
    padding: "0.5rem 1rem",
    borderRadius: "20px",
    border: "1px solid var(--border-color)",
  },
  emptyState: {
    textAlign: "center",
    padding: "3rem",
    backgroundColor: "var(--bg-primary)",
    borderRadius: "16px",
    border: "1px solid var(--border-color)",
  },
  emptyText: {
    fontSize: "1.1rem",
    color: "var(--text-secondary)",
    margin: 0,
  },
  questionsList: {
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
  },
  questionCard: {
    backgroundColor: "var(--bg-primary)",
    borderRadius: "16px",
    padding: "2rem",
    boxShadow: "0 8px 24px var(--shadow-color)",
    border: "1px solid var(--border-color)",
    transition: "all 0.3s ease",
  },
  questionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1rem",
  },
  questionMeta: {
    display: "flex",
    gap: "1rem",
    alignItems: "center",
  },
  author: {
    fontSize: "0.9rem",
    fontWeight: 600,
    color: "#0078C8",
  },
  timestamp: {
    fontSize: "0.8rem",
    color: "var(--text-secondary)",
  },
  unit: {
    fontSize: "0.8rem",
    color: "var(--text-secondary)",
    backgroundColor: "var(--bg-secondary)",
    padding: "0.25rem 0.5rem",
    borderRadius: "4px",
  },
  questionContent: {
    marginBottom: "1.5rem",
  },
  questionText: {
    fontSize: "1.2rem",
    fontWeight: 600,
    color: "var(--text-primary)",
    margin: 0,
    lineHeight: 1.4,
  },
  answerContent: {
    backgroundColor: "var(--bg-secondary)",
    borderRadius: "12px",
    padding: "0",
    border: "1px solid var(--border-color)",
    overflow: "hidden",
  },
  answerToggle: {
    width: "100%",
    backgroundColor: "transparent",
    border: "none",
    padding: "1rem 1.5rem",
    cursor: "pointer",
    transition: "background-color 0.3s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  answerHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  aiLabel: {
    fontSize: "0.9rem",
    fontWeight: 600,
    color: "#0078C8",
    backgroundColor: "rgba(0, 120, 200, 0.1)",
    padding: "0.5rem 1rem",
    borderRadius: "20px",
  },
  toggleIcon: {
    fontSize: "1rem",
    color: "var(--text-secondary)",
    fontWeight: "bold",
    transition: "transform 0.3s ease",
  },
  answerText: {
    fontSize: "1rem",
    color: "var(--text-primary)",
    lineHeight: 1.6,
    whiteSpace: "pre-wrap",
    padding: "1.5rem 1.5rem 1.5rem 1.5rem",
    borderTop: "1px solid var(--border-color)",
    backgroundColor: "rgba(0, 120, 200, 0.02)",
  },
  guestMessage: {
    backgroundColor: "rgba(0, 120, 200, 0.1)",
    borderRadius: "0.75rem",
    padding: "1.5rem",
    textAlign: "center",
    border: "1px solid rgba(0, 120, 200, 0.3)",
  },
  guestMessageText: {
    margin: 0,
    fontSize: "1rem",
    color: "#0078C8",
    fontWeight: 600,
  },
};
