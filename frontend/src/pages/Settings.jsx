import React, { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import { useVoice } from "../context/ThemeContext";
import { auth, db } from "../firebase";
import { updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import "./Settings.css";

export default function Settings({ userProfile }) {
  const { resolvedTheme, toggleTheme, theme } = useTheme();
  const { selectedVoice, availableVoices, changeVoice, getVoiceDescription } = useVoice();
  const [screenName, setScreenName] = useState(userProfile?.preferredName || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(false);
  const [voiceMessage, setVoiceMessage] = useState("");

  const handleUpdateScreenName = async (e) => {
    e.preventDefault();
    if (!screenName.trim()) {
      setMessage("Screen name cannot be empty");
      setMessageType("error");
      return;
    }

    setLoading(true);
    try {
      const user = auth.currentUser;
      if (user && userProfile?.uid) {
        await updateProfile(user, {
          displayName: screenName,
        });

        await updateDoc(doc(db, "users", userProfile.uid), {
          preferredName: screenName,
        });

        setMessage("Screen name updated successfully!");
        setMessageType("success");
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`);
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      setMessage("All password fields are required");
      setMessageType("error");
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage("New passwords do not match");
      setMessageType("error");
      return;
    }

    if (newPassword.length < 6) {
      setMessage("New password must be at least 6 characters");
      setMessageType("error");
      return;
    }

    setLoading(true);
    try {
      const user = auth.currentUser;
      if (user && user.email) {
        const credential = EmailAuthProvider.credential(
          user.email,
          currentPassword
        );
        await reauthenticateWithCredential(user, credential);

        await updatePassword(user, newPassword);

        setMessage("Password changed successfully!");
        setMessageType("success");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (error) {
      if (error.code === "auth/wrong-password") {
        setMessage("Current password is incorrect");
      } else {
        setMessage(`Error: ${error.message}`);
      }
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceChange = (e) => {
    const voiceName = e.target.value;
    changeVoice(voiceName);
    setVoiceMessage("Voice updated successfully!");
    setTimeout(() => setVoiceMessage(""), 3000);
  };

  const handlePlayVoiceSample = () => {
    if (!window.speechSynthesis || !selectedVoice) {
      alert('Text-to-speech is not supported in this browser.');
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance("Yo, check out this voice! It sounds amazing!");
    utterance.voice = selectedVoice;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <section style={styles.wrapper}>
      <header style={styles.header}>
        <h1 style={styles.title}>Settings</h1>
        <p style={styles.subtitle}>Manage your account and preferences</p>
      </header>

      {message && (
        <div style={{
          ...styles.message,
          ...(messageType === "success" ? styles.messageSuccess : styles.messageError),
        }}>
          {message}
        </div>
      )}

      <div style={styles.settingsGrid}>
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Screen Name</h2>
          <form onSubmit={handleUpdateScreenName}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Display Name</label>
              <input
                type="text"
                value={screenName}
                onChange={(e) => setScreenName(e.target.value)}
                placeholder="Enter your screen name"
                style={styles.input}
                disabled={loading}
              />
              <p style={styles.helperText}>
                This is the name displayed on your dashboard
              </p>
            </div>
            <button type="submit" style={styles.button} disabled={loading}>
              {loading ? "Updating..." : "Update Screen Name"}
            </button>
          </form>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Change Password</h2>
          <form onSubmit={handleChangePassword}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                style={styles.input}
                disabled={loading}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                style={styles.input}
                disabled={loading}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                style={styles.input}
                disabled={loading}
              />
            </div>
            <button type="submit" style={styles.button} disabled={loading}>
              {loading ? "Changing..." : "Change Password"}
            </button>
          </form>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Text-to-Speech Voice</h2>
          {voiceMessage && (
            <div style={{
              ...styles.voiceMessage,
              ...styles.messageSuccess,
            }}>
              {voiceMessage}
            </div>
          )}
          <div style={styles.formGroup}>
            <label style={styles.label}>Select Voice</label>
            <select
              value={selectedVoice?.name || ""}
              onChange={handleVoiceChange}
              style={styles.select}
            >
              {availableVoices.map((voice) => (
                <option key={voice.name} value={voice.name}>
                  {getVoiceDescription(voice.name)}
                </option>
              ))}
            </select>
            <p style={styles.helperText}>
              {selectedVoice && `Now reading as: ${getVoiceDescription(selectedVoice.name)}`}
            </p>
          </div>
          <button
            onClick={handlePlayVoiceSample}
            style={{
              ...styles.button,
            }}
          >
            Test Voice
          </button>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Appearance</h2>
          <div style={styles.themeContainer}>
            <div style={styles.themeSetting}>
              <div>
                <p style={styles.themeLabel}>Dark Mode</p>
                <p style={styles.themeDescription}>
                  Current: {theme === "system" ? `System (${resolvedTheme})` : resolvedTheme}
                </p>
              </div>
              <button
                onClick={toggleTheme}
                style={{
                  ...styles.themeButton,
                  ...(resolvedTheme === "dark" ? styles.themeButtonActive : {}),
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
                {resolvedTheme === "dark" ? "Enabled" : "Disabled"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const styles = {
  wrapper: {
    backgroundColor: "var(--bg-secondary)",
    borderRadius: "1.5rem",
    padding: "3rem 5rem",
    boxShadow: "0 20px 40px var(--shadow-color), 0 0 0 1px var(--border-color)",
    width: "100%",
    maxWidth: "1400px",
    margin: "0 auto",
    boxSizing: "border-box",
    color: "var(--text-primary)",
    transition: "all 0.3s ease",
    backdropFilter: "blur(10px)",
  },
  header: {
    marginBottom: "2rem",
  },
  title: {
    fontSize: "2.5rem",
    fontWeight: 800,
    color: "var(--text-primary)",
    margin: 0,
    transition: "color 0.3s ease",
    background: "linear-gradient(135deg, var(--text-primary) 0%, #0078C8 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },
  subtitle: {
    fontSize: "1rem",
    color: "var(--text-secondary)",
    margin: "0.5rem 0 0 0",
    transition: "color 0.3s ease",
  },
  message: {
    padding: "1rem",
    borderRadius: "0.75rem",
    marginBottom: "1.5rem",
    fontSize: "0.95rem",
    fontWeight: 500,
  },
  messageSuccess: {
    backgroundColor: "rgba(76, 175, 80, 0.1)",
    color: "#4CAF50",
    border: "1px solid rgba(76, 175, 80, 0.3)",
  },
  messageError: {
    backgroundColor: "rgba(255, 87, 87, 0.1)",
    color: "#FF5757",
    border: "1px solid rgba(255, 87, 87, 0.3)",
  },
  settingsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
    gap: "2rem",
  },
  section: {
    backgroundColor: "var(--bg-primary)",
    borderRadius: "1rem",
    padding: "1.75rem",
    border: "1px solid var(--border-color)",
    transition: "background-color 0.3s ease, border-color 0.3s ease",
  },
  sectionTitle: {
    fontSize: "1.25rem",
    fontWeight: 700,
    color: "var(--text-primary)",
    margin: "0 0 1.5rem 0",
    transition: "color 0.3s ease",
  },
  formGroup: {
    marginBottom: "1.25rem",
  },
  label: {
    display: "block",
    fontSize: "0.95rem",
    fontWeight: 600,
    color: "var(--text-primary)",
    marginBottom: "0.5rem",
    transition: "color 0.3s ease",
  },
  input: {
    width: "100%",
    padding: "0.75rem",
    border: "1px solid var(--input-border)",
    borderRadius: "0.5rem",
    backgroundColor: "var(--input-bg)",
    color: "var(--input-text)",
    fontSize: "1rem",
    boxSizing: "border-box",
    transition: "background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease",
  },
  helperText: {
    fontSize: "0.85rem",
    color: "var(--text-secondary)",
    margin: "0.5rem 0 0 0",
    transition: "color 0.3s ease",
  },
  button: {
    width: "100%",
    padding: "0.9rem",
    backgroundColor: "#0078C8",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "0.5rem",
    fontWeight: 600,
    fontSize: "1rem",
    cursor: "pointer",
    transition: "background-color 0.2s ease, opacity 0.2s ease",
  },
  themeContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem",
  },
  themeSetting: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "1rem",
    backgroundColor: "var(--bg-secondary)",
    borderRadius: "0.75rem",
    border: "1px solid var(--border-color)",
    transition: "background-color 0.3s ease, border-color 0.3s ease",
  },
  themeLabel: {
    fontSize: "1rem",
    fontWeight: 600,
    color: "var(--text-primary)",
    margin: 0,
    transition: "color 0.3s ease",
  },
  themeDescription: {
    fontSize: "0.85rem",
    color: "var(--text-secondary)",
    margin: "0.25rem 0 0 0",
    transition: "color 0.3s ease",
  },
  themeButton: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.6rem 1.2rem",
    backgroundColor: "var(--bg-primary)",
    color: "var(--text-primary)",
    border: "1px solid var(--border-color)",
    borderRadius: "0.5rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s ease",
    whiteSpace: "nowrap",
  },
  themeButtonActive: {
    backgroundColor: "#0078C8",
    color: "#FFFFFF",
    borderColor: "#0078C8",
  },
  voiceMessage: {
    padding: "0.75rem",
    borderRadius: "0.5rem",
    marginBottom: "1.25rem",
    fontSize: "0.9rem",
    fontWeight: 500,
  },
  select: {
    width: "100%",
    padding: "0.75rem",
    border: "1px solid var(--input-border)",
    borderRadius: "0.5rem",
    backgroundColor: "var(--input-bg)",
    color: "var(--input-text)",
    fontSize: "1rem",
    boxSizing: "border-box",
    appearance: "none",
    backgroundImage: "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0iI2ZmZiIgZD0iTTcgMTBsNSA1IDUtNS01eiIvPjwvc3ZnPg==')",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 0.75rem center",
    backgroundSize: "1.5em",
    cursor: "pointer",
    transition: "background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease",
  },
};
