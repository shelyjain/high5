import React, { useState, useEffect } from 'react';
import { apCourses } from '../data/apCourses.js';

export default function StudyCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [studySessions, setStudySessions] = useState({});
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [showAddSession, setShowAddSession] = useState(false);
  const [newSession, setNewSession] = useState({
    courseId: '',
    duration: 60,
    type: 'mcq',
    notes: ''
  });

  // Color palette for AP courses
  const courseColors = {
    'ap-psychology': '#FF6B6B',
    'ap-united-states-history': '#4ECDC4',
    'ap-world-history': '#45B7D1',
    'ap-english-language': '#96CEB4',
    'ap-english-literature': '#FFEAA7',
    'ap-biology': '#DDA0DD',
    'ap-chemistry': '#98D8C8',
    'ap-physics-1': '#F7DC6F',
    'ap-calculus-ab': '#BB8FCE',
    'ap-calculus-bc': '#85C1E9',
    'ap-statistics': '#F8C471',
    'ap-economics-macro': '#82E0AA',
    'ap-economics-micro': '#F1948A',
    'ap-government': '#85C1E9',
    'ap-human-geography': '#D7BDE2',
    'ap-african-american-studies': '#F9E79F',
    'ap-art-history': '#AED6F1',
    'ap-comparative-government-and-politics': '#A9DFBF',
    'ap-drawing': '#FADBD8',
    'ap-european-history': '#D5DBDB',
    'ap-macroeconomics': '#D2B4DE',
    'ap-microeconomics': '#AED6F1',
    'ap-music-theory': '#FCF3CF',
    'ap-research': '#D1F2EB',
    'ap-seminar': '#FAD7A0',
    'ap-studio-art-2d': '#E8DAEF',
    'ap-studio-art-3d': '#D5F4E6',
    'ap-us-government-and-politics': '#FDEBD0'
  };

  // AP Exam dates for 2025 (typically in May)
  const apExamDates = {
    'ap-psychology': new Date('2025-05-05'),
    'ap-united-states-history': new Date('2025-05-06'),
    'ap-world-history': new Date('2025-05-07'),
    'ap-english-language': new Date('2025-05-08'),
    'ap-english-literature': new Date('2025-05-09'),
    'ap-biology': new Date('2025-05-12'),
    'ap-chemistry': new Date('2025-05-13'),
    'ap-physics-1': new Date('2025-05-14'),
    'ap-calculus-ab': new Date('2025-05-15'),
    'ap-calculus-bc': new Date('2025-05-15'),
    'ap-statistics': new Date('2025-05-16'),
    'ap-economics-macro': new Date('2025-05-19'),
    'ap-economics-micro': new Date('2025-05-20'),
    'ap-government': new Date('2025-05-21'),
    'ap-human-geography': new Date('2025-05-22')
  };

  // Load study sessions from localStorage
  useEffect(() => {
    const savedSessions = JSON.parse(localStorage.getItem('studySessions') || '{}');
    setStudySessions(savedSessions);
  }, []);

  // Save study sessions to localStorage
  const saveStudySessions = (sessions) => {
    localStorage.setItem('studySessions', JSON.stringify(sessions));
    setStudySessions(sessions);
  };

  // Generate AI study plan
  const generateStudyPlan = () => {
    if (selectedCourses.length === 0) {
      alert('Please select at least one AP course to generate a study plan');
      return;
    }

    const today = new Date();
    const sessions = {};

    selectedCourses.forEach(courseId => {
      const examDate = apExamDates[courseId];
      if (!examDate) return;

      const daysUntilExam = Math.ceil((examDate - today) / (1000 * 60 * 60 * 24));
      const sessionsPerWeek = Math.max(2, Math.min(5, Math.ceil(daysUntilExam / 7)));
      
      // Generate study sessions leading up to exam
      for (let i = 0; i < daysUntilExam; i += Math.ceil(7 / sessionsPerWeek)) {
        const sessionDate = new Date(today);
        sessionDate.setDate(today.getDate() + i);
        
        const dateKey = sessionDate.toISOString().split('T')[0];
        
        if (!sessions[dateKey]) {
          sessions[dateKey] = [];
        }
        
        sessions[dateKey].push({
          id: `${courseId}-${i}`,
          courseId,
          courseName: apCourses.find(c => c.id === courseId)?.name || courseId,
          duration: 60,
          type: i % 2 === 0 ? 'mcq' : 'frq',
          notes: `AI-generated study session for ${apCourses.find(c => c.id === courseId)?.name}`,
          isAIGenerated: true
        });
      }
    });

    // Merge with existing sessions
    const updatedSessions = { ...studySessions };
    Object.keys(sessions).forEach(date => {
      if (!updatedSessions[date]) {
        updatedSessions[date] = [];
      }
      updatedSessions[date] = [...updatedSessions[date], ...sessions[date]];
    });

    saveStudySessions(updatedSessions);
    alert('AI study plan generated successfully!');
  };

  // Add study session
  const addStudySession = () => {
    if (!newSession.courseId) {
      alert('Please select a course');
      return;
    }

    const dateKey = selectedDate.toISOString().split('T')[0];
    const session = {
      id: Date.now().toString(),
      courseId: newSession.courseId,
      courseName: apCourses.find(c => c.id === newSession.courseId)?.name || newSession.courseId,
      duration: newSession.duration,
      type: newSession.type,
      notes: newSession.notes,
      isAIGenerated: false
    };

    const updatedSessions = { ...studySessions };
    if (!updatedSessions[dateKey]) {
      updatedSessions[dateKey] = [];
    }
    updatedSessions[dateKey].push(session);

    saveStudySessions(updatedSessions);
    setShowAddSession(false);
    setNewSession({ courseId: '', duration: 60, type: 'mcq', notes: '' });
  };

  // Delete study session
  const deleteStudySession = (dateKey, sessionId) => {
    const updatedSessions = { ...studySessions };
    updatedSessions[dateKey] = updatedSessions[dateKey].filter(s => s.id !== sessionId);
    saveStudySessions(updatedSessions);
  };

  // Get days in month
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  // Get sessions for a specific date
  const getSessionsForDate = (date) => {
    const dateKey = date.toISOString().split('T')[0];
    return studySessions[dateKey] || [];
  };

  // Check if date has AP exam
  const getExamForDate = (date) => {
    const dateKey = date.toISOString().split('T')[0];
    return Object.entries(apExamDates).find(([courseId, examDate]) => 
      examDate.toISOString().split('T')[0] === dateKey
    );
  };

  // Navigate months
  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const days = getDaysInMonth(currentDate);
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <section style={styles.wrapper}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Study Calendar</h1>
          <p style={styles.subtitle}>
            Plan your AP study sessions and track your progress leading up to exam dates.
          </p>
        </div>
        <div style={styles.headerActions}>
          <button 
            style={styles.primaryButton}
            onClick={() => setShowAddSession(true)}
          >
            + Add Study Session
          </button>
          <button 
            style={styles.secondaryButton}
            onClick={generateStudyPlan}
          >
            Generate AI Study Plan
          </button>
        </div>
      </div>

      {/* Calendar */}
      <div style={styles.calendarContainer}>
        <div style={styles.calendarHeader}>
          <button style={styles.navButton} onClick={() => navigateMonth(-1)}>
            ←
          </button>
          <h2 style={styles.monthTitle}>
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <button style={styles.navButton} onClick={() => navigateMonth(1)}>
            →
          </button>
        </div>

        <div style={styles.calendarGrid}>
          {/* Day headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} style={styles.dayHeader}>{day}</div>
          ))}
          
          {/* Calendar days */}
          {days.map((day, index) => {
            if (!day) {
              return <div key={index} style={styles.emptyDay}></div>;
            }

            const sessions = getSessionsForDate(day);
            const exam = getExamForDate(day);
            const isToday = day.toDateString() === new Date().toDateString();
            const isSelected = day.toDateString() === selectedDate.toDateString();
            
            // Check if this date has any exam for selected courses
            const selectedCourseExam = selectedCourses.find(courseId => {
              const examDate = apExamDates[courseId];
              return examDate && examDate.toDateString() === day.toDateString();
            });

            return (
              <div
                key={index}
                style={{
                  ...styles.calendarDay,
                  ...(isToday ? styles.today : {}),
                  ...(isSelected ? styles.selectedDay : {}),
                  ...(exam ? styles.examDay : {}),
                  ...(selectedCourseExam ? styles.selectedExamDay : {})
                }}
                onClick={() => setSelectedDate(day)}
              >
                <div style={styles.dayNumber}>{day.getDate()}</div>
                
                {exam && (
                  <div style={styles.examBadge}>
                    📝 {apCourses.find(c => c.id === exam[0])?.name || exam[0]}
                  </div>
                )}
                
                {selectedCourseExam && !exam && (
                  <div style={styles.selectedExamBadge}>
                    📝 {apCourses.find(c => c.id === selectedCourseExam)?.name || selectedCourseExam}
                  </div>
                )}
                
                {sessions.length > 0 && (
                  <div style={styles.sessionIndicators}>
                    {sessions.slice(0, 2).map((session, idx) => (
                      <div
                        key={idx}
                        style={{
                          ...styles.sessionBar,
                          backgroundColor: courseColors[session.courseId] || '#6B7280',
                          opacity: session.type === 'mcq' ? 0.8 : 0.6
                        }}
                        title={`${session.courseName} - ${session.type.toUpperCase()}`}
                      />
                    ))}
                    {sessions.length > 2 && (
                      <div style={styles.moreIndicator}>+{sessions.length - 2}</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Course Selection for AI Planning */}
      <div style={styles.courseSelection}>
        <h3 style={styles.sectionTitle}>Select AP Courses to Display on Calendar:</h3>
        <div style={styles.courseGrid}>
          {apCourses.map(course => (
            <label key={course.id} style={styles.courseCheckbox}>
              <input
                type="checkbox"
                checked={selectedCourses.includes(course.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedCourses([...selectedCourses, course.id]);
                  } else {
                    setSelectedCourses(selectedCourses.filter(id => id !== course.id));
                  }
                }}
              />
              <div 
                style={{
                  ...styles.courseColorDot,
                  backgroundColor: courseColors[course.id] || '#6B7280'
                }}
              />
              <span style={styles.courseLabel}>{course.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Course Legend */}
      {selectedCourses.length > 0 && (
        <div style={styles.legendContainer}>
          <h3 style={styles.sectionTitle}>Selected Courses:</h3>
          <div style={styles.legendGrid}>
            {selectedCourses.map(courseId => {
              const course = apCourses.find(c => c.id === courseId);
              const examDate = apExamDates[courseId];
              return (
                <div key={courseId} style={styles.legendItem}>
                  <div 
                    style={{
                      ...styles.legendColorDot,
                      backgroundColor: courseColors[courseId] || '#6B7280'
                    }}
                  />
                  <span style={styles.legendLabel}>
                    {course?.name || courseId}
                    {examDate && (
                      <span style={styles.examDateText}>
                        {' '}(Exam: {examDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})
                      </span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected Date Details */}
      <div style={styles.dateDetails}>
        <h3 style={styles.sectionTitle}>
          {selectedDate.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </h3>
        
        <div style={styles.sessionsList}>
          {getSessionsForDate(selectedDate).map(session => (
            <div key={session.id} style={styles.sessionCard}>
              <div style={styles.sessionHeader}>
                <div style={styles.sessionInfo}>
                  <div style={styles.sessionTitleRow}>
                    <div 
                      style={{
                        ...styles.courseColorIndicator,
                        backgroundColor: courseColors[session.courseId] || '#6B7280'
                      }}
                    />
                    <h4 style={styles.sessionTitle}>{session.courseName}</h4>
                  </div>
                  <p style={styles.sessionMeta}>
                    {session.duration} min • {session.type.toUpperCase()} • 
                    {session.isAIGenerated ? ' AI Generated' : ' Manual'}
                  </p>
                </div>
                <button
                  style={styles.deleteButton}
                  onClick={() => deleteStudySession(selectedDate.toISOString().split('T')[0], session.id)}
                >
                  ×
                </button>
              </div>
              {session.notes && (
                <p style={styles.sessionNotes}>{session.notes}</p>
              )}
            </div>
          ))}
          
          {getSessionsForDate(selectedDate).length === 0 && (
            <div style={styles.emptyState}>
              <p>No study sessions scheduled for this date.</p>
              <button 
                style={styles.addSessionButton}
                onClick={() => setShowAddSession(true)}
              >
                Add Study Session
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add Session Modal */}
      {showAddSession && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={styles.modalTitle}>Add Study Session</h3>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Course:</label>
              <select
                style={styles.select}
                value={newSession.courseId}
                onChange={(e) => setNewSession({...newSession, courseId: e.target.value})}
              >
                <option value="">Select a course</option>
                {apCourses.map(course => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Duration (minutes):</label>
              <input
                type="number"
                style={styles.input}
                value={newSession.duration}
                onChange={(e) => setNewSession({...newSession, duration: parseInt(e.target.value)})}
                min="15"
                max="180"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Type:</label>
              <select
                style={styles.select}
                value={newSession.type}
                onChange={(e) => setNewSession({...newSession, type: e.target.value})}
              >
                <option value="mcq">Multiple Choice</option>
                <option value="frq">Free Response</option>
                <option value="mixed">Mixed Practice</option>
                <option value="review">Review</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Notes (optional):</label>
              <textarea
                style={styles.textarea}
                value={newSession.notes}
                onChange={(e) => setNewSession({...newSession, notes: e.target.value})}
                placeholder="Add any notes about this study session..."
                rows="3"
              />
            </div>

            <div style={styles.modalActions}>
              <button 
                style={styles.cancelButton}
                onClick={() => setShowAddSession(false)}
              >
                Cancel
              </button>
              <button 
                style={styles.saveButton}
                onClick={addStudySession}
              >
                Add Session
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

const styles = {
  wrapper: {
    width: "100%",
    maxWidth: "1200px",
    margin: "0 auto",
    backgroundColor: "#FFFFFF",
    borderRadius: "1.25rem",
    padding: "2rem",
    boxShadow: "0 12px 32px rgba(15, 23, 42, 0.08)",
    boxSizing: "border-box",
    minHeight: "80vh",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "2rem",
    flexWrap: "wrap",
    gap: "1rem",
  },
  title: {
    fontSize: "2.5rem",
    fontWeight: 700,
    color: "#0F172A",
    marginBottom: "0.5rem",
  },
  subtitle: {
    fontSize: "1.1rem",
    color: "#475569",
    margin: 0,
  },
  headerActions: {
    display: "flex",
    gap: "1rem",
    flexWrap: "wrap",
  },
  primaryButton: {
    backgroundColor: "#3B82F6",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "0.75rem",
    padding: "0.75rem 1.5rem",
    fontSize: "0.9rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "background-color 0.2s",
  },
  secondaryButton: {
    backgroundColor: "#10B981",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "0.75rem",
    padding: "0.75rem 1.5rem",
    fontSize: "0.9rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "background-color 0.2s",
  },
  courseSelection: {
    backgroundColor: "#F8FAFC",
    borderRadius: "1rem",
    padding: "1.5rem",
    marginBottom: "2rem",
  },
  sectionTitle: {
    fontSize: "1.2rem",
    fontWeight: 600,
    color: "#0F172A",
    marginBottom: "1rem",
  },
  courseGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: "0.75rem",
  },
  courseCheckbox: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    cursor: "pointer",
  },
  courseColorDot: {
    width: "12px",
    height: "12px",
    borderRadius: "50%",
    flexShrink: 0,
  },
  courseLabel: {
    fontSize: "0.9rem",
    color: "#374151",
  },
  legendContainer: {
    backgroundColor: "#F1F5F9",
    borderRadius: "1rem",
    padding: "1.5rem",
    marginBottom: "2rem",
  },
  legendGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: "1rem",
  },
  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  legendColorDot: {
    width: "16px",
    height: "16px",
    borderRadius: "50%",
    flexShrink: 0,
  },
  legendLabel: {
    fontSize: "0.9rem",
    color: "#374151",
    fontWeight: 500,
  },
  examDateText: {
    fontSize: "0.8rem",
    color: "#6B7280",
    fontWeight: 400,
  },
  calendarContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: "1rem",
    padding: "1.5rem",
    marginBottom: "2rem",
    boxShadow: "0 4px 12px rgba(15, 23, 42, 0.05)",
  },
  calendarHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1.5rem",
  },
  navButton: {
    backgroundColor: "#F1F5F9",
    border: "none",
    borderRadius: "0.5rem",
    padding: "0.5rem 1rem",
    fontSize: "1.2rem",
    cursor: "pointer",
    transition: "background-color 0.2s",
  },
  monthTitle: {
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "#0F172A",
    margin: 0,
  },
  calendarGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: "0.5rem",
  },
  dayHeader: {
    padding: "0.75rem",
    textAlign: "center",
    fontWeight: 600,
    color: "#64748B",
    fontSize: "0.9rem",
  },
  emptyDay: {
    height: "100px",
  },
  calendarDay: {
    height: "100px",
    border: "1px solid #E2E8F0",
    borderRadius: "0.5rem",
    padding: "0.5rem",
    cursor: "pointer",
    transition: "all 0.2s",
    backgroundColor: "#FFFFFF",
    position: "relative",
  },
  today: {
    backgroundColor: "#FEF3C7",
    borderColor: "#F59E0B",
  },
  selectedDay: {
    backgroundColor: "#DBEAFE",
    borderColor: "#3B82F6",
  },
  examDay: {
    backgroundColor: "#FEE2E2",
    borderColor: "#EF4444",
  },
  selectedExamDay: {
    backgroundColor: "#FEF3C7",
    borderColor: "#F59E0B",
    borderWidth: "2px",
  },
  dayNumber: {
    fontSize: "0.9rem",
    fontWeight: 600,
    color: "#374151",
  },
  examBadge: {
    fontSize: "0.7rem",
    color: "#DC2626",
    fontWeight: 600,
    marginTop: "0.25rem",
  },
  selectedExamBadge: {
    fontSize: "0.7rem",
    color: "#D97706",
    fontWeight: 600,
    marginTop: "0.25rem",
  },
  sessionIndicators: {
    position: "absolute",
    bottom: "0.25rem",
    left: "0.25rem",
    right: "0.25rem",
    display: "flex",
    gap: "0.125rem",
    flexWrap: "wrap",
  },
  sessionBar: {
    height: "4px",
    borderRadius: "2px",
    flex: 1,
    marginBottom: "2px",
  },
  moreIndicator: {
    fontSize: "0.6rem",
    color: "#64748B",
    fontWeight: 600,
  },
  dateDetails: {
    backgroundColor: "#F8FAFC",
    borderRadius: "1rem",
    padding: "1.5rem",
  },
  sessionsList: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  sessionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: "0.75rem",
    padding: "1rem",
    boxShadow: "0 2px 8px rgba(15, 23, 42, 0.05)",
  },
  sessionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "0.5rem",
  },
  sessionInfo: {
    flex: 1,
  },
  sessionTitleRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    marginBottom: "0.25rem",
  },
  courseColorIndicator: {
    width: "12px",
    height: "12px",
    borderRadius: "50%",
    flexShrink: 0,
  },
  sessionTitle: {
    fontSize: "1rem",
    fontWeight: 600,
    color: "#0F172A",
    margin: 0,
  },
  sessionMeta: {
    fontSize: "0.8rem",
    color: "#64748B",
    margin: "0.25rem 0 0 0",
  },
  sessionNotes: {
    fontSize: "0.9rem",
    color: "#475569",
    margin: 0,
    fontStyle: "italic",
  },
  deleteButton: {
    backgroundColor: "#FEE2E2",
    color: "#DC2626",
    border: "none",
    borderRadius: "50%",
    width: "24px",
    height: "24px",
    fontSize: "1rem",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    textAlign: "center",
    padding: "2rem",
    color: "#64748B",
  },
  addSessionButton: {
    backgroundColor: "#3B82F6",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "0.5rem",
    padding: "0.5rem 1rem",
    fontSize: "0.9rem",
    fontWeight: 600,
    cursor: "pointer",
    marginTop: "1rem",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modal: {
    backgroundColor: "#FFFFFF",
    borderRadius: "1rem",
    padding: "2rem",
    width: "90%",
    maxWidth: "500px",
    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
  },
  modalTitle: {
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "#0F172A",
    marginBottom: "1.5rem",
  },
  formGroup: {
    marginBottom: "1rem",
  },
  label: {
    display: "block",
    fontSize: "0.9rem",
    fontWeight: 600,
    color: "#374151",
    marginBottom: "0.5rem",
  },
  select: {
    width: "100%",
    padding: "0.75rem",
    border: "1px solid #D1D5DB",
    borderRadius: "0.5rem",
    fontSize: "0.9rem",
    backgroundColor: "#FFFFFF",
  },
  input: {
    width: "100%",
    padding: "0.75rem",
    border: "1px solid #D1D5DB",
    borderRadius: "0.5rem",
    fontSize: "0.9rem",
  },
  textarea: {
    width: "100%",
    padding: "0.75rem",
    border: "1px solid #D1D5DB",
    borderRadius: "0.5rem",
    fontSize: "0.9rem",
    resize: "vertical",
  },
  modalActions: {
    display: "flex",
    gap: "1rem",
    justifyContent: "flex-end",
    marginTop: "1.5rem",
  },
  cancelButton: {
    backgroundColor: "#F3F4F6",
    color: "#374151",
    border: "none",
    borderRadius: "0.5rem",
    padding: "0.75rem 1.5rem",
    fontSize: "0.9rem",
    fontWeight: 600,
    cursor: "pointer",
  },
  saveButton: {
    backgroundColor: "#3B82F6",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "0.5rem",
    padding: "0.75rem 1.5rem",
    fontSize: "0.9rem",
    fontWeight: 600,
    cursor: "pointer",
  },
};
