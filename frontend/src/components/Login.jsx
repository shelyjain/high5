import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase";
import {
  findCourseByName,
  getCourseById,
  sanitizeFavoriteCourseIds,
} from "../data/apCourses";

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const credential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = credential.user;
      const userRef = doc(db, "users", user.uid);
      const snapshot = await getDoc(userRef);

      const defaultStats = { totalQuestions: 0, correct: 0, streak: 0 };
      let profileData;

      if (snapshot.exists()) {
        const data = snapshot.data();
        const normalizedSelection = normalizeSelectedCourse(
          data.selectedCourse
        );
        const favoriteCourses = sanitizeFavoriteCourseIds(
          data.favoriteCourses
        );

        const mergedProfile = {
          uid: user.uid,
          email: data.email ?? user.email ?? email,
          preferredName: data.preferredName || null,
          selectedCourse: normalizedSelection,
          stats: data.stats ?? defaultStats,
          favoriteCourses,
        };

        const updates = {};
        if (!data.email && user.email) updates.email = user.email;
        if (!data.stats) updates.stats = defaultStats;
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

        profileData = mergedProfile;
      } else {
        const defaultProfile = {
          email: user.email ?? email,
          selectedCourse: null,
          stats: defaultStats,
          favoriteCourses: [],
          createdAt: serverTimestamp(),
        };
        await setDoc(userRef, defaultProfile);
        profileData = {
          uid: user.uid,
          email: defaultProfile.email,
          preferredName: null,
          selectedCourse: null,
          stats: defaultStats,
          favoriteCourses: [],
        };
      }

      if (onLoginSuccess) onLoginSuccess(profileData);
      setMsg("Login successful! 🎉");
      setEmail("");
      setPassword("");
    } catch (err) {
      console.error("Login error:", err);
      console.error("Error code:", err.code);
      console.error("Error message:", err.message);
      
      // More specific error messages
      switch (err.code) {
        case 'auth/user-not-found':
          setMsg("No account found with this email address");
          break;
        case 'auth/wrong-password':
          setMsg("Incorrect password");
          break;
        case 'auth/invalid-email':
          setMsg("Invalid email address");
          break;
        default:
          setMsg(err.message || "Login failed. Please try again.");
      }
    }
  };

  return (
    <form onSubmit={handleLogin} className="form">
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <div style={{ position: 'relative' }}>
        <input
          type={showPassword ? "text" : "password"}
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.875rem',
          color: 'rgba(0, 0, 0, 0.6)',
          cursor: 'pointer',
          marginTop: '0.5rem',
          marginLeft: '0.25rem'
        }}>
          <input
            type="checkbox"
            checked={showPassword}
            onChange={(e) => setShowPassword(e.target.checked)}
            style={{
              cursor: 'pointer',
              width: '16px',
              height: '16px'
            }}
          />
          Show password
        </label>
      </div>
      <button type="submit">Login</button>
      {msg && <p className="msg">{msg}</p>}
    </form>
  );
}
