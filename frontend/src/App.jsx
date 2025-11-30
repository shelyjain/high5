import { useCallback, useEffect, useMemo, useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import Login from "./components/Login";
import Signup from "./components/Signup";
import Dashboard from "./components/Dashboard";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Courses from "./pages/Courses";
import CourseOptions from "./pages/CourseOptions";
import Practice from "./pages/Practice";
import Stats from "./pages/Stats";
import StudyCalendar from "./pages/StudyCalendar";
import Settings from "./pages/Settings";
import Community from "./pages/Community";
import PracticeTest from "./pages/PracticeTest";
import Flashcards from "./pages/Flashcards";
import OnboardingTutorial from "./components/OnboardingTutorial";
import { auth, db } from "./firebase";
import {
  findCourseByName,
  getCourseById,
  sanitizeFavoriteCourseIds,
} from "./data/apCourses";
import { ThemeProvider } from "./context/ThemeContext";
import { VoiceProvider } from "./context/ThemeContext";
import "./App.css";

const DEFAULT_STATS = { totalQuestions: 0, correct: 0, streak: 0 };

const normalizeSelectedCourse = (raw) => {
  if (!raw) return null;
  if (typeof raw === "object" && raw.id && raw.name) return raw;
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    const fromId = getCourseById(trimmed);
    if (fromId) return { id: fromId.id, name: fromId.name };
    const fromName = findCourseByName(trimmed);
    if (fromName) return { id: fromName.id, name: fromName.name };
    return { id: "", name: trimmed };
  }
  return null;
};

function AppContent() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    let isMounted = true;

    // Check for guest mode on mount
    const guestMode = localStorage.getItem('isGuest') === 'true';
    if (guestMode) {
      setIsGuest(true);
      setLoggedIn(true);
      setIsAuthReady(true);
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!isMounted) return;

      // Clear guest mode if user logs in
      if (user) {
        localStorage.removeItem('isGuest');
        setIsGuest(false);
      }

      if (!user) {
        // Check if still in guest mode
        const stillGuest = localStorage.getItem('isGuest') === 'true';
        if (!stillGuest) {
          setLoggedIn(false);
          setUserProfile(null);
          setIsLogin(true);
        }
        setIsAuthReady(true);
        return;
      }

      try {
        const userRef = doc(db, "users", user.uid);
        const snapshot = await getDoc(userRef);
        const fallbackEmail = user.email ?? "";
        let profileData;

        if (snapshot.exists()) {
          const data = snapshot.data();
          const normalizedSelection = normalizeSelectedCourse(data.selectedCourse);
          const favoriteCourses = sanitizeFavoriteCourseIds(
            data.favoriteCourses
          );

          profileData = {
            uid: user.uid,
            email: data.email ?? fallbackEmail,
            preferredName: data.preferredName || null,
            selectedCourse: normalizedSelection,
            stats: data.stats ?? DEFAULT_STATS,
            favoriteCourses,
          };

          const updates = {};
          if (!data.email && fallbackEmail) updates.email = fallbackEmail;
          if (!data.stats) updates.stats = DEFAULT_STATS;
          if (
            data.selectedCourse === undefined ||
            typeof data.selectedCourse === "string" ||
            (data.selectedCourse &&
              typeof data.selectedCourse === "object" &&
              (!data.selectedCourse.id || !data.selectedCourse.name))
          ) {
            updates.selectedCourse = normalizedSelection;
          }
          if (
            !Array.isArray(data.favoriteCourses) ||
            JSON.stringify(favoriteCourses) !==
              JSON.stringify(data.favoriteCourses ?? [])
          ) {
            updates.favoriteCourses = favoriteCourses;
          }

          if (Object.keys(updates).length) {
            await setDoc(userRef, updates, { merge: true });
          }
        } else {
          const defaultProfile = {
            email: fallbackEmail,
            selectedCourse: null,
            stats: DEFAULT_STATS,
            favoriteCourses: [],
            createdAt: serverTimestamp(),
          };
          await setDoc(userRef, defaultProfile);
          profileData = {
            uid: user.uid,
            email: defaultProfile.email,
            preferredName: null,
            selectedCourse: null,
            stats: DEFAULT_STATS,
            favoriteCourses: [],
          };
        }

        if (isMounted) {
          setUserProfile(profileData);
          setLoggedIn(true);
        }
      } catch (error) {
        console.error("Failed to hydrate profile after auth change:", error);
      } finally {
        if (isMounted) {
          setIsAuthReady(true);
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const selectedCourse = userProfile?.selectedCourse ?? null;
  const favoriteCourseIds = userProfile?.favoriteCourses;
  const pinnedCourses = useMemo(
    () =>
      (favoriteCourseIds ?? [])
        .map((id) => getCourseById(id))
        .filter(Boolean),
    [favoriteCourseIds]
  );

  const handleAuthSuccess = useCallback(
    (profile) => {
      const favoriteCourses = sanitizeFavoriteCourseIds(
        profile?.favoriteCourses
      );
      setUserProfile(
        profile
          ? {
              ...profile,
              favoriteCourses,
            }
          : profile
      );
      setLoggedIn(true);
      setIsAuthReady(true);
      navigate("/dashboard", { replace: true });
    },
    [navigate]
  );

  const handleLogout = useCallback(async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Error while logging out:", err);
    } finally {
      // Clear guest mode
      localStorage.removeItem('isGuest');
      setIsGuest(false);
      setLoggedIn(false);
      setUserProfile(null);
      setIsLogin(true);
      navigate("/", { replace: true });
    }
  }, [navigate]);

  const syncCourseSelection = useCallback(
    async (course, { persist = true } = {}) => {
      if (!course) return;

      const nextSelection = { id: course.id, name: course.name };
      setUserProfile((prev) =>
        prev ? { ...prev, selectedCourse: nextSelection } : prev
      );

      if (
        persist &&
        userProfile?.uid &&
        userProfile?.selectedCourse?.id !== course.id
      ) {
        try {
          await updateDoc(doc(db, "users", userProfile.uid), {
            selectedCourse: nextSelection,
          });
        } catch (err) {
          console.error("Failed to update selected course:", err);
        }
      }
    },
    [userProfile?.uid, userProfile?.selectedCourse?.id]
  );

  const ensureCourseSelectionNoPersist = useCallback(
    (course) => syncCourseSelection(course, { persist: false }),
    [syncCourseSelection]
  );

  const toggleFavoriteCourse = useCallback(
    async (course) => {
      if (!course || !userProfile?.uid) return;

      const currentFavorites = userProfile.favoriteCourses ?? [];
      const isPinned = currentFavorites.includes(course.id);
      const nextFavorites = isPinned
        ? currentFavorites.filter((id) => id !== course.id)
        : [...currentFavorites, course.id];

      setUserProfile((prev) =>
        prev ? { ...prev, favoriteCourses: nextFavorites } : prev
      );

      try {
        await updateDoc(doc(db, "users", userProfile.uid), {
          favoriteCourses: nextFavorites,
        });
      } catch (err) {
        console.error("Failed to update favorite courses:", err);
        setUserProfile((prev) =>
          prev ? { ...prev, favoriteCourses: currentFavorites } : prev
        );
      }
    },
    [userProfile?.uid, userProfile?.favoriteCourses]
  );

  const handleFeaturedCourseOpen = useCallback(
    async (course) => {
      await syncCourseSelection(course);
      navigate(`/course/${course.id}`);
    },
    [navigate, syncCourseSelection]
  );

  const handleCourseSelectFromGrid = useCallback(
    async (course) => {
      await syncCourseSelection(course);
      navigate(`/course/${course.id}`);
    },
    [navigate, syncCourseSelection]
  );

  const practiceFallbackCourse = useMemo(() => {
    if (!selectedCourse?.id) return null;
    return getCourseById(selectedCourse.id) ?? selectedCourse;
  }, [selectedCourse]);

  if (!isAuthReady) {
    return (
      <div className="login-screen">
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem" }}>
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
            <h1 className="title">High5</h1>
          </div>
          <p className="msg">Checking your session…</p>
        </div>
      </div>
    );
  }

  if (!loggedIn) {
    return (
      <Routes>
        <Route path="/" element={<Home />} />
        <Route 
          path="/login" 
          element={
            <div className="login-screen" data-theme="light">
              <div className="card">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "2rem" }}>
                  <img 
                    src="/logo.png" 
                    alt="High5 Logo" 
                    style={{
                      width: "48px",
                      height: "48px",
                      marginRight: "12px",
                      borderRadius: "10px",
                      boxShadow: "0 4px 15px rgba(0, 120, 200, 0.25)"
                    }}
                  />
                  <h1 className="title">High5</h1>
                </div>
                {isLogin ? (
                  <Login onLoginSuccess={handleAuthSuccess} />
                ) : (
                  <Signup onSignupSuccess={handleAuthSuccess} />
                )}
                <p className="switch">
                  {isLogin ? (
                    <>
                      Don't have an account?{" "}
                      <span onClick={() => setIsLogin(false)}>Sign Up</span>
                    </>
                  ) : (
                    <>
                      Already have an account?{" "}
                      <span onClick={() => setIsLogin(true)}>Login</span>
                    </>
                  )}
                </p>
                <div className="text-center mt-4" style={{ paddingTop: "1rem", borderTop: "1px solid rgba(0,0,0,0.1)", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <button
                    onClick={() => {
                      localStorage.setItem('isGuest', 'true');
                      window.location.href = "/dashboard";
                    }}
                    style={{
                      background: "transparent",
                      border: "2px solid #0078C8",
                      color: "#0078C8",
                      padding: "0.5rem 1.5rem",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontWeight: 600,
                      fontSize: "0.9rem",
                      transition: "all 0.2s ease"
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = "#0078C8";
                      e.target.style.color = "#fff";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = "transparent";
                      e.target.style.color = "#0078C8";
                    }}
                  >
                    Continue as Guest
                  </button>
                  <button
                    onClick={() => navigate("/")}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "rgba(0,0,0,0.6)",
                      padding: "0.5rem 0",
                      cursor: "pointer",
                      fontWeight: 500,
                      fontSize: "0.875rem",
                      textDecoration: "underline"
                    }}
                  >
                    Return to Home
                  </button>
                </div>
              </div>
            </div>
          } 
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <div className="dashboard-shell">
      <Navbar onLogout={handleLogout} />
      <OnboardingTutorial />
      <main className="dashboard-content">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route
            path="/dashboard"
            element={
              <Dashboard
                userEmail={userProfile?.email}
                preferredName={userProfile?.preferredName}
                selectedCourse={selectedCourse}
                pinnedCourses={pinnedCourses}
                onStartPractice={() => {
                  const course = practiceFallbackCourse;
                  if (course?.id) {
                    navigate(`/practice/${course.id}`);
                  } else {
                    navigate("/courses");
                  }
                }}
                onBrowseCourses={() => navigate("/courses")}
                onOpenCourse={handleFeaturedCourseOpen}
              />
            }
          />
          <Route
            path="/courses"
            element={
              <Courses
                selectedCourse={selectedCourse}
                onSelectCourse={handleCourseSelectFromGrid}
                favoriteCourseIds={favoriteCourseIds ?? []}
                onToggleFavorite={toggleFavoriteCourse}
              />
            }
          />
          <Route
            path="/course/:courseId"
            element={
              <CourseOptions
                userProfile={userProfile}
                onSelectCourse={syncCourseSelection}
              />
            }
          />
          <Route
            path="/practice"
            element={
              <Practice
                selectedCourse={selectedCourse}
                onEnsureCourseSelection={ensureCourseSelectionNoPersist}
                onBackToDashboard={() => navigate("/dashboard")}
                userProfile={userProfile}
              />
            }
          />
          <Route
            path="/practice/:courseId"
            element={
              <Practice
                selectedCourse={selectedCourse}
                onEnsureCourseSelection={syncCourseSelection}
                onBackToDashboard={() => navigate("/dashboard")}
                userProfile={userProfile}
              />
            }
          />
          <Route path="/stats" element={<Stats stats={userProfile?.stats} userProfile={userProfile} />} />
          <Route path="/calendar" element={<StudyCalendar />} />
          <Route path="/community" element={<Community userProfile={userProfile} />} />
          <Route path="/flashcards" element={<Flashcards userProfile={userProfile} />} />
          <Route path="/practice-test/:courseId" element={<PracticeTest userProfile={userProfile} />} />
          <Route path="/settings" element={<Settings userProfile={userProfile} />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <VoiceProvider>
        <AppContent />
      </VoiceProvider>
    </ThemeProvider>
  );
}

export default App;
