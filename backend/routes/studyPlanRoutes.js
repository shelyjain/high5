import express from 'express';
import { generateAIStudyPlan, generateAdaptiveStudyPlan } from '../services/studyPlanGenerator.js';

const router = express.Router();

/**
 * POST /api/study-plan/generate
 * Generate AI-powered study plan
 */
router.post('/generate', async (req, res) => {
  try {
    const {
      selectedCourses = [],
      examDates = {},
      currentDate,
      studyPreferences = {},
      performanceData = {}
    } = req.body;

    // Validate input
    if (!Array.isArray(selectedCourses) || selectedCourses.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid input',
        message: 'selectedCourses must be a non-empty array'
      });
    }

    // Convert currentDate string to Date object if provided
    const dateToUse = currentDate ? new Date(currentDate) : new Date();
    
    // Convert examDates strings to Date objects
    const processedExamDates = {};
    Object.entries(examDates).forEach(([courseId, dateStr]) => {
      if (dateStr) {
        processedExamDates[courseId] = new Date(dateStr);
      }
    });

    console.log(`Generating study plan for courses: ${selectedCourses.join(', ')}`);

    // Generate the study plan
    const studyPlan = await generateAIStudyPlan({
      selectedCourses,
      examDates: processedExamDates,
      currentDate: dateToUse,
      studyPreferences,
      performanceData
    });

    console.log('Generated study plan structure:', {
      hasStudyPlan: !!studyPlan,
      hasDailySchedule: !!(studyPlan && studyPlan.studyPlan && studyPlan.studyPlan.dailySchedule),
      dailyScheduleLength: studyPlan && studyPlan.studyPlan && studyPlan.studyPlan.dailySchedule ? studyPlan.studyPlan.dailySchedule.length : 0
    });

    res.json({
      success: true,
      studyPlan,
      message: 'Study plan generated successfully'
    });

  } catch (error) {
    console.error('Error generating study plan:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to generate study plan'
    });
  }
});

/**
 * POST /api/study-plan/adaptive
 * Generate adaptive study plan based on performance data
 */
router.post('/adaptive', async (req, res) => {
  try {
    const {
      selectedCourses = [],
      examDates = {},
      currentDate,
      performanceData = {},
      studyPreferences = {}
    } = req.body;

    // Validate input
    if (!Array.isArray(selectedCourses) || selectedCourses.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid input',
        message: 'selectedCourses must be a non-empty array'
      });
    }

    if (!performanceData || Object.keys(performanceData).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid input',
        message: 'performanceData is required for adaptive study plans'
      });
    }

    // Convert currentDate string to Date object if provided
    const dateToUse = currentDate ? new Date(currentDate) : new Date();
    
    // Convert examDates strings to Date objects
    const processedExamDates = {};
    Object.entries(examDates).forEach(([courseId, dateStr]) => {
      if (dateStr) {
        processedExamDates[courseId] = new Date(dateStr);
      }
    });

    console.log(`Generating adaptive study plan for courses: ${selectedCourses.join(', ')}`);

    // Generate the adaptive study plan
    const studyPlan = await generateAdaptiveStudyPlan({
      selectedCourses,
      examDates: processedExamDates,
      currentDate: dateToUse,
      performanceData,
      studyPreferences
    });

    console.log('Generated adaptive study plan structure:', {
      hasStudyPlan: !!studyPlan,
      hasDailySchedule: !!(studyPlan && studyPlan.studyPlan && studyPlan.studyPlan.dailySchedule),
      dailyScheduleLength: studyPlan && studyPlan.studyPlan && studyPlan.studyPlan.dailySchedule ? studyPlan.studyPlan.dailySchedule.length : 0
    });

    res.json({
      success: true,
      studyPlan,
      message: 'Adaptive study plan generated successfully',
      isAdaptive: true
    });

  } catch (error) {
    console.error('Error generating adaptive study plan:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to generate adaptive study plan'
    });
  }
});

/**
 * GET /api/study-plan/health
 * Health check for study plan service
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Study plan service is running',
    timestamp: new Date().toISOString()
  });
});

export default router;
