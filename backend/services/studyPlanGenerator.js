import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StructuredOutputParser } from 'langchain/output_parsers';
import { z } from 'zod';
import { getUnitContent, hasCourseData, getAvailableUnits } from './cedParser.js';

// Initialize OpenAI LLM for study plan generation
let studyPlanLlm = null;

if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_key_here') {
  studyPlanLlm = new ChatOpenAI({
    modelName: 'gpt-4o-mini',
    temperature: 0.7,
    maxTokens: 2000,
    openAIApiKey: process.env.OPENAI_API_KEY
  });
}

// Schema for study plan response
const StudyPlanSchema = z.object({
  studyPlan: z.object({
    overview: z.string().describe('Brief overview of the study plan strategy'),
    totalWeeks: z.number().describe('Total number of weeks in the study plan'),
    weeklyGoals: z.array(z.string()).describe('Key goals for each week'),
    dailySchedule: z.array(z.object({
      week: z.number(),
      day: z.string(),
      date: z.string(),
      sessions: z.array(z.object({
        courseId: z.string(),
        courseName: z.string(),
        duration: z.number(),
        type: z.enum(['mcq', 'frq', 'mixed', 'review', 'concept', 'practice']),
        focus: z.string(),
        difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
        notes: z.string(),
        priority: z.enum(['high', 'medium', 'low'])
      }))
    }))
  }),
  recommendations: z.array(z.string()).describe('General study recommendations'),
  examStrategy: z.string().describe('Specific exam day strategy')
});

const outputParser = StructuredOutputParser.fromZodSchema(StudyPlanSchema);

/**
 * Generate AI-powered study plan based on selected courses and exam dates
 */
export async function generateAIStudyPlan({
  selectedCourses = [],
  examDates = {},
  currentDate = new Date(),
  studyPreferences = {},
  performanceData = {}
}) {
  try {
    if (!studyPlanLlm) {
      console.warn('OpenAI API key not configured, returning fallback study plan');
      return generateFallbackStudyPlan(selectedCourses, examDates, currentDate);
    }

    if (selectedCourses.length === 0) {
      throw new Error('No courses selected for study plan generation');
    }

    // Get course content for AI analysis
    const courseContent = {};
    for (const courseId of selectedCourses) {
      if (hasCourseData(courseId)) {
        // Get available units and their content
        const units = getAvailableUnits(courseId);
        const unitContent = {};
        units.forEach(unit => {
          const content = getUnitContent(courseId, unit);
          if (content) {
            unitContent[unit] = {
              title: content.title,
              content: content.content.substring(0, 500) // Limit content length
            };
          }
        });
        courseContent[courseId] = {
          units: unitContent,
          totalUnits: units.length
        };
      }
    }

    // Calculate time until exams
    const timeUntilExams = {};
    const currentDateObj = new Date(currentDate);
    for (const [courseId, examDate] of Object.entries(examDates)) {
      if (examDate) {
        const examDateObj = new Date(examDate);
        const daysUntil = Math.ceil((examDateObj - currentDateObj) / (1000 * 60 * 60 * 24));
        timeUntilExams[courseId] = Math.max(0, daysUntil);
      }
    }

    // Create the AI prompt
    const prompt = await createStudyPlanPrompt({
      selectedCourses,
      examDates,
      timeUntilExams,
      courseContent,
      currentDate,
      studyPreferences,
      performanceData
    });

    // Generate AI response
    const response = await studyPlanLlm.invoke(prompt);
    
    // Parse the structured output
    const parsedResponse = await outputParser.parse(response.content);
    
    // Validate the parsed response
    if (!parsedResponse.studyPlan || !parsedResponse.studyPlan.dailySchedule) {
      console.warn('AI response missing dailySchedule, falling back to generated plan');
      return generateFallbackStudyPlan(selectedCourses, examDates, currentDate);
    }
    
    // Enhance with additional metadata
    const enhancedPlan = {
      ...parsedResponse,
      metadata: {
        generatedAt: new Date().toISOString(),
        courses: selectedCourses,
        totalSessions: calculateTotalSessions(parsedResponse.studyPlan.dailySchedule),
        estimatedStudyHours: calculateTotalStudyHours(parsedResponse.studyPlan.dailySchedule)
      }
    };

    console.log(`Generated AI study plan for ${selectedCourses.length} courses`);
    return enhancedPlan;

  } catch (error) {
    console.error('Error generating AI study plan:', error);
    return generateFallbackStudyPlan(selectedCourses, examDates, currentDate);
  }
}

/**
 * Create the AI prompt for study plan generation
 */
async function createStudyPlanPrompt({
  selectedCourses,
  examDates,
  timeUntilExams,
  courseContent,
  currentDate,
  studyPreferences,
  performanceData
}) {
  const promptTemplate = new PromptTemplate({
    template: `You are an expert AP exam tutor and study planner. Create a comprehensive, personalized study plan for the following AP courses with SPECIFIC, DETAILED guidance.

STUDENT PROFILE:
- Selected Courses: {selectedCourses}
- Current Date: {currentDate}
- Time Until Exams: {timeUntilExams}
- Study Preferences: {studyPreferences}
- Performance Data: {performanceData}

COURSE CONTENT CONTEXT:
{courseContent}

EXAM DATES:
{examDates}

CRITICAL INSTRUCTIONS FOR SPECIFIC STUDY GUIDANCE:
1. Create a detailed weekly study plan that adapts to the time remaining until each exam
2. For each study session, provide SPECIFIC unit topics and concepts to focus on
3. Include concrete examples of what to study (e.g., "Unit 3: Photosynthesis - focus on light-dependent reactions, Calvin cycle, and ATP synthesis")
4. Specify exact MCQ topics (e.g., "Practice questions on Unit 4: Cell Communication - signal transduction pathways, ligand-receptor interactions")
5. Detail FRQ practice areas (e.g., "FRQ practice on Unit 6: Gene Expression - transcription factors, operons, and gene regulation mechanisms")
6. Balance different study types: MCQ practice, FRQ practice, concept review, and mixed practice
7. Consider the difficulty progression: start with foundational concepts, build to advanced topics
8. Include specific focus areas based on course content and common exam topics
9. Vary session types to maintain engagement and comprehensive preparation
10. Account for different learning styles and study preferences
11. Include realistic daily study time (15-120 minutes per session)
12. Prioritize courses with earlier exam dates
13. Include rest days and lighter study periods
14. Provide specific, actionable study recommendations with EXAMPLES

STUDY PLAN REQUIREMENTS:
- Generate sessions for each day leading up to the earliest exam
- Include 2-5 study sessions per week per course
- Mix session types: MCQ (40%), FRQ (30%), Review (20%), Mixed (10%)
- Vary difficulty levels throughout the plan
- Include SPECIFIC focus topics for each session with unit numbers and concept names
- Add motivational notes and study tips with concrete examples
- Consider spaced repetition for better retention
- For each session, specify:
  * Exact unit(s) to focus on
  * Specific concepts within those units
  * Example topics or question types
  * Recommended resources or study methods
  * Expected learning outcomes

EXAMPLES OF SPECIFIC GUIDANCE:
- Instead of "Study MCQ and do FRQ practice"
- Use: "Unit 2: Cell Structure - Practice MCQ on organelle functions (mitochondria, chloroplasts, ribosomes) and FRQ on membrane transport mechanisms (diffusion, osmosis, active transport)"
- Instead of "Review concepts"
- Use: "Unit 5: Heredity - Review Mendelian genetics principles, Punnett squares, and practice problems on dihybrid crosses and probability calculations"

FORMAT YOUR RESPONSE AS JSON using this exact structure:
{format_instructions}`,
    inputVariables: [
      'selectedCourses', 'currentDate', 'timeUntilExams', 'studyPreferences', 
      'performanceData', 'courseContent', 'examDates'
    ],
    partialVariables: {
      format_instructions: outputParser.getFormatInstructions()
    }
  });

  return await promptTemplate.format({
    selectedCourses: selectedCourses.join(', '),
    currentDate: currentDate.toISOString().split('T')[0],
    timeUntilExams: JSON.stringify(timeUntilExams),
    studyPreferences: JSON.stringify(studyPreferences),
    performanceData: JSON.stringify(performanceData),
    courseContent: JSON.stringify(courseContent, null, 2),
    examDates: JSON.stringify(examDates)
  });
}

/**
 * Generate fallback study plan when AI is not available
 */
function generateFallbackStudyPlan(selectedCourses, examDates, currentDate) {
  const currentDateObj = new Date(currentDate);
  const sessions = {};
  const weeklyGoals = [];
  
  selectedCourses.forEach((courseId, index) => {
    const examDate = examDates[courseId];
    if (!examDate) return;

    const examDateObj = new Date(examDate);
    const daysUntilExam = Math.ceil((examDateObj - currentDateObj) / (1000 * 60 * 60 * 24));
    const weeksUntilExam = Math.ceil(daysUntilExam / 7);
    
    // Generate weekly goals
    for (let week = 1; week <= weeksUntilExam; week++) {
      weeklyGoals.push(`Week ${week}: Focus on ${courseId} fundamentals and practice questions`);
    }
    
    // Generate study sessions from current date to day before exam
    const sessionsPerWeek = Math.max(2, Math.min(4, Math.ceil(weeksUntilExam / 2)));
    const daysBetweenSessions = Math.ceil(7 / sessionsPerWeek);
    
    // Generate sessions from current date to day before exam
    for (let i = 0; i < daysUntilExam - 1; i += daysBetweenSessions) {
      const sessionDate = new Date(currentDateObj);
      sessionDate.setDate(currentDateObj.getDate() + i);
      const dateKey = sessionDate.toISOString().split('T')[0];
      
      if (!sessions[dateKey]) {
        sessions[dateKey] = [];
      }
      
      const weekNumber = Math.ceil(i / 7) + 1;
      const sessionTypes = ['mcq', 'frq', 'review', 'mixed'];
      const sessionType = sessionTypes[i % sessionTypes.length];
      
      // Generate specific focus areas based on course and week
      const specificFocus = generateSpecificFocus(courseId, weekNumber, sessionType, i, daysUntilExam);
      
      sessions[dateKey].push({
        courseId,
        courseName: courseId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        duration: 60,
        type: sessionType,
        focus: specificFocus.focus,
        difficulty: i < daysUntilExam / 3 ? 'beginner' : i < 2 * daysUntilExam / 3 ? 'intermediate' : 'advanced',
        notes: specificFocus.notes,
        priority: i < daysUntilExam / 2 ? 'high' : 'medium'
      });
    }
  });

  // Ensure we have a valid dailySchedule
  const dailySchedule = Object.entries(sessions).map(([date, daySessions]) => ({
    week: Math.ceil((new Date(date) - currentDateObj) / (1000 * 60 * 60 * 24 * 7)),
    day: new Date(date).toLocaleDateString('en-US', { weekday: 'long' }),
    date,
    sessions: daySessions || []
  }));

  return {
    studyPlan: {
      overview: `Comprehensive study plan for ${selectedCourses.length} AP courses leading up to exam dates`,
      totalWeeks: Math.max(...selectedCourses.map(courseId => {
        const examDate = examDates[courseId];
        return examDate ? Math.ceil((new Date(examDate) - currentDateObj) / (1000 * 60 * 60 * 24 * 7)) : 0;
      })),
      weeklyGoals,
      dailySchedule: dailySchedule
    },
    recommendations: [
      'Study consistently every day, even if only for 15-30 minutes',
      'Focus on understanding concepts rather than memorization',
      'Practice both multiple choice and free response questions',
      'Review previous mistakes and weak areas regularly',
      'Take practice exams under timed conditions'
    ],
    examStrategy: 'Arrive well-rested, bring necessary materials, and manage your time effectively during the exam',
    metadata: {
      generatedAt: new Date().toISOString(),
      courses: selectedCourses,
      totalSessions: Object.values(sessions).flat().length,
      estimatedStudyHours: Object.values(sessions).flat().reduce((sum, session) => sum + session.duration, 0) / 60,
      isFallback: true
    }
  };
}

/**
 * Calculate total number of study sessions
 */
function calculateTotalSessions(dailySchedule) {
  return dailySchedule.reduce((total, day) => total + day.sessions.length, 0);
}

/**
 * Calculate total estimated study hours
 */
function calculateTotalStudyHours(dailySchedule) {
  const totalMinutes = dailySchedule.reduce((total, day) => {
    return total + day.sessions.reduce((dayTotal, session) => dayTotal + session.duration, 0);
  }, 0);
  return Math.round(totalMinutes / 60 * 10) / 10; // Round to 1 decimal place
}

/**
 * Generate specific focus areas for study sessions
 */
function generateSpecificFocus(courseId, weekNumber, sessionType, sessionIndex, daysUntilExam) {
  const courseSpecificContent = {
    'ap-biology': {
      units: [
        'Unit 1: Chemistry of Life - Water properties, macromolecules, enzymes',
        'Unit 2: Cell Structure - Organelles, membrane transport, cell communication',
        'Unit 3: Cellular Energetics - Photosynthesis, cellular respiration, ATP',
        'Unit 4: Cell Communication - Signal transduction, cell cycle, regulation',
        'Unit 5: Heredity - Mendelian genetics, meiosis, chromosomal inheritance',
        'Unit 6: Gene Expression - DNA structure, transcription, translation',
        'Unit 7: Natural Selection - Evolution, phylogeny, speciation',
        'Unit 8: Ecology - Populations, communities, ecosystems'
      ]
    },
    'ap-chemistry': {
      units: [
        'Unit 1: Atomic Structure - Electron configuration, periodic trends',
        'Unit 2: Molecular Structure - Bonding, VSEPR, intermolecular forces',
        'Unit 3: Intermolecular Forces - Properties, phase changes',
        'Unit 4: Chemical Reactions - Stoichiometry, limiting reactants',
        'Unit 5: Kinetics - Reaction rates, rate laws, mechanisms',
        'Unit 6: Thermodynamics - Enthalpy, entropy, free energy',
        'Unit 7: Equilibrium - Le Chatelier, Kc, Kp calculations',
        'Unit 8: Acids and Bases - pH, buffers, titrations',
        'Unit 9: Applications - Electrochemistry, organic chemistry'
      ]
    },
    'ap-physics-1': {
      units: [
        'Unit 1: Kinematics - Motion in one and two dimensions',
        'Unit 2: Dynamics - Newton\'s laws, forces, friction',
        'Unit 3: Circular Motion - Centripetal force, angular velocity',
        'Unit 4: Energy - Work, kinetic energy, potential energy',
        'Unit 5: Momentum - Impulse, collisions, conservation',
        'Unit 6: Simple Harmonic Motion - Springs, pendulums',
        'Unit 7: Torque and Rotational Motion - Angular momentum',
        'Unit 8: Electric Charge - Coulomb\'s law, electric fields',
        'Unit 9: DC Circuits - Ohm\'s law, power, resistors',
        'Unit 10: Mechanical Waves - Wave properties, interference'
      ]
    },
    'ap-calculus-ab': {
      units: [
        'Unit 1: Limits and Continuity - Limit laws, continuity',
        'Unit 2: Differentiation - Definition, rules, chain rule',
        'Unit 3: Applications of Differentiation - Related rates, optimization',
        'Unit 4: Integration - Antiderivatives, fundamental theorem',
        'Unit 5: Applications of Integration - Area, volume, motion',
        'Unit 6: Differential Equations - Separable equations',
        'Unit 7: Applications of Differential Equations - Growth models',
        'Unit 8: Applications of Integration - Arc length, surface area'
      ]
    },
    'ap-statistics': {
      units: [
        'Unit 1: Exploring Data - Types of data, distributions',
        'Unit 2: Sampling and Experimentation - Study design',
        'Unit 3: Anticipating Patterns - Probability, random variables',
        'Unit 4: Statistical Inference - Confidence intervals',
        'Unit 5: Statistical Inference - Hypothesis testing',
        'Unit 6: Regression - Linear regression, correlation',
        'Unit 7: Inference for Categorical Data - Chi-square tests',
        'Unit 8: Inference for Quantitative Data - t-tests'
      ]
    },
    'ap-psychology': {
      units: [
        'Unit 1: Scientific Foundations - Research methods, ethics',
        'Unit 2: Biological Bases - Brain structure, neurotransmitters',
        'Unit 3: Sensation and Perception - Sensory systems, illusions',
        'Unit 4: Learning - Classical conditioning, operant conditioning',
        'Unit 5: Cognitive Psychology - Memory, problem solving',
        'Unit 6: Developmental Psychology - Lifespan development',
        'Unit 7: Motivation and Emotion - Theories, stress',
        'Unit 8: Clinical Psychology - Disorders, treatments',
        'Unit 9: Social Psychology - Attribution, conformity, prejudice'
      ]
    }
  };

  const courseContent = courseSpecificContent[courseId] || {
    units: [
      'Unit 1: Foundations and Fundamentals',
      'Unit 2: Core Concepts and Principles',
      'Unit 3: Advanced Applications',
      'Unit 4: Integration and Synthesis',
      'Unit 5: Review and Practice'
    ]
  };

  const unitIndex = Math.min(Math.floor(sessionIndex / 3), courseContent.units.length - 1);
  const selectedUnit = courseContent.units[unitIndex];
  
  const sessionTypeGuidance = {
    'mcq': {
      focus: `${selectedUnit} - Practice multiple choice questions on key concepts`,
      notes: `Focus on understanding concepts through practice questions. Review explanations for incorrect answers.`
    },
    'frq': {
      focus: `${selectedUnit} - Practice free response questions and essay writing`,
      notes: `Practice writing clear, detailed responses. Focus on showing your work and explaining your reasoning.`
    },
    'review': {
      focus: `${selectedUnit} - Comprehensive review of concepts and problem-solving`,
      notes: `Review key concepts, formulas, and problem-solving strategies. Create summary notes.`
    },
    'mixed': {
      focus: `${selectedUnit} - Mixed practice with both MCQ and FRQ questions`,
      notes: `Combine multiple choice and free response practice. Focus on time management and accuracy.`
    }
  };

  const guidance = sessionTypeGuidance[sessionType] || sessionTypeGuidance['mcq'];
  
  return {
    focus: guidance.focus,
    notes: guidance.notes
  };
}

/**
 * Generate adaptive study plan based on performance data
 */
export async function generateAdaptiveStudyPlan({
  selectedCourses,
  examDates,
  currentDate,
  performanceData,
  studyPreferences = {}
}) {
  try {
    // Analyze performance to identify weak areas
    const weakAreas = analyzePerformanceData(performanceData);
    const strongAreas = identifyStrongAreas(performanceData);
    
    // Adjust study plan based on performance
    const adjustedPreferences = {
      ...studyPreferences,
      focusAreas: weakAreas,
      maintainStrengths: strongAreas,
      adaptiveMode: true
    };

    return await generateAIStudyPlan({
      selectedCourses,
      examDates,
      currentDate,
      studyPreferences: adjustedPreferences,
      performanceData
    });

  } catch (error) {
    console.error('Error generating adaptive study plan:', error);
    return generateFallbackStudyPlan(selectedCourses, examDates, currentDate);
  }
}

/**
 * Analyze performance data to identify weak areas
 */
function analyzePerformanceData(performanceData) {
  const weakAreas = [];
  
  if (performanceData.coursePerformance) {
    Object.entries(performanceData.coursePerformance).forEach(([courseId, data]) => {
      if (data.averageScore < 70) {
        weakAreas.push({
          courseId,
          area: 'Overall Performance',
          priority: 'high'
        });
      }
    });
  }
  
  if (performanceData.unitPerformance) {
    Object.entries(performanceData.unitPerformance).forEach(([unitId, data]) => {
      if (data.averageScore < 65) {
        weakAreas.push({
          courseId: unitId.split('-')[0],
          unit: unitId.split('-')[1],
          area: `Unit ${unitId.split('-')[1]}`,
          priority: 'high'
        });
      }
    });
  }
  
  return weakAreas;
}

/**
 * Identify strong areas to maintain
 */
function identifyStrongAreas(performanceData) {
  const strongAreas = [];
  
  if (performanceData.coursePerformance) {
    Object.entries(performanceData.coursePerformance).forEach(([courseId, data]) => {
      if (data.averageScore >= 85) {
        strongAreas.push({
          courseId,
          area: 'Overall Performance',
          maintainLevel: 'high'
        });
      }
    });
  }
  
  return strongAreas;
}
