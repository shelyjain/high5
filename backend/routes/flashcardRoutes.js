import express from 'express';
import {
  listFlashcards,
  createFlashcard,
  editFlashcard,
  removeFlashcard,
  studyFlashcards
} from '../controllers/flashcardController.js';
import { authenticateUser } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to all flashcard routes
router.use(authenticateUser);

router.get('/study/random', studyFlashcards);
router.get('/', listFlashcards);
router.post('/', createFlashcard);
router.put('/:id', editFlashcard);
router.delete('/:id', removeFlashcard);

export default router;
