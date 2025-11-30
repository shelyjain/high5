import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { createFlashcard } from '../utils/api.js';

function FlashcardForm({ onCreated, userId, folders = [] }) {
  const { resolvedTheme } = useTheme();
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [folder, setFolder] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) return;
    
    setLoading(true);
    try {
      const newCard = await createFlashcard(question.trim(), answer.trim(), userId, folder.trim() || null);
      setQuestion('');
      setAnswer('');
      setFolder('');
      onCreated?.(newCard);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      ...styles.container,
      backgroundColor: resolvedTheme === 'dark' ? '#1A1A1A' : '#E2E8F0',
    }}>
      <div style={styles.header}>
        <h2 style={styles.title}>Create New Flashcard</h2>
        <p style={styles.subtitle}>Add a new question and answer to your collection</p>
      </div>
      
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.inputGroup}>
          <label style={styles.label}>
            Word
          </label>
          <input 
            value={question} 
            onChange={(e)=>setQuestion(e.target.value)} 
            style={styles.input}
            placeholder="Enter your word here..."
            disabled={loading}
          />
        </div>
        
        <div style={styles.inputGroup}>
          <label style={styles.label}>
            Definition
          </label>
          <textarea 
            value={answer} 
            onChange={(e)=>setAnswer(e.target.value)} 
            style={styles.textarea}
            rows="4"
            placeholder="Enter the definition here..."
            disabled={loading}
          />
        </div>
        
        <div style={styles.inputGroup}>
          <label style={styles.label}>
            Folder (Optional)
          </label>
          <select 
            value={folder} 
            onChange={(e)=>setFolder(e.target.value)} 
            style={styles.select}
            disabled={loading}
          >
            <option value="">No Folder</option>
            {folders.map(folderName => (
              <option key={folderName} value={folderName}>{folderName}</option>
            ))}
          </select>
        </div>
        
        <button 
          type="submit" 
          disabled={loading || !question.trim() || !answer.trim()} 
          style={{
            ...styles.submitButton,
            ...(loading || !question.trim() || !answer.trim() ? styles.disabledButton : {})
          }}
        >
          {loading ? (
            <>
              <div style={styles.buttonSpinner}></div>
              Creating...
            </>
          ) : (
            <>
              Add Flashcard
            </>
          )}
        </button>
      </form>
    </div>
  );
}

const styles = {
  container: {
    width: '100%',
    maxWidth: '600px',
    margin: '0 auto',
    padding: '2rem',
    backgroundColor: '#1A1A1A',
    borderRadius: '1.5rem',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)',
    border: '1px solid var(--border-color)',
  },
  header: {
    textAlign: 'center',
    marginBottom: '2rem',
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    margin: '0 0 0.5rem 0',
    background: 'linear-gradient(135deg, #0078C8 0%, #005fa3 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subtitle: {
    fontSize: '1rem',
    color: 'var(--text-secondary)',
    margin: '0',
    fontWeight: '500',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  label: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '1rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
  },
  labelIcon: {
    fontSize: '1.2rem',
  },
  input: {
    width: '100%',
    padding: '1rem',
    border: '2px solid var(--border-color)',
    borderRadius: '0.75rem',
    fontSize: '1rem',
    backgroundColor: 'var(--input-bg)',
    color: 'var(--input-text)',
    transition: 'all 0.3s ease',
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    padding: '1rem',
    border: '2px solid var(--border-color)',
    borderRadius: '0.75rem',
    fontSize: '1rem',
    backgroundColor: 'var(--input-bg)',
    color: 'var(--input-text)',
    transition: 'all 0.3s ease',
    resize: 'vertical',
    minHeight: '100px',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  submitButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: '1rem 2rem',
    background: 'linear-gradient(135deg, #0078C8 0%, #005fa3 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '0.75rem',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(0, 120, 200, 0.3)',
    marginTop: '0.5rem',
  },
  select: {
    width: '100%',
    padding: '1rem',
    border: '2px solid var(--border-color)',
    borderRadius: '0.75rem',
    fontSize: '1rem',
    backgroundColor: 'var(--input-bg)',
    color: 'var(--input-text)',
    transition: 'all 0.3s ease',
    boxSizing: 'border-box',
  },
  disabledButton: {
    opacity: '0.6',
    cursor: 'not-allowed',
    boxShadow: 'none',
  },
  buttonIcon: {
    fontSize: '1.1rem',
  },
  buttonSpinner: {
    width: '16px',
    height: '16px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderTop: '2px solid white',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
};

export default FlashcardForm;
