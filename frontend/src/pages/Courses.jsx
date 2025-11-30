import React, { useMemo, useState } from "react";
import APCourse from "../components/APCourse";
import { apCourses } from "../data/apCourses";

export default function Courses({
  selectedCourse,
  onSelectCourse,
  favoriteCourseIds = [],
  onToggleFavorite,
}) {
  const selectedCourseName = selectedCourse?.name ?? "";
  const [searchTerm, setSearchTerm] = useState("");
  const pinnedCount = favoriteCourseIds.length;

  const filteredCourses = useMemo(() => {
    const trimmed = searchTerm.trim().toLowerCase();
    if (!trimmed) return apCourses;
    return apCourses.filter((course) => {
      const haystacks = [
        course.name,
        course.subject,
        ...(course.aliases ?? []),
      ]
        .filter(Boolean)
        .map((text) => text.toLowerCase());
      return haystacks.some((text) => text.includes(trimmed));
    });
  }, [searchTerm]);

  return (
    <section style={styles.wrapper}>
      <div style={styles.header}>
        <h1 style={styles.title}>AP Courses</h1>
        <p style={styles.subtitle}>
          {selectedCourseName
            ? `Currently focusing on ${selectedCourseName}. Pick another course to switch.`
            : "Select an AP subject to tailor practice questions for that topic."}
        </p>
      </div>
      <div style={styles.searchRow}>
        <input
          type="search"
          placeholder="Search AP courses…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={styles.searchInput}
          aria-label="Search AP courses"
        />
        {searchTerm && (
          <button style={styles.clearButton} onClick={() => setSearchTerm("")}>
            Clear
          </button>
        )}
      </div>
      <div style={styles.metaRow}>
        <p style={styles.resultMeta}>
          Showing {filteredCourses.length} course{filteredCourses.length === 1 ? "" : "s"}
        </p>
        <p style={styles.pinnedMeta}>
          {pinnedCount
            ? `${pinnedCount} pinned for My AP Dashboard`
            : "Use the checkbox to pin courses"}
        </p>
      </div>
      <APCourse
        selectedCourseId={selectedCourse?.id}
        onSelectCourse={onSelectCourse}
        courses={filteredCourses}
        favoriteCourseIds={favoriteCourseIds}
        onToggleFavorite={onToggleFavorite}
      />
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
    color: "var(--text-primary)",
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
  searchRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    marginBottom: "0.75rem",
  },
  searchInput: {
    flex: 1,
    padding: "0.75rem 1rem",
    borderRadius: "0.75rem",
    border: "1px solid var(--input-border)",
    fontSize: "1rem",
    outline: "none",
    boxSizing: "border-box",
    backgroundColor: "var(--input-bg)",
    color: "var(--input-text)",
    transition: "all 0.3s ease",
  },
  clearButton: {
    padding: "0.55rem 1rem",
    borderRadius: "0.65rem",
    border: "1px solid var(--border-color)",
    backgroundColor: "var(--bg-primary)",
    color: "var(--text-secondary)",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.3s ease",
  },
  resultMeta: {
    fontSize: "0.95rem",
    color: "var(--text-secondary)",
    margin: 0,
    transition: "color 0.3s ease",
  },
  metaRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: "1.5rem",
    gap: "1rem",
    flexWrap: "wrap",
  },
  pinnedMeta: {
    margin: 0,
    fontSize: "0.9rem",
    color: "var(--text-secondary)",
    fontWeight: 600,
    transition: "color 0.3s ease",
  },
};
