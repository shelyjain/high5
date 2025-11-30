import express from 'express';
import { ChatOpenAI } from '@langchain/openai';
import { getUnitContent, mapCourseIdToCedId } from '../services/cedParser.js';

const router = express.Router();

// Initialize OpenAI only if API key is available
let openai = null;
if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here') {
  try {
    openai = new ChatOpenAI({
      modelName: "gpt-4o-mini",
      temperature: 0.7,
      maxTokens: 200, // Reduced for shorter answers
      openAIApiKey: process.env.OPENAI_API_KEY
    });
  } catch (error) {
    console.warn('Failed to initialize OpenAI:', error.message);
  }
}

// Ask a question endpoint
router.post('/ask', async (req, res) => {
  try {
    const { question, course, unit } = req.body;

    if (!question || !course || !unit) {
      return res.status(400).json({
        success: false,
        message: 'Question, course, and unit are required'
      });
    }

    // Map frontend course ID to backend CED ID
    const cedCourseId = mapCourseIdToCedId(course);
    console.log(`Course mapping: ${course} -> ${cedCourseId}`);
    
    // Extract unit number from the unit string (e.g., "Unit 1: Unit 1" -> 1)
    const unitNumber = parseInt(unit.split(':')[0].replace('Unit', '').trim());
    console.log(`Unit parsing: "${unit}" -> ${unitNumber}`);

    // Get course content for context
    const courseContent = getUnitContent(cedCourseId, unitNumber);
    console.log(`Course content found: ${!!courseContent}`);
    
    if (!courseContent) {
      return res.status(400).json({
        success: false,
        message: 'Course or unit not found'
      });
    }

    // Check if OpenAI is available
    if (!openai) {
      return res.json({
        success: true,
        answer: `I can see you're asking about "${question}" in ${course} Unit ${unit}. While I don't have AI assistance available right now, I can tell you that this unit covers: ${courseContent.title || 'course material'}. Please refer to your course materials or textbook for detailed information about this topic.`,
        course,
        unit,
        question,
        isFallback: true
      });
    }

    // Create the prompt with content moderation
    const prompt = `
You are an AI tutor for AP courses. Answer the following question about ${course}, Unit ${unit}.

IMPORTANT: Only answer if this question is appropriate and directly related to the AP course content. If the question is:
- Off-topic or not related to AP course material
- Inappropriate, offensive, or contains profanity
- Asking for answers to specific exam questions
- Requesting personal information
- Spam or promotional content

Then respond with: "I can only answer questions related to AP course content. Please ask a question about ${course} course material."

Course Content Context:
${courseContent}

Student Question: ${question}

Provide a helpful, educational answer that:
1. Directly addresses the question
2. Uses the course content as reference
3. Explains concepts clearly
4. Provides examples when helpful
5. Encourages further learning
6. Keep the answer concise (2-3 sentences maximum)

Answer:`;

    // Get AI response
    const response = await openai.invoke([
      {
        role: "system",
        content: "You are a helpful AP course tutor. Only answer questions related to AP course content. Be educational, encouraging, and concise. Keep answers to 2-3 sentences maximum."
      },
      {
        role: "user",
        content: prompt
      }
    ]);

    const answer = response.content;

    // Check if the AI declined to answer (content moderation worked)
    if (answer.includes("I can only answer questions related to AP course content")) {
      return res.status(400).json({
        success: false,
        message: 'Question must be related to AP course content'
      });
    }

    res.json({
      success: true,
      answer: answer,
      course: course,
      unit: unit
    });

  } catch (error) {
    console.error('Error processing question:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process question'
    });
  }
});

export default router;
