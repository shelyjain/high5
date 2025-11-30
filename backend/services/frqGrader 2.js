import { ChatOpenAI } from '@langchain/openai';
import { StructuredOutputParser } from 'langchain/output_parsers';
import { z } from 'zod';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import dotenv from 'dotenv';

dotenv.config();

const GradeSchema = z.object({
  overallScore: z.number().describe('Total points earned by the student'),
  maxScore: z.number().describe('Maximum possible points for the task'),
  performanceLevel: z.string().describe('Performance band or rating (e.g., Exemplary, Proficient)'),
  summary: z.string().describe('Short paragraph summarising the evaluation'),
  strengths: z.array(z.string()).describe('Bullet points describing what the student did well'),
  improvements: z.array(z.string()).describe('Bullet points describing how to improve'),
  rubricAlignment: z.array(
    z.object({
      criterion: z.string().describe('Name of the rubric criterion'),
      score: z.number().describe('Points earned for this criterion'),
      maxScore: z.number().describe('Maximum points for this criterion'),
      explanation: z.string().describe('How the student met or missed the criterion')
    })
  ).describe('Detailed alignment to each rubric criterion considered')
});

const outputParser = StructuredOutputParser.fromZodSchema(GradeSchema);
const formatInstructions = outputParser.getFormatInstructions();

let frqLlm = null;

if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_key_here') {
  try {
    frqLlm = new ChatOpenAI({
      modelName: 'gpt-4o-mini',
      temperature: 0.25,
      maxTokens: 1400,
      openAIApiKey: process.env.OPENAI_API_KEY
    });
  } catch (error) {
    console.error('Failed to initialise OpenAI client for FRQ grading:', error);
    frqLlm = null;
  }
} else {
  console.warn('OpenAI API key missing or placeholder value. FRQ grading will use fallback messaging.');
}

/**
 * Grade a free-response submission using rubric context.
 */
export async function gradeFrqSubmission({
  courseName,
  questionPrompt,
  responseText,
  rubricSegments = [],
  questionType = 'general',
  imageData = null
}) {
  if (!frqLlm) {
    return buildFallbackGrade('OpenAI API key not configured. Unable to run automated grading.');
  }

  const rubricContext = rubricSegments.length
    ? rubricSegments
        .map((segment, idx) => {
          const header = segment.title ? `Rubric ${idx + 1}: ${segment.title}` : `Rubric ${idx + 1}`;
          return `${header}\n${segment.content}`;
        })
        .join('\n\n')
    : 'No rubric excerpts were available.';

  const systemInstructions = [
    `You are an experienced AP course grader. Assess submissions strictly against the provided rubric context.`,
    `Return your evaluation using the following JSON schema:`,
    formatInstructions,
    `If a requested numeric score is missing from the rubric, leave it as null and explain in the summary.`,
    `Only award points when the evidence clearly earns them. Cite rubric language in explanations.`
  ].join('\n\n');

  const details = [
    `Course: ${courseName ?? 'AP Course'}`,
    `Question Type: ${questionType ?? 'general'}`,
    `Prompt: ${questionPrompt || '[Not provided]'}`,
    `Rubric Context:\n${rubricContext}`,
    `Student Response (typed):\n${responseText || '[No typed response provided]'}`,
    imageData ? 'A handwritten/image response is attached for review.' : 'No handwritten/image response attached.'
  ].join('\n\n');

  const humanContent = [{ type: 'text', text: details }];

  if (imageData) {
    humanContent.push({
      type: 'image_url',
      image_url: { url: imageData }
    });
  }

  try {
    const aiResponse = await frqLlm.invoke([
      new SystemMessage(systemInstructions),
      new HumanMessage({ content: humanContent })
    ]);

    const rawContent = Array.isArray(aiResponse.content)
      ? aiResponse.content.map(part => part?.text ?? '').join(' ')
      : aiResponse.content;

    // Clean the content to handle markdown-wrapped JSON
    const cleanedContent = cleanJsonContent(rawContent);

    const parsed = await outputParser.parse(cleanedContent);

    return {
      graded: true,
      model: frqLlm.modelName,
      ...parsed
    };
  } catch (error) {
    console.error('FRQ grading failed:', error);
    return buildFallbackGrade('Automated grader encountered an error. Please try again later.');
  }
}

function cleanJsonContent(content) {
  if (!content) return content;
  
  // Remove markdown code block wrappers
  let cleaned = content.trim();
  
  // Remove ```json and ``` wrappers
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.substring(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.substring(3);
  }
  
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.substring(0, cleaned.length - 3);
  }
  
  return cleaned.trim();
}

function buildFallbackGrade(summary) {
  return {
    graded: false,
    model: null,
    overallScore: 0,
    maxScore: 7,
    performanceLevel: 'Needs Improvement',
    summary,
    strengths: [],
    improvements: ['Please provide a more complete response to receive a proper grade'],
    rubricAlignment: []
  };
}
