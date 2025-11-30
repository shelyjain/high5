import { useEffect, useState, useCallback } from 'react';
import { useTheme } from '../context/ThemeContext';
import { getRandomStudyFlashcards, getStudyFlashcardsByFolder, getAllFolders } from '../utils/api.js';
import './FlashcardGame.css';

function FlashcardGame({ userId }) {
  const { resolvedTheme } = useTheme();
  const [cards, setCards] = useState([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState('all');

  useEffect(()=>{ loadFolders(); },[userId]);

  const loadFolders = async () => {
    try {
      const folderList = await getAllFolders(userId);
      console.log('Folders loaded:', folderList);
      setFolders(folderList);
    } catch(e) {
      console.error('Failed to load folders:', e);
    }
  };

  const load = async (folder = 'all') => {
    console.log(`Loading cards for folder: ${folder}`);
    setLoading(true);
    try { 
      let data;
      if (folder === 'all') {
        console.log('Fetching all flashcards');
        data = await getRandomStudyFlashcards(10, userId);
      } else {
        console.log(`Fetching flashcards from folder: ${folder}`);
        data = await getStudyFlashcardsByFolder(folder, 10, userId);
      }
      console.log(`Received ${data.length} cards`);
      setCards(data); 
      setIndex(0); 
      setFlipped(false);
      setSelectedFolder(folder);
    } catch(e) {
      console.error('Error loading cards:', e);
      alert(e.message);
    } finally {
      setLoading(false);
    } 
  };

  useEffect(() => {
    if (userId) {
      load('all');
    }
  }, [userId]);

  const next = useCallback(()=>{ 
    if(index<cards.length-1){ 
      setIndex(i=>i+1); 
      setFlipped(false);
    } 
  },[index,cards.length]);
  
  const prev = useCallback(()=>{ 
    if(index>0){ 
      setIndex(i=>i-1); 
      setFlipped(false);
    } 
  },[index]);

  useEffect(()=>{
    const handleKey=e=>{
      if(e.code==='Space'){e.preventDefault();setFlipped(f=>!f);} 
      else if(e.code==='ArrowRight'){next();} 
      else if(e.code==='ArrowLeft'){prev();}
    };
    window.addEventListener('keydown',handleKey); 
    return ()=>window.removeEventListener('keydown',handleKey);
  },[next,prev]);

  if(loading) return (
    <div style={styles.loadingContainer}>
      <div style={styles.spinner}></div>
      <p style={styles.loadingText}>Loading study cards...</p>
    </div>
  );
  
  if(!cards.length) return (
    <div style={styles.emptyContainer}>
      <div style={styles.emptyIcon}>🎯</div>
      <h3 style={styles.emptyTitle}>No flashcards to study</h3>
      <p style={styles.emptyText}>Create some flashcards first to start studying!</p>
    </div>
  );
  
  const current=cards[index];

  return(
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      minHeight: 'calc(100vh - 200px)',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0',
    }}>
      <div style={{
        ...styles.container,
        backgroundColor: resolvedTheme === 'dark' ? '#1A1A1A' : '#E2E8F0',
        flex: 1,
      }}>
        <div style={styles.header}>
          <h2 style={styles.title}>Study Mode</h2>
          <div style={styles.folderSelector}>
            <div style={styles.folderOptions}>
              <button
                onClick={() => load('all')}
                style={{
                  ...styles.folderButton,
                  ...(selectedFolder === 'all' ? styles.activeFolderButton : {})
                }}
              >
                All Folders
              </button>
              {folders.map(folder => (
                <button
                  key={folder}
                  onClick={() => load(folder)}
                  style={{
                    ...styles.folderButton,
                    ...(selectedFolder === folder ? styles.activeFolderButton : {})
                  }}
                >
                  {folder}
                </button>
              ))}
            </div>
          </div>
          <div style={styles.progressContainer}>
            <div style={styles.progressBar}>
              <div style={{
                ...styles.progressFill,
                width: `${((index + 1) / cards.length) * 100}%`
              }}></div>
            </div>
            <p style={styles.progressText}>{index + 1} / {cards.length}</p>
          </div>
        </div>

        <div style={styles.cardContainer}>
          <div className={`flashcard-container ${flipped?'flashcard is-flipped':''}`} onClick={()=>setFlipped(f=>!f)}>
            <div className="flashcard-inner">
              <div className="flashcard-face front">{current.question}</div>
              <div className="flashcard-face back">{current.answer}</div>
            </div>
          </div>
        </div>

        <div style={styles.navigation}>
          <button 
            onClick={prev} 
            disabled={index===0} 
            style={{
              ...styles.navButton,
              ...styles.prevButton,
              ...(index===0 ? styles.disabledButton : {})
            }}
          >
            Previous
          </button>
          
          <button 
            onClick={()=>setFlipped(f=>!f)} 
            style={styles.navButton}
            title="Click or press Space to flip"
          >
            Flip Card
          </button>
          
          <button 
            onClick={next} 
            disabled={index===cards.length-1} 
            style={{
              ...styles.navButton,
              ...styles.nextButton,
              ...(index===cards.length-1 ? styles.disabledButton : {})
            }}
          >
            Next
          </button>
        </div>
      </div>

      <div style={styles.footer}>
        <button onClick={() => load(selectedFolder)} style={styles.refreshButton}>
          New Study Session
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    width: '95%',
    maxWidth: '1100px',
    margin: '0 auto',
    marginLeft: '-10px',
    padding: '1.5rem 1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderRadius: '1.5rem',
    minHeight: '80vh',
    background: 'var(--bg-primary)',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(59, 130, 255, 0.2)',
  },
  header: {
    textAlign: 'center',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  title: {
    fontSize: '2rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    margin: '0 0 1rem 0',
    background: 'linear-gradient(135deg, #0078C8 0%, #005fa3 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    textAlign: 'center',
  },
  folderSelector: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '1.5rem',
    width: '100%',
  },
  folderLabel: {
    fontSize: '1rem',
    color: 'var(--text-secondary)',
    fontWeight: '500',
    textAlign: 'center',
  },
  folderOptions: {
    display: 'flex',
    gap: '0.75rem',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '100%',
  },
  folderButton: {
    padding: '0.5rem 1rem',
    border: '2px solid var(--border-color)',
    borderRadius: '0.75rem',
    fontSize: '0.9rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    backgroundColor: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
  },
  activeFolderButton: {
    background: 'linear-gradient(135deg, #0078C8 0%, #005fa3 100%)',
    color: 'white',
    borderColor: 'transparent',
  },
  progressContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
    width: '100%',
  },
  progressBar: {
    width: '100%',
    maxWidth: '300px',
    height: '8px',
    backgroundColor: 'var(--border-color)',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(135deg, #0078C8 0%, #005fa3 100%)',
    borderRadius: '4px',
    transition: 'width 0.3s ease',
  },
  progressText: {
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
    margin: '0',
    fontWeight: '500',
    textAlign: 'center',
  },
  cardContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1.5rem',
    width: '100%',
    maxWidth: '500px',
  },
  cardActions: {
    display: 'flex',
    justifyContent: 'center',
  },
  flipButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1rem',
    backgroundColor: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
    border: '2px solid var(--border-color)',
    borderRadius: '0.75rem',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    position: 'absolute',
    top: '50%',
    right: '-120px',
    transform: 'translateY(-50%)',
    zIndex: '10',
    whiteSpace: 'nowrap',
    width: '110px',
    flexDirection: 'column',
  },
  flipButtonText: {
    fontSize: '0.85rem',
  },
  navigation: {
    display: 'flex',
    justifyContent: 'center',
    gap: '1rem',
    width: '100%',
    marginTop: '3rem',
  },
  navButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1.5rem',
    border: '2px solid var(--border-color)',
    borderRadius: '0.75rem',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    flex: '1',
    maxWidth: '140px',
    backgroundColor: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
  },
  prevButton: {
    backgroundColor: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
    border: '2px solid var(--border-color)',
  },
  nextButton: {
    background: 'linear-gradient(135deg, #0078C8 0%, #005fa3 100%)',
    color: 'white',
    border: '2px solid transparent',
  },
  disabledButton: {
    opacity: '0.5',
    cursor: 'not-allowed',
  },
  buttonIcon: {
    fontSize: '1.1rem',
  },
  keyHint: {
    fontSize: '0.8rem',
    opacity: '0.7',
    fontWeight: '400',
  },
  footer: {
    display: 'flex',
    justifyContent: 'center',
    width: '100%',
    padding: '0.75rem',
    marginTop: '0.5rem',
  },
  refreshButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: '0.5rem 1rem',
    backgroundColor: 'transparent',
    color: 'var(--text-secondary)',
    border: '2px solid var(--border-color)',
    borderRadius: '0.75rem',
    fontSize: '0.9rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4rem 2rem',
    gap: '1rem',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid var(--border-color)',
    borderTop: '4px solid #0078C8',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    fontSize: '1.1rem',
    color: 'var(--text-secondary)',
    margin: '0',
    fontWeight: '500',
  },
  emptyContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4rem 2rem',
    textAlign: 'center',
    gap: '1rem',
  },
  emptyIcon: {
    fontSize: '4rem',
    opacity: '0.6',
  },
  emptyTitle: {
    fontSize: '1.5rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
    margin: '0',
  },
  emptyText: {
    fontSize: '1rem',
    color: 'var(--text-secondary)',
    margin: '0',
    maxWidth: '300px',
  },
};

export default FlashcardGame;
