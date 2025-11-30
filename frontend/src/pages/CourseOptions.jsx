import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase";
import { getCourseById } from "../data/apCourses";
import { submitFrqForGrading, getRubricsForCourse } from "../utils/api";
import GlassDropdown from "../components/GlassDropdown";
import TextToSpeechButton from "../components/TextToSpeechButton";

const MAX_UPLOAD_SIZE = 25 * 1024 * 1024; // 25 MB
const DEFAULT_FRQ_TYPE = "general";

const FRQ_TYPE_OPTIONS = [
  { value: "general", label: "General FRQ / Essay", icon: "" },
  { value: "dbq", label: "Document-Based Question (DBQ)", icon: "" },
  { value: "leq", label: "Long Essay Question (LEQ)", icon: "" },
  { value: "saq", label: "Short-Answer Question (SAQ)", icon: "" },
  { value: "argument-essay", label: "Argument Essay", icon: "" },
  { value: "synthesis-essay", label: "Synthesis Essay", icon: "" },
  { value: "rhetorical-analysis", label: "Rhetorical Analysis", icon: "" },
  { value: "performance-task", label: "Performance Task", icon: "" },
  { value: "research-presentation", label: "Research Presentation", icon: "" },
];

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });

// Courses that don't have MCQ sections
const NON_MCQ_COURSES = [
  'ap-research',
  'ap-seminar', 
  'ap-studio-art-2d',
  'ap-studio-art-3d',
  'ap-drawing'
];

// Check if course has MCQ sections
const hasMCQSection = (courseId) => {
  return !NON_MCQ_COURSES.includes(courseId);
};

export default function CourseOptions({ userProfile, onSelectCourse }) {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const course = getCourseById(courseId);

  const [frqType, setFrqType] = useState(DEFAULT_FRQ_TYPE);
  const [frqPrompt, setFrqPrompt] = useState("");
  const [essayResponse, setEssayResponse] = useState("");
  const [essayAttachment, setEssayAttachment] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [gradeResponse, setGradeResponse] = useState(null);
  const [gradingError, setGradingError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGrading, setIsGrading] = useState(false);
  const [availableRubrics, setAvailableRubrics] = useState([]);
  const [isLoadingRubrics, setIsLoadingRubrics] = useState(false);
  const [rubricError, setRubricError] = useState("");
  const [progressWidth, setProgressWidth] = useState(35);

  const essayFileInputRef = useRef(null);
  const uploadInputRef = useRef(null);

  useEffect(() => {
    if (course && onSelectCourse) {
      onSelectCourse(course, { persist: false });
    }
  }, [course, onSelectCourse]);

  useEffect(() => {
    setFrqType(DEFAULT_FRQ_TYPE);
    setFrqPrompt("");
    setEssayResponse("");
    setEssayAttachment(null);
    setSelectedFile(null);
    setGradeResponse(null);
    setGradingError("");
    setStatusMessage("");
    if (essayFileInputRef.current) {
      essayFileInputRef.current.value = "";
    }
    if (uploadInputRef.current) {
      uploadInputRef.current.value = "";
    }
  }, [course?.id]);

  useEffect(() => {
    let active = true;

    const loadRubrics = async () => {
      if (!course?.id) return;
      setIsLoadingRubrics(true);
      setRubricError("");

      try {
        const response = await getRubricsForCourse(course.id);
        if (!active) return;
        setAvailableRubrics(response?.rubrics ?? []);
      } catch (error) {
        console.error("Failed to load rubrics", error);
        if (!active) return;
        setAvailableRubrics([]);
        setRubricError(
          error?.message ?? "We couldn’t load rubric excerpts just yet."
        );
      } finally {
        if (active) {
          setIsLoadingRubrics(false);
        }
      }
    };

    loadRubrics();

    return () => {
      active = false;
    };
  }, [course?.id]);

  useEffect(() => {
    if (!isGrading) {
      setProgressWidth(35);
      return;
    }

    const steps = [30, 55, 80, 45, 70];
    let index = 0;
    setProgressWidth(steps[index]);

    const timer = setInterval(() => {
      index = (index + 1) % steps.length;
      setProgressWidth(steps[index]);
    }, 650);

    return () => clearInterval(timer);
  }, [isGrading]);

  if (!course) {
    return (
      <section style={styles.wrapper}>
        <div style={styles.header}>
          <h1 style={styles.title}>Course not found</h1>
          <p style={styles.subtitle}>
            We couldn’t find the AP course you were looking for. Head back and
            pick another course.
          </p>
        </div>
        <div style={styles.actions}>
          <button style={styles.secondaryButton} onClick={() => navigate("/courses")}>
            Back to Courses
          </button>
          <button style={styles.primaryButton} onClick={() => navigate("/dashboard")}>
            Go to Dashboard
          </button>
        </div>
      </section>
    );
  }

  const submissionCollection = userProfile?.uid
    ? collection(db, "users", userProfile.uid, "submissions")
    : null;

  const uploadAttachment = async (file) => {
    if (!file) return null;
    if (!storage) {
      throw new Error("File storage is not configured.");
    }
    if (!userProfile?.uid) {
      throw new Error("You need to be logged in to upload files.");
    }
    if (file.size > MAX_UPLOAD_SIZE) {
      throw new Error("Uploads must be 25 MB or smaller.");
    }

    const normalizedName = file.name
      .toLowerCase()
      .replace(/[^a-z0-9.\-_]+/g, "-")
      .replace(/-+/g, "-");
    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const path = `users/${userProfile.uid}/submissions/${course.id}/${uniqueSuffix}-${normalizedName}`;
    const fileReference = storageRef(storage, path);
    await uploadBytes(fileReference, file);
    const downloadURL = await getDownloadURL(fileReference);

    return {
      name: file.name,
      size: file.size,
      type: file.type,
      storagePath: path,
      downloadURL,
    };
  };

  const runGrading = async (payload) => {
    setIsGrading(true);
    setGradingError("");
    try {
      const response = await submitFrqForGrading(payload);
      setGradeResponse(response);
      
      // Save FRQ submission to localStorage for stats tracking
      if (response && course?.id) {
        saveFrqSubmissionToStats(course.id, payload, response);
      }
      
      return response;
    } catch (error) {
      console.error("Grading request failed", error);
      setGradeResponse(null);
      setGradingError(
        error?.message ??
          "We couldn't get a grade from the server. Try again in a moment."
      );
      throw error;
    } finally {
      setIsGrading(false);
    }
  };

  const saveFrqSubmissionToStats = (courseId, payload, response) => {
    try {
      // Get existing FRQ submissions
      const existingSubmissions = JSON.parse(localStorage.getItem('frqSubmissions') || '{}');
      
      // Initialize course submissions if not exists
      if (!existingSubmissions[courseId]) {
        existingSubmissions[courseId] = [];
      }
      
      // Create submission record
      const submission = {
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        questionType: payload.questionType,
        prompt: payload.prompt,
        responseText: payload.responseText,
        hasImage: !!payload.imageData,
        imageName: payload.imageName,
        grade: response?.grade || null,
        graded: response?.graded || false
      };
      
      // Add to submissions array
      existingSubmissions[courseId].push(submission);
      
      // Keep only last 50 submissions per course
      if (existingSubmissions[courseId].length > 50) {
        existingSubmissions[courseId] = existingSubmissions[courseId].slice(-50);
      }
      
      // Save back to localStorage
      localStorage.setItem('frqSubmissions', JSON.stringify(existingSubmissions));
      
      console.log('Saved FRQ submission for', courseId, ':', submission);
    } catch (error) {
      console.error('Error saving FRQ submission to stats:', error);
    }
  };

  const handleEssaySubmit = async () => {
    const trimmedEssay = essayResponse.trim();
    const trimmedPrompt = frqPrompt.trim();

    if (!trimmedEssay && !essayAttachment) {
      setStatusMessage("Add your response or attach an image before submitting.");
      return;
    }

    setIsSubmitting(true);
    setStatusMessage("");
    setGradeResponse(null);
    setGradingError("");

    let base64Image = null;

    try {
      if (essayAttachment) {
        if (essayAttachment.size > MAX_UPLOAD_SIZE) {
          throw new Error("Uploads must be 25 MB or smaller.");
        }
        base64Image = await fileToDataUrl(essayAttachment);
      }

      // Skip Firebase Storage for now due to CORS issues
      // Just proceed directly to grading
      setStatusMessage("Processing submission for grading...");

      const gradingPayload = {
        courseId: course.id,
        courseName: course.name,
        questionType: frqType,
        prompt: trimmedPrompt,
        responseText: trimmedEssay,
        imageData: base64Image,
        imageName: essayAttachment?.name ?? null,
      };

      const gradingResult = await runGrading(gradingPayload);

      const gradeMessage = gradingResult?.graded
        ? "Rubric-based grading complete."
        : gradingResult?.grade?.summary ??
          "Stored submission, but automated grading isn't available yet.";

      setStatusMessage((prev) =>
        prev ? `${prev} ${gradeMessage}` : gradeMessage
      );

      setEssayResponse("");
      setFrqPrompt("");
      setEssayAttachment(null);
      if (essayFileInputRef.current) {
        essayFileInputRef.current.value = "";
      }
    } catch (error) {
      setStatusMessage((prev) =>
        prev
          ? `${prev} (${error?.message ?? "Grading failed."})`
          : error?.message ?? "We couldn't process that submission. Try again shortly."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile) {
      setStatusMessage("Select a file or image before submitting.");
      return;
    }
    if (selectedFile.size > MAX_UPLOAD_SIZE) {
      setStatusMessage("Uploads must be 25 MB or smaller.");
      return;
    }

    setIsSubmitting(true);
    setStatusMessage("");
    setGradeResponse(null);
    setGradingError("");

    try {
      setStatusMessage("Converting image to base64...");
      const base64Image = await fileToDataUrl(selectedFile);
      
      setStatusMessage("Processing image for grading...");

      const gradingPayload = {
        courseId: course.id,
        courseName: course.name,
        questionType: frqType,
        prompt: frqPrompt.trim(),
        responseText: "",
        imageData: base64Image,
        imageName: selectedFile.name,
      };

      const gradingResult = await runGrading(gradingPayload);

      const gradeMessage = gradingResult?.graded
        ? "Rubric-based grading complete."
        : gradingResult?.grade?.summary ??
          "Stored submission, but automated grading isn't available yet.";

      setStatusMessage((prev) =>
        prev ? `${prev} ${gradeMessage}` : gradeMessage
      );

      setSelectedFile(null);
      if (uploadInputRef.current) {
        uploadInputRef.current.value = "";
      }
    } catch (error) {
      setStatusMessage((prev) =>
        prev
          ? `${prev} (${error?.message ?? "Grading failed."})`
          : error?.message ?? "We couldn't process that upload. Try again shortly."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEssayFlow = course.submissionMode === "essay";
  const grade = gradeResponse?.grade ?? null;

  return (
    <section style={styles.wrapper}>
      <div style={styles.header}>
        <div>
          <p style={styles.eyebrow}>Course workspace</p>
          <h1 style={styles.title}>{course.name}</h1>
          <p style={styles.subtitle}>
            Choose how you want to train today. Multiple choice pulls fresh
            questions from the CED. FRQ / Essay submissions are stored and graded
            instantly using the official College Board rubrics.
          </p>
        </div>
        <button style={styles.secondaryButton} onClick={() => navigate("/dashboard")}>
          Back to Dashboard
        </button>
      </div>

      <div style={styles.grid}>
        <div style={styles.practiceCardsRow}>
          {hasMCQSection(course?.id) && (
            <div style={styles.mcqCard}>
              <div>
                <h2 style={styles.mcqTitle}>Practice MCQs</h2>
                <p style={styles.mcqDescription}>
                  Adaptive practice aligned with CED units
                </p>
              </div>
              <button
                style={styles.mcqButton}
                onClick={() => navigate(`/practice/${course.id}`)}
              >
                Start Practice
              </button>
            </div>
          )}

          <div style={styles.practiceTestCard}>
            <div>
              <h2 style={styles.practiceTestTitle}>Practice Test</h2>
              <p style={styles.practiceTestDescription}>
                Full-length practice test matching real AP exam format
              </p>
            </div>
            <button
              style={styles.practiceTestButton}
              onClick={() => navigate(`/practice-test/${course.id}`)}
            >
              Generate Test
            </button>
          </div>
        </div>

        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Submit FRQ / Essay</h2>
          <p style={styles.cardBody}>
            {isEssayFlow
              ? "Paste your typed response and optionally attach a photo of handwritten work. We’ll store it and score it against the CED rubric."
              : "Upload images or PDFs of your work. We’ll keep a record and run rubric-based grading on each submission."}
          </p>

          <div style={styles.fieldGroup}>
            <label style={styles.fieldLabel}>Free-response type</label>
            <GlassDropdown
              value={frqType}
              onChange={setFrqType}
              options={FRQ_TYPE_OPTIONS}
              label="Free-response type"
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.fieldLabel}>Prompt or question</label>
            <textarea
              value={frqPrompt}
              onChange={(e) => setFrqPrompt(e.target.value)}
              placeholder="Paste the FRQ prompt so the grader can align to the right rubric..."
              style={styles.promptArea}
              rows={3}
            />
          </div>

          {isEssayFlow ? (
            <>
              <div style={styles.fieldGroup}>
                <label style={styles.fieldLabel}>Typed response</label>
                <textarea
                  value={essayResponse}
                  onChange={(e) => {
                    setEssayResponse(e.target.value);
                    if (statusMessage) setStatusMessage("");
                  }}
                  placeholder="Paste or type your essay/response here..."
                  style={styles.textarea}
                  rows={8}
                />
              </div>
              <div style={styles.attachmentStack}>
                <label style={styles.uploadLabel}>
                  <input
                    ref={essayFileInputRef}
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    style={styles.fileInput}
                    onChange={(e) => {
                      setEssayAttachment(e.target.files?.[0] ?? null);
                      if (statusMessage) setStatusMessage("");
                    }}
                  />
                  <span>
                    {essayAttachment
                      ? `Attached: ${essayAttachment.name}`
                      : "Attach a work image (optional)"}
                  </span>
                </label>
                {essayAttachment && (
                  <button
                    type="button"
                    style={styles.removeAttachment}
                    onClick={() => {
                      setEssayAttachment(null);
                      if (essayFileInputRef.current) {
                        essayFileInputRef.current.value = "";
                      }
                    }}
                  >
                    Remove attachment
                  </button>
                )}
                <p style={styles.attachmentHint}>
                  Supports PDF, PNG, JPG up to 25 MB.
                </p>
              </div>
              <button
                style={{
                  ...styles.primaryButton,
                  ...(isSubmitting || isGrading ? styles.primaryButtonDisabled : {}),
                }}
                onClick={handleEssaySubmit}
                disabled={isSubmitting || isGrading}
              >
                {isSubmitting || isGrading ? "Grading…" : "Submit for Grading"}
              </button>
            </>
          ) : (
            <>
              <label style={styles.uploadLabel}>
                <input
                  ref={uploadInputRef}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  style={styles.fileInput}
                  onChange={(e) => {
                    setSelectedFile(e.target.files?.[0] ?? null);
                    if (statusMessage) setStatusMessage("");
                  }}
                />
                <span>
                  {selectedFile
                    ? `Selected: ${selectedFile.name}`
                    : "Upload your FRQ or work image"}
                </span>
              </label>
              {selectedFile && (
                <button
                  type="button"
                  style={styles.removeAttachment}
                  onClick={() => {
                    setSelectedFile(null);
                    if (uploadInputRef.current) {
                      uploadInputRef.current.value = "";
                    }
                  }}
                >
                  Remove file
                </button>
              )}
              <p style={styles.attachmentHint}>
                Supports PDF, PNG, JPG up to 25 MB.
              </p>
              <button
                style={{
                  ...styles.primaryButton,
                  ...(isSubmitting || isGrading ? styles.primaryButtonDisabled : {}),
                }}
                onClick={handleUploadSubmit}
                disabled={isSubmitting || isGrading}
              >
                {isSubmitting || isGrading ? "Grading…" : "Submit for Grading"}
              </button>
            </>
          )}


          {isGrading && (
            <div style={styles.progressBarContainer} aria-live="polite">
              <p style={styles.helperText}>Scoring your submission… this can take a few seconds for images.</p>
              <div style={styles.progressBarTrack}>
                <div
                  style={{
                    ...styles.progressBarIndicator,
                    width: `${progressWidth}%`,
                  }}
                />
              </div>
            </div>
          )}

          {gradeResponse && (
            <div style={styles.gradeCard}>
              <div style={styles.gradeHeader}>
                <h3 style={styles.gradeTitle}>AI Rubric Grade</h3>
                {gradeResponse?.graded && gradeResponse?.grade?.model && (
                  <span style={styles.gradeBadge}>{gradeResponse.grade.model}</span>
                )}
              </div>

              {grade ? (
                <>
                  <div style={styles.gradeStats}>
                    <div style={styles.gradeStat}>
                      <span style={styles.statLabel}>Score</span>
                      <span style={styles.statValue}>
                        {grade.overallScore !== null && grade.overallScore !== undefined
                          ? `${grade.overallScore}${
                              grade.maxScore ? ` / ${grade.maxScore}` : ""
                            }`
                          : `${grade.overallScore || 0} / ${grade.maxScore || 7}`}
                      </span>
                    </div>
                    <div style={styles.gradeStat}>
                      <span style={styles.statLabel}>Level</span>
                      <span style={styles.statValue}>
                        {grade.performanceLevel || "N/A"}
                      </span>
                    </div>
                  </div>

                  {grade.summary && (
                    <div style={styles.gradeSummaryContainer}>
                      <p style={styles.gradeSummary}>{grade.summary}</p>
                      <TextToSpeechButton 
                        text={grade.summary}
                        style={{ marginLeft: '8px' }}
                      />
                    </div>
                  )}

                  {grade.strengths?.length ? (
                    <div style={styles.gradeSection}>
                      <p style={styles.gradeSubheading}>What worked</p>
                      <ul style={styles.gradeList}>
                        {grade.strengths.map((item, idx) => (
                          <li key={`strength-${idx}`} style={styles.gradeListItem}>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {grade.improvements?.length ? (
                    <div style={styles.gradeSection}>
                      <p style={styles.gradeSubheading}>Next steps</p>
                      <ul style={styles.gradeList}>
                        {grade.improvements.map((item, idx) => (
                          <li key={`improvement-${idx}`} style={styles.gradeListItem}>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {grade.rubricAlignment?.length ? (
                    <div style={styles.gradeSection}>
                      <p style={styles.gradeSubheading}>Rubric alignment</p>
                      <ul style={styles.gradeList}>
                        {grade.rubricAlignment.map((entry, idx) => (
                          <li key={`alignment-${idx}`} style={styles.gradeListItem}>
                            <strong>{entry.criterion}</strong>
                            <span>
                              {entry.score !== null
                                ? ` ${entry.score}${
                                    entry.maxScore ? `/${entry.maxScore}` : ""
                                  }`
                                : ""}
                            </span>
                            <p style={styles.alignmentExplanation}>
                              {entry.explanation}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </>
              ) : (
                <p style={styles.gradeSummary}>
                  Automated grading not available yet. Once an OpenAI key is
                  configured, FRQs will be evaluated against the rubric instantly.
                </p>
              )}

              {gradingError && <p style={styles.error}>{gradingError}</p>}
              {!gradeResponse?.graded && grade?.summary && (
                <p style={styles.pendingNote}>{grade.summary}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {statusMessage && <p style={styles.status}>{statusMessage}</p>}

      <div style={styles.actions}>
        <button style={styles.secondaryButton} onClick={() => navigate("/courses")}>
          Explore more courses
        </button>
        <button style={styles.primaryButton} onClick={() => navigate("/dashboard")}>
          Return Home
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
    display: "flex",
    flexDirection: "column",
    gap: "2.5rem",
    color: "var(--text-primary)",
    transition: "all 0.3s ease",
    backdropFilter: "blur(10px)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "1.5rem",
    flexWrap: "wrap",
  },
  eyebrow: {
    margin: 0,
    fontSize: "0.85rem",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "var(--text-secondary)",
    transition: "color 0.3s ease",
  },
  title: {
    fontSize: "2.5rem",
    fontWeight: 800,
    color: "var(--text-primary)",
    margin: "0.25rem 0",
    transition: "color 0.3s ease",
    background: "linear-gradient(135deg, var(--text-primary) 0%, #0078C8 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },
  subtitle: {
    fontSize: "1.05rem",
    color: "var(--text-secondary)",
    margin: 0,
    lineHeight: 1.6,
    transition: "color 0.3s ease",
  },
  grid: {
    display: "flex",
    flexDirection: "column",
    gap: "2rem",
  },
  practiceCardsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "2rem",
  },
  card: {
    backgroundColor: "var(--bg-primary)",
    borderRadius: "1rem",
    padding: "1.75rem",
    boxShadow: "0 10px 24px var(--shadow-color)",
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    border: "1px solid var(--border-color)",
    transition: "all 0.3s ease",
  },
  mcqCard: {
    backgroundColor: "var(--bg-primary)",
    borderRadius: "1rem",
    padding: "1.25rem",
    boxShadow: "0 10px 24px var(--shadow-color)",
    display: "flex",
    flexDirection: "row",
    gap: "1rem",
    alignItems: "center",
    border: "1px solid var(--border-color)",
    transition: "all 0.3s ease",
  },
  cardTitle: {
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "var(--text-primary)",
    margin: 0,
    background: "linear-gradient(135deg, #0078C8 0%, #2aa3f2 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  mcqTitle: {
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "var(--text-primary)",
    margin: 0,
    background: "linear-gradient(135deg, #0078C8 0%, #2aa3f2 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  mcqDescription: {
    fontSize: "0.9rem",
    color: "var(--text-secondary)",
    margin: 0,
    lineHeight: 1.4,
    transition: "color 0.3s ease",
  },
  mcqButton: {
    background: "linear-gradient(135deg, #0078C8 0%, #2aa3f2 100%)",
    color: "white",
    border: "none",
    borderRadius: "0.75rem",
    padding: "0.75rem 1.5rem",
    fontSize: "1rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 16px rgba(0, 120, 200, 0.3)",
    whiteSpace: "nowrap",
    marginLeft: "auto",
  },
  practiceTestCard: {
    background: "var(--bg-primary)",
    borderRadius: "1rem",
    padding: "2rem",
    boxShadow: "0 8px 24px var(--shadow-color), 0 0 0 1px var(--border-color)",
    border: "none",
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "1rem",
    transition: "all 0.3s ease",
    backdropFilter: "blur(10px)",
  },
  practiceTestTitle: {
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "var(--text-primary)",
    margin: 0,
    background: "linear-gradient(135deg, #0078C8 0%, #2aa3f2 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  practiceTestDescription: {
    fontSize: "1rem",
    color: "var(--text-secondary)",
    margin: 0,
    lineHeight: 1.5,
  },
  practiceTestButton: {
    background: "linear-gradient(135deg, #0078C8 0%, #2aa3f2 100%)",
    color: "white",
    border: "none",
    borderRadius: "0.75rem",
    padding: "1rem 2rem",
    fontSize: "1rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 16px rgba(102, 126, 234, 0.3)",
    whiteSpace: "nowrap",
  },
  cardBody: {
    fontSize: "1rem",
    color: "var(--text-secondary)",
    margin: 0,
    lineHeight: 1.6,
    transition: "color 0.3s ease",
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  fieldLabel: {
    fontSize: "0.95rem",
    fontWeight: 600,
    color: "var(--text-primary)",
    transition: "color 0.3s ease",
  },
  select: {
    borderRadius: "0.75rem",
    border: "1px solid var(--input-border)",
    padding: "0.75rem",
    fontSize: "1rem",
    backgroundColor: "var(--input-bg)",
    color: "var(--input-text)",
    fontWeight: 600,
    transition: "all 0.3s ease",
  },
  promptArea: {
    width: "100%",
    borderRadius: "0.75rem",
    border: "1px solid var(--input-border)",
    padding: "0.85rem",
    fontSize: "1rem",
    lineHeight: 1.4,
    resize: "vertical",
    minHeight: "120px",
    backgroundColor: "var(--input-bg)",
    color: "var(--input-text)",
    transition: "all 0.3s ease",
  },
  textarea: {
    width: "100%",
    borderRadius: "0.75rem",
    border: "1px solid var(--input-border)",
    padding: "1rem",
    fontSize: "1rem",
    lineHeight: 1.6,
    resize: "vertical",
    minHeight: "220px",
    backgroundColor: "var(--input-bg)",
    color: "var(--input-text)",
    transition: "all 0.3s ease",
  },
  primaryButton: {
    alignSelf: "flex-start",
    padding: "0.85rem 1.75rem",
    backgroundColor: "#0078C8",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "0.85rem",
    fontWeight: 700,
    cursor: "pointer",
    transition: "background-color 0.2s ease",
  },
  primaryButtonDisabled: {
    opacity: 0.75,
    cursor: "not-allowed",
    backgroundColor: "#0F4C81",
  },
  secondaryButton: {
    padding: "0.85rem 1.5rem",
    backgroundColor: "var(--bg-primary)",
    color: "var(--text-primary)",
    border: "1px solid var(--border-color)",
    borderRadius: "0.85rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.3s ease",
  },
  uploadLabel: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "1rem",
    border: "1px dashed var(--border-color)",
    borderRadius: "0.85rem",
    padding: "1rem 1.25rem",
    cursor: "pointer",
    backgroundColor: "var(--bg-primary)",
    transition: "all 0.3s ease",
  },
  fileInput: {
    display: "none",
  },
  attachmentStack: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  removeAttachment: {
    alignSelf: "flex-start",
    background: "transparent",
    border: "none",
    color: "#EF4444",
    fontWeight: 600,
    cursor: "pointer",
    padding: 0,
  },
  attachmentHint: {
    margin: 0,
    fontSize: "0.85rem",
    color: "var(--text-secondary)",
    transition: "color 0.3s ease",
  },
  helperText: {
    margin: 0,
    fontSize: "0.9rem",
    color: "var(--text-secondary)",
    transition: "color 0.3s ease",
  },
  rubricPanel: {
    borderTop: "1px solid var(--border-color)",
    paddingTop: "1rem",
    marginTop: "0.5rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
    transition: "border-color 0.3s ease",
  },
  rubricList: {
    listStyle: "none",
    margin: 0,
    padding: 0,
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
  rubricItem: {
    display: "flex",
    flexDirection: "column",
    gap: "0.4rem",
    backgroundColor: "var(--bg-primary)",
    borderRadius: "0.75rem",
    padding: "0.75rem 0.9rem",
    border: "1px solid var(--border-color)",
    transition: "all 0.3s ease",
  },
  rubricTags: {
    fontSize: "0.85rem",
    color: "#0369A1",
    fontWeight: 600,
  },
  gradeCard: {
    backgroundColor: "var(--bg-primary)",
    borderRadius: "1rem",
    padding: "1.5rem",
    border: "1px solid var(--border-color)",
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    transition: "all 0.3s ease",
  },
  gradeHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  gradeTitle: {
    margin: 0,
    fontSize: "1.1rem",
    fontWeight: 700,
    color: "var(--text-primary)",
    transition: "color 0.3s ease",
  },
  gradeBadge: {
    backgroundColor: "rgba(3, 105, 161, 0.1)",
    color: "#0369A1",
    padding: "0.35rem 0.75rem",
    borderRadius: "999px",
    fontSize: "0.85rem",
    fontWeight: 600,
  },
  gradeStats: {
    display: "flex",
    gap: "1.5rem",
    flexWrap: "wrap",
  },
  gradeStat: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
  },
  statLabel: {
    fontSize: "0.85rem",
    color: "var(--text-secondary)",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    transition: "color 0.3s ease",
  },
  statValue: {
    fontSize: "1.3rem",
    fontWeight: 700,
    color: "var(--text-primary)",
    transition: "color 0.3s ease",
  },
  gradeSummaryContainer: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
  },
  gradeSummary: {
    margin: 0,
    fontSize: "1rem",
    color: "var(--text-secondary)",
    lineHeight: 1.6,
    transition: "color 0.3s ease",
    flex: 1,
  },
  gradeSection: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  gradeSubheading: {
    margin: 0,
    fontSize: "0.95rem",
    fontWeight: 700,
    color: "var(--text-primary)",
    transition: "color 0.3s ease",
  },
  gradeList: {
    margin: 0,
    paddingLeft: "1.1rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.4rem",
  },
  gradeListItem: {
    fontSize: "0.95rem",
    color: "var(--text-secondary)",
    lineHeight: 1.5,
    transition: "color 0.3s ease",
  },
  alignmentExplanation: {
    margin: "0.35rem 0 0",
    fontSize: "0.9rem",
    color: "var(--text-secondary)",
    lineHeight: 1.45,
    transition: "color 0.3s ease",
  },
  pendingNote: {
    margin: 0,
    fontSize: "0.9rem",
    color: "var(--text-primary)",
    backgroundColor: "var(--bg-primary)",
    padding: "0.75rem",
    borderRadius: "0.75rem",
    border: "1px solid var(--border-color)",
    transition: "all 0.3s ease",
  },
  error: {
    margin: 0,
    fontSize: "0.9rem",
    color: "#B91C1C",
  },
  status: {
    margin: 0,
    fontSize: "0.95rem",
    color: "var(--text-primary)",
    backgroundColor: "var(--bg-primary)",
    borderRadius: "0.75rem",
    padding: "0.85rem 1.1rem",
    border: "1px solid var(--border-color)",
    transition: "all 0.3s ease",
  },
  actions: {
    display: "flex",
    gap: "1rem",
    flexWrap: "wrap",
  },
  progressBarContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
    marginTop: "1rem",
  },
  progressBarTrack: {
    width: "100%",
    height: "0.5rem",
    backgroundColor: "#E2E8F0",
    borderRadius: "999px",
    overflow: "hidden",
  },
  progressBarIndicator: {
    width: "35%",
    height: "100%",
    backgroundColor: "#0078C8",
    borderRadius: "999px",
    transition: "width 0.6s ease-in-out",
  },
};

function formatQuestionTypes(types = []) {
  if (!types.length) return "General rubric";
  return types
    .map((type) => {
      const option = FRQ_TYPE_OPTIONS.find((item) => item.value === type);
      return option?.label ?? type;
    })
    .join(" • ");
}
