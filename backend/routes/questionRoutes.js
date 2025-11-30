import express from 'express';
import { 
  getAvailableUnits as getCedUnits, 
  getUnitContent, 
  hasCourseData,
  getCedHash 
} from '../services/cedParser.js';
import { 
  generateMCQWithRetry,
  generateAdaptivePracticeQuestions
} from '../services/mcqGenerator.js';
import { 
  getCachedQuestions, 
  cacheQuestions, 
  isCacheValid,
  getAvailableUnits as getCachedUnits 
} from '../services/cacheService.js';

const router = express.Router();

/**
 * GET /api/questions
 * Base endpoint - provides information about available endpoints
 */
router.get('/', (req, res) => {
  res.json({
    message: 'High5 MCQ API',
    endpoints: {
      'GET /api/questions/units/:courseId': 'Get available units for a course',
      'GET /api/questions/:courseId/:unitNumber?isAuthenticated=true': 'Get MCQ questions for a specific unit (12 for authenticated, 6 for guests)',
      'POST /api/questions/adaptive/:courseId/:unitNumber': 'Generate adaptive practice questions based on previous performance',
      'POST /api/questions/regenerate/:courseId/:unitNumber': 'Force regenerate questions for a unit'
    },
    example: {
      'Get units': '/api/questions/units/ap-world-history',
      'Get questions (authenticated)': '/api/questions/ap-world-history/1?isAuthenticated=true',
      'Get questions (guest)': '/api/questions/ap-world-history/1?isAuthenticated=false',
      'Adaptive practice': 'POST /api/questions/adaptive/ap-world-history/1'
    }
  });
});

/**
 * GET /api/questions/units/:courseId
 * Returns available units for a course
 */
router.get('/units/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    
    // Check if course data exists
    if (!hasCourseData(courseId)) {
      return res.status(404).json({
        error: 'Course not found',
        message: `No CED data found for course: ${courseId}. Please ensure the CED PDF is placed in the /backend/ceds/ directory.`
      });
    }
    
    // Get units from CED data
    const units = getCedUnits(courseId);
    
    if (units.length === 0) {
      return res.status(404).json({
        error: 'No units found',
        message: 'No units could be extracted from the CED file.'
      });
    }
    
    // Get cached units for additional info
    const cachedUnits = getCachedUnits(courseId);
    
    const unitInfo = units.map(unitNumber => ({
      number: unitNumber,
      title: `Unit ${unitNumber}`,
      hasQuestions: cachedUnits.includes(unitNumber),
      questionCount: cachedUnits.includes(unitNumber) ? 'Available' : 'Not generated'
    }));
    
    res.json({
      courseId,
      units: unitInfo,
      totalUnits: units.length
    });
    
  } catch (error) {
    console.error('Error getting units:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve course units'
    });
  }
});

/**
 * GET /api/questions/:courseId/:unitNumber
 * Returns MCQ questions for a specific unit (cached or generated)
 */
router.get('/:courseId/:unitNumber', async (req, res) => {
  try {
    const { courseId, unitNumber } = req.params;
    const { isAuthenticated } = req.query; // Check if user is authenticated
    const unitNum = parseInt(unitNumber);
    
    if (isNaN(unitNum) || unitNum < 1) {
      return res.status(400).json({
        error: 'Invalid unit number',
        message: 'Unit number must be a positive integer'
      });
    }
    
    // Check if course data exists
    if (!hasCourseData(courseId)) {
      return res.status(404).json({
        error: 'Course not found',
        message: `No CED data found for course: ${courseId}`
      });
    }
    
    // Determine question count based on authentication status
    const questionCount = isAuthenticated === 'true' ? 12 : 6;
    
    // Get current CED hash for cache validation
    const currentCedHash = getCedHash(courseId);
    
    // Check cache first (but only if it matches the expected question count)
    if (isCacheValid(courseId, unitNum, currentCedHash)) {
      const cached = getCachedQuestions(courseId, unitNum);
      if (cached && cached.questions && cached.questions.length >= questionCount) {
        console.log(`Returning cached questions for ${courseId} Unit ${unitNum}`);
        // Return only the requested number of questions
        const questions = cached.questions.slice(0, questionCount);
        return res.json({
          courseId,
          unitNumber: unitNum,
          questions,
          source: 'cache',
          generatedAt: cached.generatedAt,
          questionCount: questions.length,
          isAuthenticated: isAuthenticated === 'true'
        });
      }
    }
    
    // Generate new questions
    console.log(`Generating ${questionCount} new questions for ${courseId} Unit ${unitNum}...`);
    
    // Get unit content
    const unitContent = getUnitContent(courseId, unitNum);
    if (!unitContent) {
      return res.status(404).json({
        error: 'Unit not found',
        message: `Unit ${unitNum} not found in course ${courseId}`
      });
    }
    
    // Generate questions
    const questions = await generateMCQWithRetry(
      courseId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), // Format course name
      unitNum,
      unitContent.title,
      unitContent.content,
      questionCount
    );
    
    // Cache the questions
    cacheQuestions(courseId, unitNum, questions, currentCedHash);
    
    res.json({
      courseId,
      unitNumber: unitNum,
      questions,
      source: 'generated',
      generatedAt: new Date().toISOString(),
      questionCount: questions.length,
      isAuthenticated: isAuthenticated === 'true'
    });
    
  } catch (error) {
    console.error('Error getting questions:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to generate or retrieve questions'
    });
  }
});

/**
 * POST /api/questions/adaptive/:courseId/:unitNumber
 * Generate adaptive practice questions based on previous performance
 */
router.post('/adaptive/:courseId/:unitNumber', async (req, res) => {
  try {
    const { courseId, unitNumber } = req.params;
    const { previousAnswers } = req.body; // Array of previous answer data
    const unitNum = parseInt(unitNumber);
    
    if (isNaN(unitNum) || unitNum < 1) {
      return res.status(400).json({
        error: 'Invalid unit number',
        message: 'Unit number must be a positive integer'
      });
    }
    
    // Check if course data exists
    if (!hasCourseData(courseId)) {
      return res.status(404).json({
        error: 'Course not found',
        message: `No CED data found for course: ${courseId}`
      });
    }
    
    // Get unit content
    const unitContent = getUnitContent(courseId, unitNum);
    if (!unitContent) {
      return res.status(404).json({
        error: 'Unit not found',
        message: `Unit ${unitNum} not found in course ${courseId}`
      });
    }
    
    // Generate adaptive practice questions
    console.log(`Generating adaptive practice questions for ${courseId} Unit ${unitNum}...`);
    
    const questions = await generateAdaptivePracticeQuestions(
      courseId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      unitNum,
      unitContent.title,
      unitContent.content,
      previousAnswers || [],
      6 // Always generate 6 adaptive questions
    );
    
    res.json({
      courseId,
      unitNumber: unitNum,
      questions,
      source: 'adaptive',
      generatedAt: new Date().toISOString(),
      questionCount: questions.length,
      isAdaptive: true
    });
    
  } catch (error) {
    console.error('Error generating adaptive questions:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to generate adaptive practice questions'
    });
  }
});

/**
 * POST /api/questions/regenerate/:courseId/:unitNumber
 * Force regenerate questions for a unit (admin use)
 */
router.post('/regenerate/:courseId/:unitNumber', async (req, res) => {
  try {
    const { courseId, unitNumber } = req.params;
    const unitNum = parseInt(unitNumber);
    
    if (isNaN(unitNum) || unitNum < 1) {
      return res.status(400).json({
        error: 'Invalid unit number',
        message: 'Unit number must be a positive integer'
      });
    }
    
    // Check if course data exists
    if (!hasCourseData(courseId)) {
      return res.status(404).json({
        error: 'Course not found',
        message: `No CED data found for course: ${courseId}`
      });
    }
    
    // Get unit content
    const unitContent = getUnitContent(courseId, unitNum);
    if (!unitContent) {
      return res.status(404).json({
        error: 'Unit not found',
        message: `Unit ${unitNum} not found in course ${courseId}`
      });
    }
    
    // Force regenerate questions
    console.log(`Force regenerating questions for ${courseId} Unit ${unitNum}...`);
    
    const questions = await generateMCQWithRetry(
      courseId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      unitNum,
      unitContent.title,
      unitContent.content,
      12 // Default to 12 questions for admin regeneration
    );
    
    // Cache the new questions
    const currentCedHash = getCedHash(courseId);
    cacheQuestions(courseId, unitNum, questions, currentCedHash);
    
    res.json({
      courseId,
      unitNumber: unitNum,
      questions,
      source: 'regenerated',
      generatedAt: new Date().toISOString(),
      questionCount: questions.length
    });
    
  } catch (error) {
    console.error('Error regenerating questions:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to regenerate questions'
    });
  }
});

export default router;
