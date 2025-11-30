import {
  getAllFlashcards,
  addFlashcard,
  updateFlashcard,
  deleteFlashcard,
  getRandomFlashcards
} from '../services/flashcardStorage.js';

export async function listFlashcards(req, res) {
  try {
    const userId = req.user?.uid; // Get user ID from authenticated request
    if (!userId) {
      return res.status(401).json({ error: 'unauthorized', message: 'User authentication required' });
    }
    
    const cards = await getAllFlashcards(userId);
    res.json(cards);
  } catch (e) {
    console.error('List flashcards failed', e);
    res.status(500).json({ error: 'list_failed', message: e.message });
  }
}

export async function createFlashcard(req, res) {
  try {
    const userId = req.user?.uid; // Get user ID from authenticated request
    if (!userId) {
      return res.status(401).json({ error: 'unauthorized', message: 'User authentication required' });
    }
    
    const { question, answer, folder } = req.body ?? {};
    const card = await addFlashcard({ question, answer, userId, folder });
    res.status(201).json(card);
  } catch (e) {
    res.status(400).json({ error: 'create_failed', message: e.message });
  }
}

export async function editFlashcard(req, res) {
  try {
    const userId = req.user?.uid; // Get user ID from authenticated request
    if (!userId) {
      return res.status(401).json({ error: 'unauthorized', message: 'User authentication required' });
    }
    
    const { id } = req.params;
    const { question, answer, folder } = req.body ?? {};
    const card = await updateFlashcard(id, { question, answer, userId, folder });
    res.json(card);
  } catch (e) {
    res.status(400).json({ error: 'update_failed', message: e.message });
  }
}

export async function removeFlashcard(req, res) {
  try {
    const userId = req.user?.uid; // Get user ID from authenticated request
    if (!userId) {
      return res.status(401).json({ error: 'unauthorized', message: 'User authentication required' });
    }
    
    const { id } = req.params;
    const result = await deleteFlashcard(id, userId);
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: 'delete_failed', message: e.message });
  }
}

export async function studyFlashcards(req, res) {
  try {
    const userId = req.user?.uid; // Get user ID from authenticated request
    if (!userId) {
      return res.status(401).json({ error: 'unauthorized', message: 'User authentication required' });
    }
    
    const { count = 10, folder } = req.query;
    console.log('=== studyFlashcards called ===');
    console.log('userId:', userId);
    console.log('count:', count);
    console.log('folder from query:', folder);
    console.log('folder type:', typeof folder);
    console.log('folder === "all":', folder === 'all');
    
    const cards = await getRandomFlashcards(Number(count), userId, folder);
    
    console.log('Final cards returned to frontend:', cards.length);
    res.json(cards);
  } catch (e) {
    console.error('study_failed error:', e);
    res.status(500).json({ error: 'study_failed', message: e.message });
  }
}

