import express from 'express';
import {
  hasCourseData,
  getRubricSegments,
  findRelevantRubrics
} from '../services/cedParser.js';
import { gradeFrqSubmission } from '../services/frqGrader.js';
import { saveFrqSubmission } from '../services/frqStorage.js';

const router = express.Router();

router.get('/rubrics/:courseId', (req, res) => {
  const { courseId } = req.params;

  if (!courseId) {
    return res.status(400).json({
      error: 'missing_course_id',
      message: 'Course ID is required.'
    });
  }

  if (!hasCourseData(courseId)) {
    return res.status(404).json({
      error: 'course_not_found',
      message: `No CED data loaded for course ${courseId}.`
    });
  }

  const rubrics = getRubricSegments(courseId).map(sanitiseRubricSegment);

  return res.json({
    courseId,
    rubricCount: rubrics.length,
    rubrics
  });
});

router.post('/grade', async (req, res) => {
  try {
    const {
      courseId,
      courseName,
      questionType = 'general',
      prompt,
      responseText,
      imageData,
      imageName
    } = req.body ?? {};

    if (!courseId) {
      return res.status(400).json({
        error: 'missing_course_id',
        message: 'Course ID is required for grading.'
      });
    }

    if (!hasCourseData(courseId)) {
      return res.status(404).json({
        error: 'course_not_found',
        message: `Course ${courseId} has no parsed CED data.`
      });
    }

    if (!responseText && !imageData) {
      return res.status(400).json({
        error: 'empty_submission',
        message: 'Provide typed text, an image attachment, or both.'
      });
    }

    const rubricSegments = findRelevantRubrics(courseId, {
      questionType,
      prompt,
      responseText
    });

    const gradingResult = await gradeFrqSubmission({
      courseName: courseName ?? formatCourseId(courseId),
      questionPrompt: prompt,
      responseText,
      rubricSegments,
      questionType,
      imageData
    });

    let savedRecord = null;
    try {
      savedRecord = await saveFrqSubmission({
        courseId,
        courseName: courseName ?? formatCourseId(courseId),
        questionType,
        questionPrompt: prompt,
        responseText,
        rubricSegmentIds: rubricSegments.map(segment => segment.id),
        grade: gradingResult,
        imageData,
        imageOriginalName: imageName
      });
    } catch (storageError) {
      console.error('Failed to persist FRQ submission:', storageError);
    }

    res.json({
      courseId,
      submissionId: savedRecord?.id ?? null,
      graded: gradingResult?.graded ?? false,
      grade: gradingResult,
      rubricSegments: rubricSegments.map(sanitiseRubricSegment),
      stored: Boolean(savedRecord),
      createdAt: savedRecord?.createdAt ?? new Date().toISOString()
    });
  } catch (error) {
    console.error('FRQ grading request failed:', error);
    res.status(500).json({
      error: 'frq_grading_failed',
      message: error?.message ?? 'Unable to grade submission right now.'
    });
  }
});

function sanitiseRubricSegment(segment) {
  return {
    id: segment.id,
    title: segment.title,
    questionTypes: segment.questionTypes,
    chunkIndices: segment.chunkIndices
  };
}

function formatCourseId(courseId) {
  return courseId
    ?.split('-')
    ?.map(part => part.charAt(0).toUpperCase() + part.slice(1))
    ?.join(' ') ?? 'AP Course';
}

export default router;
