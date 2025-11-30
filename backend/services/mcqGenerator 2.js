import { ChatOpenAI } from '@langchain/openai';
import { StructuredOutputParser } from 'langchain/output_parsers';
import { PromptTemplate } from '@langchain/core/prompts';
import { z } from 'zod';
import dotenv from 'dotenv';

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

// Create prompt template
const promptTemplate = new PromptTemplate({
  template: `You are an expert AP exam question writer. Generate {questionCount} high-quality multiple choice questions based on the provided course content.

Course: {courseName}
Unit: {unitNumber} - {unitTitle}

Content:
{content}

Instructions:
- Create questions that test understanding, not just memorization
- Make distractors plausible but clearly incorrect
- Use AP exam question format and difficulty level
- Ensure questions align with the specific unit content provided
- Include a mix of factual recall and analytical thinking questions
- Keep explanations concise but informative

{format_instructions}`,
  inputVariables: ['courseName', 'unitNumber', 'unitTitle', 'content', 'questionCount'],
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
    
    // Create the prompt
    const prompt = await promptTemplate.format({
      courseName,
      unitNumber,
      unitTitle,
      content: truncatedContent,
      questionCount
    });
    
    // Generate response
    const response = await llm.invoke(prompt);
    
    // Parse the structured output
    const parsedResponse = await outputParser.parse(response.content);
    
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
  const baseQuestions = [
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
      template: `You are an expert AP exam question writer. Generate {questionCount} high-quality multiple choice questions based on the provided course content, with a focus on areas where the student needs improvement.

Course: {courseName}
Unit: {unitNumber} - {unitTitle}

Content:
{content}

Previous Performance Analysis:
{performanceAnalysis}

Instructions:
- Create questions that test understanding, not just memorization
- Focus on concepts and topics where the student has shown weakness
- Make distractors plausible but clearly incorrect
- Use AP exam question format and difficulty level
- Ensure questions align with the specific unit content provided
- Include a mix of factual recall and analytical thinking questions
- Keep explanations concise but informative
- Prioritize questions that address identified knowledge gaps

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
    
    // Parse the structured output
    const parsedResponse = await outputParser.parse(response.content);
    
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
