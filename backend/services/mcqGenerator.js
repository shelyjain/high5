import { ChatOpenAI } from '@langchain/openai';
import { StructuredOutputParser } from 'langchain/output_parsers';
import { PromptTemplate } from '@langchain/core/prompts';
import { z } from 'zod';
import dotenv from 'dotenv';
import { hasCourseData, getUnitContent, getRubricSegments, findRelevantRubrics, mapCourseIdToCedId } from './cedParser.js';

// Load environment variables
dotenv.config();

// Define the schema for MCQ questions
const MCQQuestionSchema = z.object({
  question: z.string().describe('The multiple choice question text'),
  options: z.array(z.string()).length(4).describe('Four answer options (A, B, C, D)'),
  correctAnswer: z.string().describe('The correct answer (A, B, C, or D)'),
  explanation: z.string().describe('Brief explanation of why the correct answer is right')
});

const MCQResponseSchema = z.object({
  questions: z.array(MCQQuestionSchema).describe('Array of multiple choice questions')
});

// Initialize the LLM (only if API key is available)
let llm = null;
console.log('API Key check:', {
  hasKey: !!process.env.OPENAI_API_KEY,
  keyLength: process.env.OPENAI_API_KEY?.length,
  keyStart: process.env.OPENAI_API_KEY?.substring(0, 10) + '...',
  isDefault: process.env.OPENAI_API_KEY === 'your_key_here'
});

if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_key_here') {
  console.log('Initializing OpenAI LLM...');
  llm = new ChatOpenAI({
    modelName: 'gpt-4o-mini',
    temperature: 0.7,
    maxTokens: 1500,
    openAIApiKey: process.env.OPENAI_API_KEY
  });
  console.log('OpenAI LLM initialized successfully');
} else {
  console.log('OpenAI API key not configured or is default value');
}

// Create output parser
const outputParser = StructuredOutputParser.fromZodSchema(MCQResponseSchema);

// Helper function to determine if a course is math-related
function isMathCourse(courseName) {
  const mathKeywords = [
    'calculus', 'statistics', 'algebra', 'geometry', 'trigonometry', 
    'precalculus', 'mathematics', 'math', 'mathematical'
  ];
  const courseLower = courseName.toLowerCase();
  return mathKeywords.some(keyword => courseLower.includes(keyword));
}

// Helper function to determine if a course is statistics
function isStatisticsCourse(courseName) {
  return courseName.toLowerCase().includes('statistics');
}

// Get math-specific instructions
function getMathSpecificInstructions(courseName) {
  if (isMathCourse(courseName)) {
    return `
MATH-SPECIFIC INSTRUCTIONS:
- Create ACTUAL MATH PROBLEMS with calculations, equations, and mathematical concepts
- Include problems that require students to solve equations, find derivatives, integrals, or statistical calculations
- Use real mathematical scenarios and word problems
- Include problems with graphs, functions, and mathematical reasoning
- Avoid questions about CED structure, exam format, or course organization
- Focus on mathematical content: formulas, theorems, problem-solving, and applications
- Include numerical answers that students must calculate
- Use proper mathematical notation and terminology`;
  }
  return '';
}

// Create prompt template
const promptTemplate = new PromptTemplate({
  template: `You are an expert AP exam question writer with deep knowledge of College Board AP exam formats and styles. Generate {questionCount} authentic AP-style multiple choice questions that match the exact format, difficulty, and style of real AP {courseName} exam questions.

Course: {courseName}
Unit: {unitNumber} - {unitTitle}

Content:
{content}

CRITICAL INSTRUCTIONS FOR AUTHENTIC AP-STYLE QUESTIONS:

1. **Question Format & Style:**
   - Use the exact question formats found on real AP {courseName} exams
   - Include specific historical periods, dates, or contexts when relevant
   - Use "Which of the following..." constructions typical of AP exams
   - Include primary source excerpts, data, or scenarios when appropriate
   - Make questions test analysis, synthesis, and application, not just recall

2. **AP-Specific Question Types:**
   - For History courses: Include document-based questions, causation questions, comparison questions
   - For Science courses: Include experimental design, data analysis, and application questions
   - For Math courses: Include problem-solving, conceptual understanding, and application questions
   - For English courses: Include rhetorical analysis, literary analysis, and synthesis questions

3. **Distractor Quality:**
   - Create distractors that are plausible but clearly incorrect to AP-level students
   - Use common misconceptions as distractors
   - Ensure only one answer is definitively correct
   - Make distractors similar in length and complexity to the correct answer

4. **Difficulty Level:**
   - Match the cognitive complexity of real AP exam questions
   - Include questions that require multiple steps of reasoning
   - Test both content knowledge and analytical skills
   - Use AP exam vocabulary and terminology

5. **Content Alignment:**
   - Base questions on the specific unit content provided
   - Ensure questions test the most important concepts from the unit
   - Include questions that connect to broader AP course themes

{mathSpecificInstructions}

IMPORTANT: Do NOT include letter prefixes (A., B., C., D.) in the question text or options - the letters will be added automatically.

{format_instructions}`,
  inputVariables: ['courseName', 'unitNumber', 'unitTitle', 'content', 'questionCount', 'mathSpecificInstructions'],
  partialVariables: {
    format_instructions: outputParser.getFormatInstructions()
  }
});

/**
 * Generate MCQ questions for a specific unit
 */
export async function generateMCQQuestions(courseName, unitNumber, unitTitle, content, questionCount = 6) {
  try {
    console.log(`Generating ${questionCount} MCQ questions for ${courseName} Unit ${unitNumber}...`);
    
    // Check if LLM is available
    if (!llm) {
      console.warn('OpenAI API key not configured, returning fallback questions');
      return generateFallbackQuestions(courseName, unitNumber, questionCount);
    }
    
    // Truncate content if too long to stay within token limits
    const maxContentLength = 3000; // Roughly 750 tokens
    const truncatedContent = content.length > maxContentLength 
      ? content.substring(0, maxContentLength) + '...'
      : content;
    
    // Get math-specific instructions
    const mathInstructions = getMathSpecificInstructions(courseName);
    
    // Create the prompt
    const prompt = await promptTemplate.format({
      courseName,
      unitNumber,
      unitTitle,
      content: truncatedContent,
      questionCount,
      mathSpecificInstructions: mathInstructions
    });
    
    // Generate response
    const response = await llm.invoke(prompt);
    
    // Clean JSON content to remove markdown code blocks
    const cleanJsonContent = (content) => {
      if (typeof content !== 'string') return content;
      return content
        .replace(/^```json\s*/i, '')
        .replace(/\s*```\s*$/i, '')
        .trim();
    };
    
    // Parse the structured output
    const cleanedContent = cleanJsonContent(response.content);
    const parsedResponse = await outputParser.parse(cleanedContent);
    
    // Validate and clean up the questions
    const questions = parsedResponse.questions.map((q, index) => ({
      id: `q${index + 1}`,
      question: q.question.trim(),
      options: q.options.map(opt => opt.trim()),
      correctAnswer: q.correctAnswer.trim().toUpperCase(),
      explanation: q.explanation.trim()
    }));
    
    console.log(`Generated ${questions.length} MCQ questions for ${courseName} Unit ${unitNumber}`);
    return questions;
    
  } catch (error) {
    console.error('Error generating MCQ questions:', error);
    
    // Return fallback questions if generation fails
    return generateFallbackQuestions(courseName, unitNumber, questionCount);
  }
}

/**
 * Generate fallback questions when AI generation fails
 */
function generateFallbackQuestions(courseName, unitNumber, questionCount = 6) {
  // Check if this is a math course for different fallback questions
  const isMath = isMathCourse(courseName);
  const isStats = isStatisticsCourse(courseName);
  
  const baseQuestions = isStats ? [
    {
      id: 'q1',
      question: `A sample of 25 students has a mean test score of 78 with a standard deviation of 8. What is the 95% confidence interval for the population mean?`,
      options: [
        '74.86 to 81.14',
        '76.32 to 79.68',
        '74.12 to 81.88',
        '75.44 to 80.56'
      ],
      correctAnswer: 'A',
      explanation: 'Using the formula: x̄ ± t*(s/√n). For 95% CI with df=24, t*=2.064. CI = 78 ± 2.064(8/√25) = 78 ± 3.14 = (74.86, 81.14).'
    },
    {
      id: 'q2',
      question: `If the correlation coefficient between two variables is r = 0.85, what percentage of the variation in y is explained by the linear relationship with x?`,
      options: [
        '72.25%',
        '85%',
        '92.5%',
        '15%'
      ],
      correctAnswer: 'A',
      explanation: 'The coefficient of determination is r² = (0.85)² = 0.7225 = 72.25%. This means 72.25% of the variation in y is explained by the linear relationship with x.'
    },
    {
      id: 'q3',
      question: `In a normal distribution with mean μ = 100 and standard deviation σ = 15, what is the probability that a randomly selected value is between 85 and 115?`,
      options: [
        '0.6826',
        '0.9544',
        '0.9974',
        '0.5000'
      ],
      correctAnswer: 'A',
      explanation: 'This is within one standard deviation of the mean (100 ± 15). For a normal distribution, P(μ-σ < X < μ+σ) ≈ 0.6826.'
    }
  ] : isMath ? [
    {
      id: 'q1',
      question: `What is the derivative of f(x) = x² + 3x - 5?`,
      options: [
        '2x + 3',
        'x + 3',
        '2x - 5',
        'x² + 3'
      ],
      correctAnswer: 'A',
      explanation: 'Using the power rule: d/dx(x²) = 2x, d/dx(3x) = 3, d/dx(-5) = 0. So f\'(x) = 2x + 3.'
    },
    {
      id: 'q2',
      question: `If f(x) = 2x³ - 4x + 1, what is f\'(2)?`,
      options: [
        '20',
        '16',
        '24',
        '12'
      ],
      correctAnswer: 'A',
      explanation: 'f\'(x) = 6x² - 4. So f\'(2) = 6(2)² - 4 = 6(4) - 4 = 24 - 4 = 20.'
    },
    {
      id: 'q3',
      question: `What is the limit as x approaches 0 of (sin x)/x?`,
      options: [
        '1',
        '0',
        '∞',
        'undefined'
      ],
      correctAnswer: 'A',
      explanation: 'This is a fundamental limit: lim(x→0) (sin x)/x = 1. This is a standard result in calculus.'
    }
  ] : [
    {
      id: 'q1',
      question: `Based on the content in ${courseName} Unit ${unitNumber}, which of the following best describes the main topic?`,
      options: [
        'A comprehensive overview of the subject matter',
        'An introduction to basic concepts',
        'Advanced applications and analysis',
        'Historical context and background'
      ],
      correctAnswer: 'A',
      explanation: 'This is a fallback question. Please check the CED content and regenerate questions.'
    },
    {
      id: 'q2',
      question: `What is the primary focus of Unit ${unitNumber} in ${courseName}?`,
      options: [
        'Theoretical foundations',
        'Practical applications',
        'Historical development',
        'Contemporary relevance'
      ],
      correctAnswer: 'B',
      explanation: 'This is a fallback question. Please check the CED content and regenerate questions.'
    }
  ];

  // If we need more questions, duplicate and modify them
  const questions = [];
  for (let i = 0; i < questionCount; i++) {
    const baseQuestion = baseQuestions[i % baseQuestions.length];
    questions.push({
      ...baseQuestion,
      id: `q${i + 1}`,
      question: baseQuestion.question.replace('q1', `q${i + 1}`)
    });
  }

  return questions;
}

/**
 * Generate questions with retry logic
 */
export async function generateMCQWithRetry(courseName, unitNumber, unitTitle, content, questionCount = 6, maxRetries = 3) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const questions = await generateMCQQuestions(courseName, unitNumber, unitTitle, content, questionCount);
      
      // Validate that we got reasonable questions
      if (questions && questions.length >= Math.min(3, questionCount)) {
        return questions;
      }
      
      throw new Error(`Generated only ${questions?.length || 0} questions, expected at least ${Math.min(3, questionCount)}`);
      
    } catch (error) {
      lastError = error;
      console.warn(`MCQ generation attempt ${attempt} failed:`, error.message);
      
      if (attempt < maxRetries) {
        // Wait before retry (exponential backoff)
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  console.error(`All ${maxRetries} attempts failed, returning fallback questions`);
  return generateFallbackQuestions(courseName, unitNumber, questionCount);
}

/**
 * Estimate token usage for content
 */
export function estimateTokenUsage(content) {
  // Rough estimation: 1 token ≈ 4 characters for English text
  return Math.ceil(content.length / 4);
}

/**
 * Generate adaptive practice questions based on previous performance
 */
export async function generateAdaptivePracticeQuestions(courseName, unitNumber, unitTitle, content, previousAnswers = [], questionCount = 6) {
  try {
    console.log(`Generating ${questionCount} adaptive practice questions for ${courseName} Unit ${unitNumber}...`);
    
    // Check if LLM is available
    if (!llm) {
      console.warn('OpenAI API key not configured, returning fallback questions');
      return generateFallbackQuestions(courseName, unitNumber, questionCount);
    }
    
    // Analyze previous performance to identify weak areas
    const performanceAnalysis = analyzePerformance(previousAnswers);
    
    // Truncate content if too long to stay within token limits
    const maxContentLength = 3000; // Roughly 750 tokens
    const truncatedContent = content.length > maxContentLength 
      ? content.substring(0, maxContentLength) + '...'
      : content;
    
    // Create adaptive prompt template
    const adaptivePromptTemplate = new PromptTemplate({
      template: `You are an expert AP exam question writer with deep knowledge of College Board AP exam formats and styles. Generate {questionCount} authentic AP-style multiple choice questions that match the exact format, difficulty, and style of real AP {courseName} exam questions, with a focus on areas where the student needs improvement.

Course: {courseName}
Unit: {unitNumber} - {unitTitle}

Content:
{content}

Previous Performance Analysis:
{performanceAnalysis}

CRITICAL INSTRUCTIONS FOR AUTHENTIC AP-STYLE QUESTIONS:

1. **Question Format & Style:**
   - Use the exact question formats found on real AP {courseName} exams
   - Include specific historical periods, dates, or contexts when relevant
   - Use "Which of the following..." constructions typical of AP exams
   - Include primary source excerpts, data, or scenarios when appropriate
   - Make questions test analysis, synthesis, and application, not just recall

2. **AP-Specific Question Types:**
   - For History courses: Include document-based questions, causation questions, comparison questions
   - For Science courses: Include experimental design, data analysis, and application questions
   - For Math courses: Include problem-solving, conceptual understanding, and application questions
   - For English courses: Include rhetorical analysis, literary analysis, and synthesis questions

3. **Adaptive Focus:**
   - Focus on concepts and topics where the student has shown weakness
   - Prioritize questions that address identified knowledge gaps
   - Create questions that test the specific skills the student needs to improve

4. **Distractor Quality:**
   - Create distractors that are plausible but clearly incorrect to AP-level students
   - Use common misconceptions as distractors
   - Ensure only one answer is definitively correct
   - Make distractors similar in length and complexity to the correct answer

5. **Difficulty Level:**
   - Match the cognitive complexity of real AP exam questions
   - Include questions that require multiple steps of reasoning
   - Test both content knowledge and analytical skills
   - Use AP exam vocabulary and terminology

IMPORTANT: Do NOT include letter prefixes (A., B., C., D.) in the question text or options - the letters will be added automatically.

{format_instructions}`,
      inputVariables: ['courseName', 'unitNumber', 'unitTitle', 'content', 'questionCount', 'performanceAnalysis'],
      partialVariables: {
        format_instructions: outputParser.getFormatInstructions()
      }
    });
    
    // Create the prompt
    const prompt = await adaptivePromptTemplate.format({
      courseName,
      unitNumber,
      unitTitle,
      content: truncatedContent,
      questionCount,
      performanceAnalysis
    });
    
    // Generate response
    const response = await llm.invoke(prompt);
    
    // Clean JSON content to remove markdown code blocks
    const cleanJsonContent = (content) => {
      if (typeof content !== 'string') return content;
      return content
        .replace(/^```json\s*/i, '')
        .replace(/\s*```\s*$/i, '')
        .trim();
    };
    
    // Parse the structured output
    const cleanedContent = cleanJsonContent(response.content);
    const parsedResponse = await outputParser.parse(cleanedContent);
    
    // Validate and clean up the questions
    const questions = parsedResponse.questions.map((q, index) => ({
      id: `adaptive_q${index + 1}`,
      question: q.question.trim(),
      options: q.options.map(opt => opt.trim()),
      correctAnswer: q.correctAnswer.trim().toUpperCase(),
      explanation: q.explanation.trim(),
      isAdaptive: true
    }));
    
    console.log(`Generated ${questions.length} adaptive practice questions for ${courseName} Unit ${unitNumber}`);
    return questions;
    
  } catch (error) {
    console.error('Error generating adaptive practice questions:', error);
    
    // Return fallback questions if generation fails
    return generateFallbackQuestions(courseName, unitNumber, questionCount);
  }
}

/**
 * Analyze previous performance to identify weak areas
 */
function analyzePerformance(previousAnswers) {
  if (!previousAnswers || previousAnswers.length === 0) {
    return "No previous performance data available. Generate general practice questions.";
  }
  
  const totalQuestions = previousAnswers.length;
  const correctAnswers = previousAnswers.filter(answer => answer.isCorrect).length;
  const accuracy = (correctAnswers / totalQuestions) * 100;
  
  // Analyze patterns in incorrect answers
  const incorrectAnswers = previousAnswers.filter(answer => !answer.isCorrect);
  const commonTopics = {};
  
  incorrectAnswers.forEach(answer => {
    if (answer.topic) {
      commonTopics[answer.topic] = (commonTopics[answer.topic] || 0) + 1;
    }
  });
  
  const weakTopics = Object.entries(commonTopics)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([topic, count]) => `${topic} (${count} incorrect)`);
  
  let analysis = `Overall accuracy: ${accuracy.toFixed(1)}% (${correctAnswers}/${totalQuestions} correct). `;
  
  if (weakTopics.length > 0) {
    analysis += `Areas needing improvement: ${weakTopics.join(', ')}. `;
  }
  
  if (accuracy < 60) {
    analysis += "Focus on fundamental concepts and basic understanding.";
  } else if (accuracy < 80) {
    analysis += "Focus on application and analysis questions.";
  } else {
    analysis += "Focus on advanced concepts and complex problem-solving.";
  }
  
  return analysis;
}

/**
 * Validate generated questions
 */
export function validateQuestions(questions) {
  if (!Array.isArray(questions)) {
    return false;
  }
  
  return questions.every(q => 
    q.question && 
    q.options && 
    q.options.length === 4 && 
    q.correctAnswer && 
    q.explanation &&
    ['A', 'B', 'C', 'D'].includes(q.correctAnswer.toUpperCase())
  );
}

/**
 * Analyze AP exam format from CED content
 */
export async function analyzeAPExamFormat(courseName) {
  try {
    const cedId = mapCourseIdToCedId(courseName);
    
    if (!hasCourseData(cedId)) {
      console.log(`No CED data found for ${courseName}`);
      return getDefaultExamFormat(courseName);
    }

    // Get exam overview from CED
    const { getExamOverview } = await import('./cedParser.js');
    const examOverviewContent = getExamOverview(cedId);
    
    let contentText = examOverviewContent;
    
    // If no exam overview found, try getting unit content
    if (!contentText) {
      const content = await getUnitContent(cedId, 1);
      contentText = typeof content === 'string' ? content : content?.content || content?.text || '';
    }
    
    if (!contentText || typeof contentText !== 'string' || contentText.length < 100) {
      return getDefaultExamFormat(courseName);
    }

    // Use LLM to analyze exam format from CED
    const prompt = `Analyze this AP course content and determine the exam format. Look for information about:
- Number of multiple choice questions (may be 0 for FRQ-only exams like AP Seminar)
- Number of free response questions  
- Time allocation for each section
- Question types (DBQ, LEQ, SAQ, etc.)

IMPORTANT: 
- Some courses like AP Seminar have NO multiple choice questions (FRQ-only exam)
- Portfolio-based courses like AP Research have NO exam at all
- Check carefully for "no multiple choice" or "written exam only" indicators

Course: ${courseName}
Content: ${contentText.substring(0, 2000)}

Return ONLY a JSON object with this exact format:
{
  "mcqCount": number (0 if no MCQs),
  "frqCount": number,
  "mcqTimeMinutes": number,
  "frqTimeMinutes": number,
  "questionTypes": ["type1", "type2"],
  "totalTimeMinutes": number,
  "hasMultipleChoice": boolean,
  "examType": "traditional" or "frq-only" or "portfolio"
}`;

    const response = await llm.invoke(prompt);
    
    // Clean JSON content to remove markdown code blocks
    const cleanJsonContent = (content) => {
      if (typeof content !== 'string') return content;
      return content
        .replace(/^```json\s*/i, '')
        .replace(/\s*```\s*$/i, '')
        .trim();
    };
    
    const cleanedContent = cleanJsonContent(response.content);
    const analysis = JSON.parse(cleanedContent);
    
    // Determine exam type with smarter logic
    let examType = analysis.examType;
    const frqOnlyCoursesList = ['ap-seminar']; // Only truly FRQ-only course
    const hasMultipleChoice = analysis.hasMultipleChoice !== false && analysis.mcqCount !== undefined;
    
    // If AI says mcqCount is 0, check if it's really an FRQ-only course
    if (analysis.mcqCount === 0) {
      if (frqOnlyCoursesList.includes(courseName.toLowerCase())) {
        examType = 'frq-only';
      } else {
        // Not in FRQ-only list - this is a parsing error, use traditional defaults
        examType = 'traditional';
        console.log(`MCQ count is 0 for ${courseName}, will use traditional defaults`);
      }
    } else {
      examType = 'traditional';
    }
    
    if (!examType) {
      if (analysis.mcqCount === 0 && analysis.frqCount === 0) {
        examType = 'portfolio';
      } else {
        examType = 'traditional';
      }
    }
    
    const hasTraditionalExam = examType !== 'portfolio';
    
    // Use smart defaults for traditional exams
    const isTraditionalExam = examType === 'traditional';
    let defaultMcq = isTraditionalExam ? 55 : 0;
    let defaultFrq = isTraditionalExam ? 3 : 0;
    let defaultMcqTime = isTraditionalExam ? 55 : 0;
    let defaultFrqTime = isTraditionalExam ? 100 : 0;
    
    // If analysis failed completely, use hardcoded defaults
    if (analysis.mcqCount === 0 && analysis.frqCount === 0 && examType !== 'frq-only') {
      console.log(`Analysis failed for ${courseName}, using hardcoded defaults`);
      const defaults = getDefaultExamFormat(courseName);
      return defaults;
    }
    
    // If mcqCount is 0 but not in FRQ-only list, use defaults
    if (analysis.mcqCount === 0 && !frqOnlyCoursesList.includes(courseName.toLowerCase()) && examType === 'traditional') {
      console.log(`MCQ count is 0 for ${courseName}, using defaults`);
      const defaults = getDefaultExamFormat(courseName);
      if (defaults.mcqCount > 0) {
        return defaults;
      }
    }
    
    return {
      courseName,
      mcqCount: analysis.mcqCount ?? defaultMcq,
      frqCount: analysis.frqCount ?? defaultFrq,
      mcqTimeMinutes: analysis.mcqTimeMinutes ?? defaultMcqTime,
      frqTimeMinutes: analysis.frqTimeMinutes ?? defaultFrqTime,
      questionTypes: analysis.questionTypes || ['general'],
      totalTimeMinutes: analysis.totalTimeMinutes ?? ((analysis.mcqTimeMinutes ?? defaultMcqTime) + (analysis.frqTimeMinutes ?? defaultFrqTime)),
      hasTraditionalExam,
      frqOnly: examType === 'frq-only',
      examType,
      source: 'ced-analysis'
    };

  } catch (error) {
    console.error('Error analyzing exam format:', error);
    return getDefaultExamFormat(courseName);
  }
}

/**
 * Get default exam format for courses
 */
function getDefaultExamFormat(courseName) {
  // Courses with NO exam at all (portfolio/performance-based only)
  const noExamCourses = [
    'ap-research', // No exam - portfolio only
    'ap-drawing', // Portfolio only
    'ap-studio-art-2d', // Portfolio only
    'ap-studio-art-3d' // Portfolio only
  ];
  
  if (noExamCourses.includes(courseName)) {
    return {
      courseName,
      mcqCount: 0,
      frqCount: 0,
      mcqTimeMinutes: 0,
      frqTimeMinutes: 0,
      questionTypes: [],
      totalTimeMinutes: 0,
      hasTraditionalExam: false,
      source: 'no-exam'
    };
  }
  
  // Courses with FRQ-only exam (no MCQs)
  const frqOnlyCourses = [
    'ap-seminar' // Written exam with only FRQs
  ];
  
  if (frqOnlyCourses.includes(courseName)) {
    return {
      courseName,
      mcqCount: 0,
      frqCount: 4, // AP Seminar has multiple written tasks
      mcqTimeMinutes: 0,
      frqTimeMinutes: 120,
      questionTypes: ['general', 'analysis', 'argument'],
      totalTimeMinutes: 120,
      hasTraditionalExam: true,
      frqOnly: true,
      source: 'frq-only'
    };
  }
  
  const defaults = {
    'ap-psychology': { mcqCount: 100, frqCount: 2, mcqTimeMinutes: 70, frqTimeMinutes: 50, questionTypes: ['SAQ', 'LEQ'], totalTimeMinutes: 120 },
    'ap-world-history': { mcqCount: 55, frqCount: 3, mcqTimeMinutes: 55, frqTimeMinutes: 100, questionTypes: ['SAQ', 'DBQ', 'LEQ'], totalTimeMinutes: 155 },
    'ap-united-states-history': { mcqCount: 55, frqCount: 3, mcqTimeMinutes: 55, frqTimeMinutes: 100, questionTypes: ['SAQ', 'DBQ', 'LEQ'], totalTimeMinutes: 155 },
    'ap-calculus-ab': { mcqCount: 45, frqCount: 6, mcqTimeMinutes: 60, frqTimeMinutes: 90, questionTypes: ['general'], totalTimeMinutes: 150 },
    'ap-calculus-bc': { mcqCount: 45, frqCount: 6, mcqTimeMinutes: 60, frqTimeMinutes: 90, questionTypes: ['general'], totalTimeMinutes: 150 },
    'ap-biology': { mcqCount: 60, frqCount: 6, mcqTimeMinutes: 90, frqTimeMinutes: 90, questionTypes: ['general'], totalTimeMinutes: 180 },
    'ap-chemistry': { mcqCount: 60, frqCount: 7, mcqTimeMinutes: 90, frqTimeMinutes: 105, questionTypes: ['general'], totalTimeMinutes: 195 },
    'ap-physics-1': { mcqCount: 50, frqCount: 5, mcqTimeMinutes: 90, frqTimeMinutes: 90, questionTypes: ['general'], totalTimeMinutes: 180 },
    'ap-physics-2': { mcqCount: 50, frqCount: 5, mcqTimeMinutes: 90, frqTimeMinutes: 90, questionTypes: ['general'], totalTimeMinutes: 180 },
    'ap-physics-c-mechanics': { mcqCount: 35, frqCount: 3, mcqTimeMinutes: 45, frqTimeMinutes: 45, questionTypes: ['general'], totalTimeMinutes: 90 },
    'ap-physics-c-electricity': { mcqCount: 35, frqCount: 3, mcqTimeMinutes: 45, frqTimeMinutes: 45, questionTypes: ['general'], totalTimeMinutes: 90 },
    'ap-statistics': { mcqCount: 40, frqCount: 6, mcqTimeMinutes: 90, frqTimeMinutes: 90, questionTypes: ['general'], totalTimeMinutes: 180 },
    'ap-computer-science-a': { mcqCount: 40, frqCount: 4, mcqTimeMinutes: 90, frqTimeMinutes: 90, questionTypes: ['general'], totalTimeMinutes: 180 },
    'ap-computer-science-principles': { mcqCount: 70, frqCount: 0, mcqTimeMinutes: 120, frqTimeMinutes: 0, questionTypes: ['general'], totalTimeMinutes: 120 },
    'ap-economics-macro': { mcqCount: 60, frqCount: 3, mcqTimeMinutes: 70, frqTimeMinutes: 60, questionTypes: ['general'], totalTimeMinutes: 130 },
    'ap-economics-micro': { mcqCount: 60, frqCount: 3, mcqTimeMinutes: 70, frqTimeMinutes: 60, questionTypes: ['general'], totalTimeMinutes: 130 },
    'ap-english-language': { mcqCount: 45, frqCount: 3, mcqTimeMinutes: 60, frqTimeMinutes: 135, questionTypes: ['general'], totalTimeMinutes: 195 },
    'ap-english-literature': { mcqCount: 55, frqCount: 3, mcqTimeMinutes: 60, frqTimeMinutes: 120, questionTypes: ['general'], totalTimeMinutes: 180 },
    'ap-environmental-science': { mcqCount: 80, frqCount: 3, mcqTimeMinutes: 90, frqTimeMinutes: 70, questionTypes: ['general'], totalTimeMinutes: 160 },
    'ap-human-geography': { mcqCount: 60, frqCount: 3, mcqTimeMinutes: 60, frqTimeMinutes: 75, questionTypes: ['general'], totalTimeMinutes: 135 },
    'ap-us-government-and-politics': { mcqCount: 55, frqCount: 4, mcqTimeMinutes: 80, frqTimeMinutes: 100, questionTypes: ['general'], totalTimeMinutes: 180 },
    'ap-comparative-government-and-politics': { mcqCount: 55, frqCount: 4, mcqTimeMinutes: 80, frqTimeMinutes: 100, questionTypes: ['general'], totalTimeMinutes: 180 },
    'ap-european-history': { mcqCount: 55, frqCount: 3, mcqTimeMinutes: 55, frqTimeMinutes: 100, questionTypes: ['SAQ', 'DBQ', 'LEQ'], totalTimeMinutes: 155 },
    'ap-art-history': { mcqCount: 80, frqCount: 6, mcqTimeMinutes: 60, frqTimeMinutes: 120, questionTypes: ['general'], totalTimeMinutes: 180 },
    'ap-music-theory': { mcqCount: 75, frqCount: 9, mcqTimeMinutes: 80, frqTimeMinutes: 80, questionTypes: ['general'], totalTimeMinutes: 160 }
  };

  const defaultFormat = defaults[courseName];
  
  if (!defaultFormat) {
    // Unknown course - use generic defaults but mark as traditional exam
    return {
      courseName,
      mcqCount: 55,
      frqCount: 3,
      mcqTimeMinutes: 55,
      frqTimeMinutes: 100,
      questionTypes: ['general'],
      totalTimeMinutes: 155,
      hasTraditionalExam: true,
      frqOnly: false,
      examType: 'traditional',
      source: 'default-unknown'
    };
  }
  
  return {
    courseName,
    ...defaultFormat,
    hasTraditionalExam: true,
    frqOnly: false,
    examType: 'traditional',
    source: 'default'
  };
}
