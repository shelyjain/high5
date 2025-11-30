import { useEffect, useState } from 'react';
import { listFlashcards, deleteFlashcard, updateFlashcard } from '../utils/api.js';
import './FlashcardGame.css';

function FlashcardList({ refreshKey, userId, onFoldersChange }) {
  const [cards, setCards] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFolderForm, setShowFolderForm] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('all');

  useEffect(()=>{ refresh(); },[refreshKey]);

  async function refresh() {
    setLoading(true);
    try { 
      const allCards = await listFlashcards(userId);
      setCards(allCards);
      
      // Extract unique folders from cards - this is the source of truth
      const uniqueFolders = [...new Set(allCards.map(card => card.folder).filter(Boolean))].sort();
      setFolders(uniqueFolders);
      onFoldersChange?.(uniqueFolders);
    } catch(e){ 
      alert(e.message);
    } finally{ 
      setLoading(false);
    } 
  }

  async function handleDelete(id){ 
    if(!window.confirm('Delete this flashcard?')) return; 
    await deleteFlashcard(id, userId); 
    setCards(c=>c.filter(card=>card.id!==id)); 
  }

  async function handleMoveToFolder(cardId, folderName) {
    try {
      await updateFlashcard(cardId, { folder: folderName }, userId);
      setCards(cards.map(card => 
        card.id === cardId ? { ...card, folder: folderName } : card
      ));
    } catch (e) {
      alert(e.message);
    }
  }

  async function createFolder() {
    if (!newFolderName.trim()) return;
    // Folders are automatically created when flashcards are added to them
    // This just adds the folder name to the local list for display purposes
    const trimmedName = newFolderName.trim();
    if (!folders.includes(trimmedName)) {
      setFolders([...folders, trimmedName]);
    }
    setNewFolderName('');
    setShowFolderForm(false);
  }

  const filteredCards = selectedFolder === 'all' 
    ? cards 
    : cards.filter(card => card.folder === selectedFolder);

  if(loading) return (
    <div style={styles.loadingContainer}>
      <div style={styles.spinner}></div>
      <p style={styles.loadingText}>Loading flashcards...</p>
    </div>
  );
  
  if(!cards.length) return (
    <div style={styles.emptyContainer}>
      <div style={styles.emptyIcon}>📚</div>
      <h3 style={styles.emptyTitle}>No flashcards yet</h3>
      <p style={styles.emptyText}>Create your first flashcard to get started!</p>
    </div>
  );

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Your Flashcards</h2>
        <p style={styles.subtitle}>{filteredCards.length} card{filteredCards.length !== 1 ? 's' : ''} in {selectedFolder === 'all' ? 'all folders' : selectedFolder}</p>
      </div>

      {/* Folder Management */}
      <div style={styles.folderSection}>
        <div style={styles.folderHeader}>
          <h3 style={styles.folderTitle}>Folders</h3>
          <button 
            onClick={() => setShowFolderForm(!showFolderForm)}
            style={styles.addFolderButton}
          >
            Add Folder
          </button>
        </div>

        {showFolderForm && (
          <div style={styles.folderForm}>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name..."
              style={styles.folderInput}
              onKeyPress={(e) => e.key === 'Enter' && createFolder()}
            />
            <button onClick={createFolder} style={styles.createButton}>
              Create
            </button>
            <button onClick={() => setShowFolderForm(false)} style={styles.cancelButton}>
              Cancel
            </button>
          </div>
        )}

        <div style={styles.folderTabs}>
          <button 
            style={{
              ...styles.folderTab,
              ...(selectedFolder === 'all' ? styles.activeFolderTab : {})
            }}
            onClick={() => setSelectedFolder('all')}
          >
            All Cards ({cards.length})
          </button>
          {folders.map(folder => (
            <button
              key={folder}
              style={{
                ...styles.folderTab,
                ...(selectedFolder === folder ? styles.activeFolderTab : {})
              }}
              onClick={() => setSelectedFolder(folder)}
            >
              {folder} ({cards.filter(c => c.folder === folder).length})
            </button>
          ))}
        </div>
      </div>
      
      <div className="flashcard-row">
        {filteredCards.length === 0 ? (
          <div className="flashcard-card" style={{ opacity: 0.6 }}>
            <div style={styles.cardWrapper}>
              <div style={styles.flashcardContent}>
                <h4 className="flashcard-question">This is what your flashcard will look like</h4>
                <p className="flashcard-answer">The definition or answer will appear here</p>
                <div className="flashcard-meta">
                  <span className="flashcard-folder">
                    {selectedFolder === 'all' ? 'No Folder' : selectedFolder}
                  </span>
                  <span className="flashcard-date">
                    {new Date().toLocaleDateString()}
                  </span>
                </div>
              </div>
              
              <div style={styles.cardActions}>
                <select 
                  disabled
                  style={{...styles.folderSelect, opacity: 0.5}}
                >
                  <option value="">No Folder</option>
                </select>
                
                <button 
                  disabled
                  style={{...styles.deleteButton, opacity: 0.5, cursor: 'not-allowed'}}
                  title="Delete flashcard"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        ) : (
          filteredCards.map(card => (
            <div key={card.id} className="flashcard-card">
              <div style={styles.cardWrapper}>
                <div style={styles.flashcardContent}>
                  <h4 className="flashcard-question">{card.question}</h4>
                  <p className="flashcard-answer">{card.answer}</p>
                  <div className="flashcard-meta">
                    <span className="flashcard-folder">
                      {card.folder || 'No Folder'}
                    </span>
                    <span className="flashcard-date">
                      {new Date(card.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                <div style={styles.cardActions}>
                  <select 
                    value={card.folder || ''} 
                    onChange={(e) => handleMoveToFolder(card.id, e.target.value)}
                    style={styles.folderSelect}
                  >
                    <option value="">No Folder</option>
                    {folders.map(folder => (
                      <option key={folder} value={folder}>{folder}</option>
                    ))}
                  </select>
                  
                  <button 
                    onClick={() => handleDelete(card.id)} 
                    style={styles.deleteButton}
                    title="Delete flashcard"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    width: '100%',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 2rem 2rem 2rem',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'auto',
    boxSizing: 'border-box',
  },
  header: {
    textAlign: 'left',
    marginBottom: '1.5rem',
  },
  title: {
    fontSize: '2rem',
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
  folderSection: {
    marginBottom: '1rem',
    padding: '1.5rem',
    background: 'var(--bg-primary)',
    border: '2px solid var(--border-color)',
    borderRadius: '1rem',
    boxShadow: '0 4px 12px var(--shadow-color)',
  },
  folderHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  folderTitle: {
    fontSize: '1.2rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
    margin: '0',
  },
  addFolderButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 1rem',
    background: 'linear-gradient(135deg, #0078C8 0%, #005fa3 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '0.5rem',
    fontSize: '0.9rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 2px 8px rgba(0, 120, 200, 0.3)',
  },
  folderForm: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '1rem',
    alignItems: 'center',
  },
  folderInput: {
    flex: 1,
    padding: '0.75rem',
    border: '2px solid var(--border-color)',
    borderRadius: '0.5rem',
    fontSize: '1rem',
    background: 'var(--input-bg)',
    color: 'var(--input-text)',
  },
  createButton: {
    padding: '0.75rem 1rem',
    background: 'linear-gradient(135deg, #0078C8 0%, #005fa3 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '0.5rem',
    fontSize: '0.9rem',
    fontWeight: '500',
    cursor: 'pointer',
  },
  cancelButton: {
    padding: '0.75rem 1rem',
    background: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
    border: '2px solid var(--border-color)',
    borderRadius: '0.5rem',
    fontSize: '0.9rem',
    fontWeight: '500',
    cursor: 'pointer',
  },
  folderTabs: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
  },
  folderTab: {
    padding: '0.5rem 1rem',
    background: 'var(--bg-primary)',
    color: 'var(--text-secondary)',
    border: '2px solid var(--border-color)',
    borderRadius: '0.5rem',
    fontSize: '0.9rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  activeFolderTab: {
    background: 'linear-gradient(135deg, #0078C8 0%, #005fa3 100%)',
    color: 'white',
    borderColor: '#0078C8',
  },
  cardWrapper: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    width: '100%',
    maxWidth: '600px',
    margin: '0 auto',
    boxSizing: 'border-box',
  },
  flashcardContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    minHeight: '150px',
    overflow: 'hidden',
    width: '100%',
    boxSizing: 'border-box',
    minWidth: 0,
  },
  cardActions: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '1rem',
  },
  folderSelect: {
    flex: 1,
    padding: '0.5rem',
    border: '2px solid var(--border-color)',
    borderRadius: '0.5rem',
    background: 'var(--input-bg)',
    color: 'var(--input-text)',
    fontSize: '0.9rem',
  },
  deleteButton: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: '#ef4444',
    color: 'white',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)',
  },
  buttonIcon: {
    fontSize: '1rem',
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

export default FlashcardList;
