import React, { useMemo, useState } from "react";
import { apCourses } from "../data/apCourses";

// Custom SVG Checkmark Component
const CheckmarkSVG = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ display: "block" }}
  >
    <path
      d="M20 6L9 17L4 12"
      stroke="white"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        filter: "drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2))",
      }}
    />
  </svg>
);

const containerStyle = {
  width: "100%",
  display: "flex",
  flexDirection: "column",
  gap: "1.5rem",
};

const headingStyle = {
  fontSize: "1.5rem",
  fontWeight: 700,
  color: "var(--text-primary)",
  margin: 0,
  transition: "color 0.3s ease",
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "1rem",
};

const subjectSectionStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "0.75rem",
};

const subjectHeadingStyle = {
  fontSize: "1.15rem",
  fontWeight: 700,
  color: "var(--text-primary)",
  margin: "0.5rem 0 0",
  transition: "color 0.3s ease",
};

const cardBaseStyle = {
  padding: "1.25rem 1.25rem 1.25rem 1.25rem",
  borderRadius: "0.85rem",
  border: "2px solid transparent",
  boxShadow: "0 10px 24px var(--shadow-color)",
  backgroundColor: "var(--bg-primary)",
  cursor: "pointer",
  transition: "transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease, background-color 0.3s ease",
  textAlign: "left",
  display: "flex",
  flexDirection: "column",
  gap: "0.45rem",
  position: "relative",
  overflow: "hidden",
  minHeight: "120px",
  color: "var(--text-primary)",
};

const labelStyle = {
  fontSize: "1rem",
  fontWeight: 700,
  color: "var(--text-primary)",
  margin: 0,
  lineHeight: 1.3,
  maxWidth: "85%",
  wordWrap: "break-word",
  transition: "color 0.3s ease",
};

const detailStyle = {
  fontSize: "0.9rem",
  color: "var(--text-secondary)",
  margin: 0,
  lineHeight: 1.4,
  maxWidth: "90%",
  transition: "color 0.3s ease",
};

const checkboxContainerStyle = {
  position: "absolute",
  top: "0.75rem",
  right: "0.75rem",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const checkboxStyle = (checked) => ({
  width: "24px",
  height: "24px",
  borderRadius: "6px",
  border: checked ? "none" : "2px solid var(--border-color)",
  backgroundColor: checked ? "#0078C8" : "transparent",
  boxShadow: checked
    ? "0 0 12px rgba(0,120,200,0.5), 0 2px 8px rgba(0,120,200,0.3)"
    : "0 2px 4px var(--shadow-color)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#fff",
  fontSize: "0.85rem",
  cursor: "pointer",
  transition: "all 0.2s ease",
});

const emptyStateStyle = {
  margin: "0.5rem 0 0",
  color: "var(--text-secondary)",
  fontSize: "0.95rem",
  transition: "color 0.3s ease",
};

const submissionModeLabels = {
  essay: "Typed FRQ or essay response",
  upload: "Image/PDF-based submission",
};

function CourseCard({
  course,
  isPinned,
  onSelectCourse,
  onToggleFavorite,
  cardBaseStyle,
  labelStyle,
  detailStyle,
  checkboxContainerStyle,
  checkboxStyle,
}) {
  const [isHovered, setIsHovered] = useState(false);
  
  const restingBorder = isPinned ? "#0078C8" : "transparent";
  const restingShadow = isPinned
    ? "0 12px 28px rgba(0,120,200,0.25)"
    : cardBaseStyle.boxShadow;
  const cardBgColor = isPinned
    ? "rgba(0, 120, 200, 0.08)"
    : "var(--bg-primary)";

  const currentShadow = isHovered
    ? "0 14px 32px rgba(15, 23, 42, 0.12)"
    : restingShadow;
  const currentTransform = isHovered ? "translateY(-4px)" : "translateY(0)";

  return (
    <div
      style={{
        ...cardBaseStyle,
        borderColor: restingBorder,
        boxShadow: currentShadow,
        backgroundColor: cardBgColor,
        transform: currentTransform,
      }}
      onClick={() => onSelectCourse?.(course)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={checkboxContainerStyle}>
        <div
          style={checkboxStyle(isPinned)}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite?.(course);
          }}
        >
          {isPinned && <CheckmarkSVG />}
        </div>
      </div>
      <p style={labelStyle}>{course.name}</p>
      <p style={detailStyle}>
        {submissionModeLabels[course.submissionMode] ??
          "Mixed-format FRQs"}
      </p>
    </div>
  );
}

export default function APCourse({
  onSelectCourse,
  courses = apCourses,
  favoriteCourseIds = [],
  onToggleFavorite,
}) {
  const groupedCourses = useMemo(() => {
    const buckets = new Map();
    const order = [];

    courses.forEach((course) => {
      if (!buckets.has(course.subject)) {
        buckets.set(course.subject, []);
        order.push(course.subject);
      }
      buckets.get(course.subject).push(course);
    });

    return order.map((subject) => ({
      subject,
      courses: buckets
        .get(subject)
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name)),
    }));
  }, [courses]);

  if (!groupedCourses.length) {
    return <p style={emptyStateStyle}>No AP courses match your search yet.</p>;
  }

  return (
    <div style={containerStyle}>
      <h2 style={headingStyle}>Choose Your AP Course</h2>
      {groupedCourses.map(({ subject, courses: subjectCourses }) => (
        <section key={subject} style={subjectSectionStyle}>
          <h3 style={subjectHeadingStyle}>{subject}</h3>
          <div style={gridStyle}>
            {subjectCourses.map((course) => {
              const isPinned = favoriteCourseIds.includes(course.id);
              return (
                <CourseCard
                  key={course.id}
                  course={course}
                  isPinned={isPinned}
                  onSelectCourse={onSelectCourse}
                  onToggleFavorite={onToggleFavorite}
                  cardBaseStyle={cardBaseStyle}
                  labelStyle={labelStyle}
                  detailStyle={detailStyle}
                  checkboxContainerStyle={checkboxContainerStyle}
                  checkboxStyle={checkboxStyle}
                />
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
