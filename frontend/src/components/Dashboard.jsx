import React, { useState, useEffect } from "react";
import { apCourses } from "../data/apCourses";

const featuredCourses = apCourses.slice(0, 4);

const studyTips = [
  {
    title: "Active Recall",
    description: "Test yourself regularly instead of just re-reading. This boosts retention by 50% and strengthens neural pathways.",
    tips: ["Use flashcards", "Practice tests", "Quiz yourself daily"]
  },
  {
    title: "Spaced Repetition",
    description: "Review material at strategic intervals to lock information into long-term memory more effectively.",
    tips: ["Day 1 review", "Week 1 review", "Month 1 review"]
  },
  {
    title: "Practice FRQs",
    description: "Free response questions make up 50% of your score. Master the skill of writing clear, organized responses.",
    tips: ["Practice writing", "Time yourself", "Get feedback"]
  },
  {
    title: "Mix Topics",
    description: "Alternate between different subjects and question types to prevent boredom and build stronger neural connections.",
    tips: ["Switch subjects", "Vary difficulty", "Random order"]
  },
  {
    title: "Stay Consistent",
    description: "Daily 15-30 minute study sessions beat cramming. Consistency builds knowledge gradually and reduces anxiety.",
    tips: ["Set a schedule", "Study daily", "Track progress"]
  },
  {
    title: "Teach Others",
    description: "Explaining concepts to someone else reveals gaps in your understanding and cements your own learning.",
    tips: ["Study groups", "Tutoring", "Explain aloud"]
  },
  {
    title: "Quality Sleep",
    description: "Sleep consolidates memory and enhances cognitive function. Get 7-9 hours nightly for peak exam performance.",
    tips: ["Consistent schedule", "Dark room", "No screens"]
  },
  {
    title: "Active Reading",
    description: "Don't just passively read. Highlight, annotate, and summarize to engage with material actively.",
    tips: ["Take notes", "Summarize", "Create outlines"]
  }
];

export default function Dashboard({
  userEmail,
  preferredName,
  selectedCourse,
  pinnedCourses = [],
  onStartPractice,
  onBrowseCourses,
  onOpenCourse,
}) {
  const hasCourseSelected = Boolean(selectedCourse?.id);
  const selectedCourseName = selectedCourse?.name ?? "an AP course";
  const hasPinnedCourses = pinnedCourses.length > 0;
  const displayName = preferredName || userEmail || "there";
  const [streakData, setStreakData] = useState({
    currentStreak: 0,
    longestStreak: 0,
    lastStudyDate: null,
  });
  const [activeTipIndex, setActiveTipIndex] = useState(0);

  // Load streak data from localStorage (only for logged-in users)
  const isLoggedIn = preferredName || userEmail; // Simple check
  
  useEffect(() => {
    // Only load streak data if user is logged in
    if (isLoggedIn) {
      // Try Firebase first, fallback to localStorage
      const savedStreakData = JSON.parse(localStorage.getItem('streakData') || '{}');
      setStreakData({
        currentStreak: savedStreakData.currentStreak || 0,
        longestStreak: savedStreakData.longestStreak || 0,
        lastStudyDate: savedStreakData.lastStudyDate || null,
      });
    } else {
      // Guests don't have streaks
      setStreakData({
        currentStreak: 0,
        longestStreak: 0,
        lastStudyDate: null,
      });
    }
  }, [isLoggedIn, preferredName, userEmail]);

  const currentTip = studyTips[activeTipIndex];
  const nextTip = studyTips[(activeTipIndex + 1) % studyTips.length];

  return (
    <section style={styles.wrapper}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.heading}>
            {preferredName ? `Welcome back, ${preferredName}!` : userEmail ? `Welcome back, ${userEmail}!` : "Welcome to High5"}
          </h1>
          <p style={styles.subheading}>
            {hasCourseSelected
              ? `You're currently focused on ${selectedCourseName}.`
              : "Pick a course to discover your passions and prepare for AP exam success."}
          </p>
        </div>
        {/* Streak Overview */}
        <div style={styles.streakOverview}>
          <div style={styles.streakCard}>
            <div style={styles.streakIcon}>🔥</div>
            <div style={styles.streakInfo}>
              <div style={styles.streakNumber}>{streakData.currentStreak}</div>
              <div style={styles.streakLabel}>
                {streakData.currentStreak === 0 ? 'Start your streak!' : 
                 streakData.currentStreak === 1 ? 'day streak' : 'day streak'}
              </div>
              <div style={styles.streakMessage}>
                {streakData.currentStreak === 0 ? 'Study 15+ minutes to begin' :
                 streakData.currentStreak >= 7 ? 'Keep it up!' :
                 'Great start!'}
              </div>
            </div>
          </div>
        </div>
      </header>

      <section style={styles.pinnedSection}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "#0078C8";
          e.currentTarget.style.boxShadow =
            "0 10px 28px var(--shadow-color), 0 0 24px rgba(0, 120, 200, 0.4)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "var(--border-color)";
          e.currentTarget.style.boxShadow = "0 10px 24px var(--shadow-color)";
        }}
      >
        <div style={styles.pinnedHeader}>
          <p style={styles.pinnedEyebrow}>My AP Dashboard</p>
          <p style={styles.pinnedCopy}>
            {hasPinnedCourses
              ? "Quick access to your favorite AP courses."
              : "Pin courses on the AP Courses page to build your personal study list."}
          </p>
        </div>
        {hasPinnedCourses ? (
          <div style={styles.pinnedGrid}>
            {pinnedCourses.map((course) => (
              <button
                key={course.id}
                type="button"
                style={{
                  ...styles.pinnedCard,
                  ...(selectedCourse?.id === course.id
                    ? styles.activePinnedCard
                    : {}),
                }}
                onClick={() => onOpenCourse?.(course)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.borderColor = "#0078C8";
                  e.currentTarget.style.boxShadow =
                    "0 14px 32px rgba(15, 23, 42, 0.12), 0 0 20px rgba(0, 120, 200, 0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.borderColor = "transparent";
                  e.currentTarget.style.boxShadow =
                    selectedCourse?.id === course.id
                      ? styles.activePinnedCard.boxShadow
                      : styles.pinnedCard.boxShadow;
                }}
              >
                <div style={styles.pinnedCardHeader}>
                  <p style={styles.cardLabel}>{course.name}</p>
                  <span style={styles.cardPill}>{course.subject}</span>
                </div>
                <p style={styles.pinnedMeta}>
                  {course.submissionMode === "essay"
                    ? "Typed + image FRQs"
                    : "Image/PDF FRQ uploads"}
                </p>
                <span style={styles.pinnedActionHint}>
                  Open workspace →
                </span>
              </button>
            ))}
          </div>
        ) : (
          <p style={styles.pinnedEmpty}>
            Nothing pinned yet. Use the checkbox on each AP card to add it here.
          </p>
        )}
      </section>

      {/* Study Tips Carousel */}
      <section style={styles.tipsSection}>
        <div style={styles.tipsHeader}>
          <h2 style={styles.tipsSectionTitle}>Study Tips</h2>
          <div style={styles.tipsSectionBadge}>{activeTipIndex + 1}/{studyTips.length}</div>
        </div>
        <div style={styles.tipsContainer}>
          {/* Main Card */}
          <div style={{
            ...styles.tipsMainCard,
            opacity: 1,
            transform: "scale(1)",
            zIndex: 10
          }}>
            <h3 style={styles.tipMainTitle}>{currentTip.title}</h3>
            <p style={styles.tipMainDescription}>{currentTip.description}</p>
            <div style={styles.tipsList}>
              {currentTip.tips.map((tip, idx) => (
                <div key={idx} style={styles.tipItem}>
                  <span style={styles.tipBullet}>→</span>
                  <span style={styles.tipItemText}>{tip}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Navigation */}
        <div style={styles.tipsNav}>
          <button
            onClick={() => setActiveTipIndex((prev) => (prev - 1 + studyTips.length) % studyTips.length)}
            style={styles.navButton}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "rgba(0, 120, 200, 0.2)";
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "rgba(0, 120, 200, 0.1)";
            }}
          >
            ← Previous
          </button>

          <div style={styles.progressBar}>
            <div style={{
              ...styles.progressFill,
              width: `${((activeTipIndex + 1) / studyTips.length) * 100}%`
            }} />
          </div>

          <button
            onClick={() => setActiveTipIndex((prev) => (prev + 1) % studyTips.length)}
            style={styles.navButton}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "rgba(0, 120, 200, 0.2)";
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "rgba(0, 120, 200, 0.1)";
            }}
          >
            Next →
          </button>
        </div>
      </section>

    </section>
  );
}

const styles = {
  wrapper: {
    backgroundColor: "var(--bg-secondary)",
    borderRadius: "1.5rem",
    padding: "3rem 4rem",
    boxShadow: "0 20px 40px var(--shadow-color), 0 0 0 1px var(--border-color)",
    width: "100%",
    maxWidth: "1200px",
    margin: "0 auto",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    gap: "3rem",
    color: "var(--text-primary)",
    transition: "all 0.3s ease",
    backdropFilter: "blur(10px)",
  },
  streakOverview: {
    display: "flex",
    alignItems: "center",
  },
  streakCard: {
    backgroundColor: "var(--bg-primary)",
    borderRadius: "16px",
    padding: "1.5rem 2rem",
    boxShadow: "0 8px 24px var(--shadow-color), 0 0 0 1px var(--border-color)",
    border: "none",
    display: "flex",
    alignItems: "center",
    gap: "1.25rem",
    minWidth: "320px",
    transition: "all 0.3s ease",
    backdropFilter: "blur(10px)",
    background: "linear-gradient(135deg, var(--bg-primary) 0%, rgba(0, 120, 200, 0.05) 100%)",
  },
  streakIcon: {
    fontSize: "2.2rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    filter: "drop-shadow(0 2px 4px rgba(255, 107, 53, 0.3))",
  },
  streakInfo: {
    flex: 1,
    textAlign: "left",
  },
  streakNumber: {
    fontSize: "1.8rem",
    fontWeight: "800",
    color: "#FF6B35",
    lineHeight: 1,
    marginBottom: "0.25rem",
    textShadow: "0 2px 4px rgba(255, 107, 53, 0.2)",
  },
  streakLabel: {
    fontSize: "1rem",
    fontWeight: "600",
    color: "var(--text-secondary)",
    marginBottom: "0.25rem",
  },
  streakMessage: {
    fontSize: "0.85rem",
    color: "var(--text-secondary)",
    fontWeight: "500",
    opacity: 0.8,
  },
  header: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "3rem",
    flexWrap: "wrap",
    padding: "2rem 0",
    borderBottom: "1px solid var(--border-color)",
    marginBottom: "1rem",
  },
  heading: {
    fontSize: "2.5rem",
    fontWeight: 800,
    color: "var(--text-primary)",
    margin: 0,
    transition: "color 0.3s ease",
    background: "linear-gradient(135deg, var(--text-primary) 0%, #0078C8 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    lineHeight: 1.2,
  },
  subheading: {
    fontSize: "1.2rem",
    color: "var(--text-secondary)",
    marginTop: "0.75rem",
    marginBottom: 0,
    transition: "color 0.3s ease",
  },
  pinnedSection: {
    backgroundColor: "var(--bg-secondary)",
    borderRadius: "1rem",
    padding: "1.75rem",
    boxShadow: "0 10px 24px var(--shadow-color)",
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem",
    border: "2px solid var(--border-color)",
    transition: "background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease",
  },
  pinnedHeader: {
    display: "flex",
    flexDirection: "column",
    gap: "0.35rem",
  },
  pinnedEyebrow: {
    margin: 0,
    fontSize: "0.9rem",
    fontWeight: 700,
    color: "var(--text-secondary)",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    transition: "color 0.3s ease",
  },
  pinnedCopy: {
    margin: 0,
    fontSize: "1rem",
    color: "var(--text-primary)",
    transition: "color 0.3s ease",
  },
  pinnedGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "1rem",
  },
  pinnedCard: {
    position: "relative",
    padding: "1.5rem",
    borderRadius: "1rem",
    border: "2px solid transparent",
    backgroundColor: "var(--bg-primary)",
    boxShadow: "0 6px 16px var(--shadow-color)",
    display: "flex",
    flexDirection: "column",
    gap: "0.65rem",
    textAlign: "left",
    cursor: "pointer",
    transition: "transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease, background-color 0.3s ease",
    color: "var(--text-primary)",
  },
  activePinnedCard: {
    borderColor: "#0078C8",
    boxShadow: "0 12px 28px rgba(0,120,200,0.25)",
  },
  pinnedCardHeader: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  pinnedMeta: {
    margin: 0,
    color: "var(--text-secondary)",
    fontSize: "0.95rem",
    transition: "color 0.3s ease",
  },
  pinnedActionHint: {
    fontSize: "0.9rem",
    fontWeight: 600,
    color: "#0078C8",
  },
  pinnedEmpty: {
    margin: 0,
    color: "var(--text-secondary)",
    fontSize: "0.95rem",
    transition: "color 0.3s ease",
  },
  cardLabel: {
    margin: 0,
    fontSize: "1.05rem",
    fontWeight: 700,
    color: "var(--text-primary)",
    transition: "color 0.3s ease",
  },
  cardPill: {
    display: "inline-block",
    backgroundColor: "var(--bg-primary)",
    color: "#0078C8",
    padding: "0.35rem 0.75rem",
    borderRadius: "0.4rem",
    fontSize: "0.8rem",
    fontWeight: 600,
    textTransform: "capitalize",
    transition: "background-color 0.3s ease",
  },
  tipsSection: {
    backgroundColor: "var(--bg-secondary)",
    borderRadius: "1.5rem",
    padding: "3rem 2.5rem",
    boxShadow: "0 10px 24px var(--shadow-color)",
    border: "2px solid var(--border-color)",
    display: "flex",
    flexDirection: "column",
    gap: "2.5rem",
    transition: "all 0.3s ease",
    background: "linear-gradient(135deg, rgba(0, 120, 200, 0.04) 0%, var(--bg-secondary) 100%)",
    maxWidth: "1000px",
  },
  tipsHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "1rem",
  },
  tipsSectionTitle: {
    margin: 0,
    fontSize: "2rem",
    fontWeight: 800,
    color: "var(--text-primary)",
    background: "linear-gradient(135deg, var(--text-primary) 0%, #0078C8 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },
  tipsSectionBadge: {
    display: "inline-block",
    backgroundColor: "rgba(0, 120, 200, 0.15)",
    color: "#0078C8",
    padding: "0.75rem 1.5rem",
    borderRadius: "20px",
    fontSize: "1rem",
    fontWeight: 700,
    letterSpacing: "0.5px",
  },
  tipsContainer: {
    position: "relative",
    height: "380px",
    perspective: "1000px",
    marginLeft: "40px",
  },
  tipsMainCard: {
    position: "absolute",
    width: "100%",
    maxWidth: "850px",
    backgroundColor: "var(--bg-primary)",
    borderRadius: "16px",
    padding: "1.5rem",
    boxShadow: "0 20px 40px rgba(0, 120, 200, 0.15), 0 0 0 1px var(--border-color)",
    transition: "all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
    border: "2px solid var(--border-color)",
    maxWidth: "850px",
    marginRight: "20px",
  },
  tipsPreviewCard: {
    position: "absolute",
    width: "100%",
    backgroundColor: "var(--bg-primary)",
    borderRadius: "16px",
    padding: "1.5rem",
    boxShadow: "0 12px 24px rgba(0, 120, 200, 0.08)",
    border: "1px solid var(--border-color)",
    transition: "all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
    pointerEvents: "none",
  },
  tipNumberBadge: {
    display: "inline-block",
    backgroundColor: "rgba(0, 120, 200, 0.15)",
    color: "#0078C8",
    padding: "0.5rem 1rem",
    borderRadius: "20px",
    fontSize: "0.85rem",
    fontWeight: 700,
    marginBottom: "1rem",
    letterSpacing: "0.5px",
  },
  tipMainTitle: {
    margin: "0 0 1rem 0",
    fontSize: "1.8rem",
    fontWeight: 800,
    color: "var(--text-primary)",
    background: "linear-gradient(135deg, #0078C8 0%, var(--text-primary) 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },
  tipMainDescription: {
    margin: "0 0 1.5rem 0",
    fontSize: "1.05rem",
    color: "var(--text-secondary)",
    lineHeight: 1.7,
    fontWeight: 500,
  },
  tipsList: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
  tipItem: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    fontSize: "0.95rem",
    color: "var(--text-secondary)",
  },
  tipBullet: {
    color: "#0078C8",
    fontWeight: 700,
    fontSize: "1.1rem",
  },
  tipItemText: {
    fontWeight: 500,
  },
  tipPreviewTitle: {
    margin: 0,
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "var(--text-primary)",
    opacity: 0.6,
  },
  tipsNav: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "2rem",
  },
  navButton: {
    padding: "0.75rem 1.5rem",
    backgroundColor: "rgba(0, 120, 200, 0.1)",
    color: "#0078C8",
    border: "1px solid #0078C8",
    borderRadius: "8px",
    fontWeight: 600,
    fontSize: "0.95rem",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  progressBar: {
    width: "100%",
    maxWidth: "300px",
    height: "6px",
    backgroundColor: "rgba(0, 120, 200, 0.15)",
    borderRadius: "10px",
    overflow: "hidden",
    border: "1px solid rgba(0, 120, 200, 0.2)",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#0078C8",
    borderRadius: "10px",
    transition: "width 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
  },
};
