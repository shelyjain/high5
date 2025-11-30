import fs from 'fs';
import path from 'path';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { generateFileHash } from './cacheService.js';

const CEDS_DIR = path.join(process.cwd(), 'ceds');

// Store parsed CED content in memory
const cedContent = new Map();

// Keywords and patterns used to identify rubric sections
const RUBRIC_KEYWORDS = [
  'scoring rubric',
  'scoring guidelines',
  'free-response question',
  'frq rubric',
  'essay rubric',
  'long essay question',
  'document-based question',
  'dbq rubric',
  'leq rubric',
  'short-answer question',
  'saq rubric',
  'performance task rubric',
  'performance task scoring',
  'evaluation rubric',
  'analytic rubric',
  'holistic rubric'
];

const QUESTION_TYPE_PATTERNS = [
  {
    id: 'dbq',
    label: 'Document-Based Question (DBQ)',
    patterns: [/document[-\s]*based question/i, /\bdbq\b/i]
  },
  {
    id: 'leq',
    label: 'Long Essay Question (LEQ)',
    patterns: [/long essay question/i, /\bleq\b/i]
  },
  {
    id: 'saq',
    label: 'Short-Answer Question (SAQ)',
    patterns: [/short[-\s]*answer question/i, /\bsaq\b/i]
  },
  {
    id: 'argument-essay',
    label: 'Argument Essay',
    patterns: [/argument essay/i]
  },
  {
    id: 'synthesis-essay',
    label: 'Synthesis Essay',
    patterns: [/synthesis essay/i]
  },
  {
    id: 'rhetorical-analysis',
    label: 'Rhetorical Analysis',
    patterns: [/rhetorical analysis/i]
  },
  {
    id: 'research-presentation',
    label: 'Research Presentation',
    patterns: [/presentation rubric/i, /research presentation/i]
  },
  {
    id: 'performance-task',
    label: 'Performance Task',
    patterns: [/performance task/i]
  },
  {
    id: 'general',
    label: 'General Free-Response Guidance',
    patterns: [/free-response/i, /essay question/i, /writing rubric/i]
  }
];

const STOP_WORDS = new Set([
  'the','and','for','with','that','from','this','which','their','will','into',
  'have','include','includes','including','such','should','must','each','students',
  'student','score','scoring','points','point','criteria','criterion','may','also',
  'use','using','used','through','your','they','them','there','where','when','what',
  'been','being','are','were','was','has','had','but','because','about','across',
  'within','make','makes','made','show','shows','provide','provided','provides',
  'demonstrate','demonstrates','demonstrated','explain','explains','explained',
  'analysis','analyze','analyzes','clearly','adequate','adequately','related',
  'relevant','support','supports','supporting','evidence','example','examples'
]);

/**
 * Discover all CED PDF files in the ceds directory
 */
export function discoverCedFiles() {
  try {
    if (!fs.existsSync(CEDS_DIR)) {
      console.log('CEDs directory does not exist, creating it...');
      fs.mkdirSync(CEDS_DIR, { recursive: true });
      return [];
    }

    const files = fs.readdirSync(CEDS_DIR)
      .filter(file => file.toLowerCase().endsWith('.pdf'))
      .map(file => ({
        filename: file,
        courseId: extractCourseId(file),
        filepath: path.join(CEDS_DIR, file)
      }))
      .filter(file => file.courseId); // Only include files with valid course IDs

    console.log(`Discovered ${files.length} CED files:`, files.map(f => f.filename));
    return files;
  } catch (error) {
    console.error('Error discovering CED files:', error);
    return [];
  }
}

/**
 * Extract course ID from filename (e.g., "ap-world-history.pdf" -> "ap-world-history")
 */
function extractCourseId(filename) {
  const match = filename.match(/^(.+)\.pdf$/i);
  return match ? match[1].toLowerCase() : null;
}

/**
 * Parse a single CED PDF file and extract unit structure
 */
export async function parseCedFile(filepath) {
  try {
    console.log(`Parsing CED file: ${filepath}`);
    
    // Load PDF
    const loader = new PDFLoader(filepath);
    const docs = await loader.load();
    
    // Combine all pages into one text
    const fullText = docs.map(doc => doc.pageContent).join('\n\n');
    
    // Split into chunks
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1500,
      chunkOverlap: 200,
      separators: ['\n\n', '\n', '. ', ' ', '']
    });
    
    const chunks = await textSplitter.splitText(fullText);
    
    // Extract unit structure
    const units = extractUnits(chunks);
    const rubrics = extractRubrics(chunks);
    const examOverview = extractExamOverview(fullText);
    
    console.log(`Parsed ${chunks.length} chunks, found ${units.size} units`);
    return {
      chunks,
      units,
      rubrics,
      fullText,
      examOverview,
      hash: generateFileHash(filepath)
    };
  } catch (error) {
    console.error(`Error parsing CED file ${filepath}:`, error);
    throw error;
  }
}

/**
 * Extract unit structure from text chunks
 */
function extractUnits(chunks) {
  const units = new Map();
  
  // Common unit patterns in AP CEDs
  const unitPatterns = [
    /unit\s+(\d+)[\s:]/gi,
    /chapter\s+(\d+)[\s:]/gi,
    /part\s+(\d+)[\s:]/gi,
    /section\s+(\d+)[\s:]/gi
  ];
  
  chunks.forEach((chunk, index) => {
    for (const pattern of unitPatterns) {
      const matches = [...chunk.matchAll(pattern)];
      
      matches.forEach(match => {
        const unitNumber = parseInt(match[1]);
        if (unitNumber >= 1 && unitNumber <= 15) { // Reasonable unit range
          const unitKey = `unit-${unitNumber}`;
          
          if (!units.has(unitKey)) {
            units.set(unitKey, {
              number: unitNumber,
              chunks: [],
              title: extractUnitTitle(chunk, match.index)
            });
          }
          
          // Add this chunk to the unit
          units.get(unitKey).chunks.push({
            content: chunk,
            index
          });
        }
      });
    }
  });
  
  // If no units found, create default units based on chunk distribution
  if (units.size === 0) {
    console.log('No unit structure found, creating default units...');
    return createDefaultUnits(chunks);
  }
  
  return units;
}

/**
 * Extract unit title from chunk text
 */
function extractUnitTitle(chunk, matchIndex) {
  const lines = chunk.split('\n');
  const matchLine = lines.find(line => 
    line.toLowerCase().includes('unit') && 
    line.toLowerCase().includes(matchIndex.toString())
  );
  
  if (matchLine) {
    // Clean up the title
    return matchLine
      .replace(/unit\s+\d+[\s:]*/gi, '')
      .trim()
      .substring(0, 100); // Limit length
  }
  
  return 'Unit Content';
}

/**
 * Create default units when no structure is found
 */
function createDefaultUnits(chunks) {
  const units = new Map();
  const chunksPerUnit = Math.ceil(chunks.length / 9); // Assume 9 units max
  
  for (let i = 1; i <= 9; i++) {
    const startIndex = (i - 1) * chunksPerUnit;
    const endIndex = Math.min(i * chunksPerUnit, chunks.length);
    
    if (startIndex < chunks.length) {
      const unitChunks = chunks.slice(startIndex, endIndex).map((content, index) => ({
        content,
        index: startIndex + index
      }));
      
      units.set(`unit-${i}`, {
        number: i,
        chunks: unitChunks,
        title: `Unit ${i}`
      });
    }
  }
  
  return units;
}

/**
 * Extract exam overview section from CED
 */
function extractExamOverview(fullText) {
  try {
    const text = fullText.toLowerCase();
    
    // Look for exam overview section
    const examOverviewPatterns = [
      /exam overview[^]*?(?=how the curriculum framework|how course content|course framework|unit)/i,
      /the exam[^]*?(?=how the curriculum framework|how course content|course framework|unit)/i,
      /exam structure[^]*?(?=how the curriculum framework|how course content|course framework|unit)/i,
      /assessment overview[^]*?(?=how the curriculum framework|how course content|course framework|unit)/i
    ];
    
    let examOverview = '';
    for (const pattern of examOverviewPatterns) {
      const match = fullText.match(pattern);
      if (match && match[0].length > 100) {
        examOverview = match[0];
        break;
      }
    }
    
    // If no section found, look for exam-related content in first few pages
    if (!examOverview) {
      const firstThird = fullText.substring(0, fullText.length / 3);
      const examKeywords = ['multiple choice', 'free response', 'section i', 'section ii', 'question'];
      const hasExamContent = examKeywords.some(keyword => firstThird.toLowerCase().includes(keyword));
      
      if (hasExamContent) {
        examOverview = firstThird.substring(0, 3000); // Take first 3000 chars
      }
    }
    
    return examOverview || '';
  } catch (error) {
    console.error('Error extracting exam overview:', error);
    return '';
  }
}

/**
 * Get unit content for a specific course and unit
 */
export function getUnitContent(courseId, unitNumber) {
  const cedId = mapCourseIdToCedId(courseId);
  const courseData = cedContent.get(cedId);
  if (!courseData) {
    return null;
  }
  
  const unitKey = `unit-${unitNumber}`;
  const unit = courseData.units.get(unitKey);
  
  if (!unit) {
    return null;
  }
  
  // Combine all chunks for this unit
  const content = unit.chunks
    .map(chunk => chunk.content)
    .join('\n\n');
  
  return {
    content,
    title: unit.title,
    chunkCount: unit.chunks.length
  };
}

/**
 * Get all available units for a course
 */
export function getAvailableUnits(courseId) {
  const cedId = mapCourseIdToCedId(courseId);
  const courseData = cedContent.get(cedId);
  if (!courseData) {
    return [];
  }
  
  return Array.from(courseData.units.keys())
    .map(key => parseInt(key.replace('unit-', '')))
    .sort((a, b) => a - b);
}

/**
 * Get exam overview from CED
 */
export function getExamOverview(courseId) {
  const cedId = mapCourseIdToCedId(courseId);
  const courseData = cedContent.get(cedId);
  
  if (!courseData || !courseData.examOverview) {
    return '';
  }
  
  return courseData.examOverview;
}

/**
 * Initialize CED parsing for all discovered files
 */
export async function initializeCedParsing() {
  console.log('Initializing CED parsing...');
  
  const cedFiles = discoverCedFiles();
  
  if (cedFiles.length === 0) {
    console.log('No CED files found. Place PDF files in the /backend/ceds/ directory.');
    return;
  }
  
  for (const cedFile of cedFiles) {
    try {
      const parsedData = await parseCedFile(cedFile.filepath);
      cedContent.set(cedFile.courseId, parsedData);
      console.log(`Successfully parsed CED for ${cedFile.courseId}`);
    } catch (error) {
      console.error(`Failed to parse CED for ${cedFile.courseId}:`, error);
    }
  }
  
  console.log(`CED parsing complete. Loaded ${cedContent.size} courses.`);
}

/**
 * Get CED hash for cache invalidation
 */
export function getCedHash(courseId) {
  const courseData = cedContent.get(courseId);
  return courseData ? courseData.hash : null;
}

/**
 * Map frontend course IDs to backend CED file names
 */
export function mapCourseIdToCedId(courseId) {
  const courseMapping = {
    'ap-psychology': 'ap-psychology-ced',
    'ap-human-geography': 'ap-human-geography-ced',
    'ap-macroeconomics': 'ap-macroeconomics-ced',
    'ap-microeconomics': 'ap-microeconomics-ced',
    'ap-us-government-and-politics': 'ap-us-government-and-politics-ced',
    'ap-comparative-government-and-politics': 'ap-comparative-government-and-politics-ced',
    'ap-united-states-history': 'ap-united-states-history',
    'ap-world-history': 'ap-world-history',
    'ap-european-history': 'ap-european-history',
    'ap-english-language': 'ap-english-language',
    'ap-english-literature': 'ap-english-literature',
    'ap-art-history': 'ap-art-history',
    'ap-drawing': 'ap-drawing',
    'ap-studio-art-2d': 'ap-studio-art-2d',
    'ap-studio-art-3d': 'ap-studio-art-3d',
    'ap-music-theory': 'ap-music-theory',
    'ap-research': 'ap-research',
    'ap-seminar': 'ap-seminar',
    'ap-african-american-studies': 'ap-african-american-studies'
  };
  
  return courseMapping[courseId] || courseId;
}

/**
 * Check if a course has been parsed
 */
export function hasCourseData(courseId) {
  const cedId = mapCourseIdToCedId(courseId);
  return cedContent.has(cedId);
}

/**
 * Extract rubric segments from CED content
 */
function extractRubrics(chunks) {
  const rubrics = [];
  const usedIndices = new Set();

  chunks.forEach((chunk, index) => {
    if (usedIndices.has(index)) {
      return;
    }

    const normalized = chunk.toLowerCase();
    const matchesKeyword = RUBRIC_KEYWORDS.some(keyword => normalized.includes(keyword));

    if (!matchesKeyword) {
      return;
    }

    const windowChunks = [chunk];
    const collectedIndices = [index];

    // Capture adjacent chunks if they likely continue the rubric section
    for (let offset = 1; offset <= 2; offset++) {
      const nextIndex = index + offset;
      if (nextIndex < chunks.length) {
        const nextChunk = chunks[nextIndex];
        const nextNormalized = nextChunk.toLowerCase();
        const continuation = RUBRIC_KEYWORDS.some(keyword => nextNormalized.includes(keyword)) ||
          nextNormalized.includes('score point') ||
          nextNormalized.includes('score of') ||
          nextNormalized.includes('points for') ||
          nextNormalized.includes('earning');

        if (continuation) {
          windowChunks.push(nextChunk);
          collectedIndices.push(nextIndex);
        } else if (offset === 1) {
          // Include immediate context even if no keywords for readability
          windowChunks.push(nextChunk);
          collectedIndices.push(nextIndex);
        }
      }
    }

    collectedIndices.forEach(i => usedIndices.add(i));

    const combinedContent = windowChunks.join('\n\n');
    const title = extractRubricTitle(combinedContent);
    const questionTypes = detectQuestionTypes(combinedContent);
    const keywordSet = buildKeywordSet(combinedContent);

    const rubric = {
      id: `rubric-${index}`,
      title,
      questionTypes,
      content: combinedContent,
      preview: generatePreview(combinedContent),
      chunkIndices: collectedIndices,
      keywords: Array.from(keywordSet)
    };

    Object.defineProperty(rubric, 'keywordSet', {
      value: keywordSet,
      enumerable: false,
      configurable: false,
      writable: false
    });

    rubrics.push(rubric);
  });

  return rubrics;
}

/**
 * Extract a reasonable title for a rubric section
 */
function extractRubricTitle(content) {
  const lines = content
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    const upperCaseLine = line.toUpperCase();
    if (
      (upperCaseLine.includes('RUBRIC') || upperCaseLine.includes('SCORING')) &&
      line.length <= 120
    ) {
      return normalizeTitle(line);
    }
    if (upperCaseLine.includes('FREE-RESPONSE') && line.length <= 120) {
      return normalizeTitle(line);
    }
  }

  return 'Rubric Guidance';
}

function normalizeTitle(title) {
  if (!title) return 'Rubric Guidance';
  const cleaned = title
    .replace(/\s+/g, ' ')
    .replace(/[\u2022\u2023\u25E6\u2043\u2219]/g, '')
    .trim();
  if (!cleaned) return 'Rubric Guidance';
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

/**
 * Detect likely question types referenced by the rubric
 */
function detectQuestionTypes(content) {
  const types = new Set();
  QUESTION_TYPE_PATTERNS.forEach(({ id, patterns }) => {
    if (patterns.some(pattern => pattern.test(content))) {
      types.add(id);
    }
  });

  if (types.size === 0) {
    types.add('general');
  }

  return Array.from(types);
}

/**
 * Build keyword set for a rubric chunk
 */
function buildKeywordSet(content) {
  const words = content
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(token => token.length > 3 && !STOP_WORDS.has(token));

  return new Set(words);
}

function generatePreview(content, length = 420) {
  const cleaned = content.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= length) return cleaned;
  return `${cleaned.slice(0, length)}…`;
}

/**
 * Get raw rubric segments for a course
 */
export function getRubricSegments(courseId) {
  const cedId = mapCourseIdToCedId(courseId);
  const courseData = cedContent.get(cedId);
  if (!courseData?.rubrics) {
    return [];
  }
  return courseData.rubrics;
}

/**
 * Return rubric segments most relevant to a question/prompt
 */
export function findRelevantRubrics(courseId, { questionType, prompt = '', responseText = '' } = {}) {
  const cedId = mapCourseIdToCedId(courseId);
  const courseData = cedContent.get(cedId);
  if (!courseData?.rubrics) {
    return [];
  }

  // Filter out unwanted rubric segments
  const unwantedPatterns = [
    'Document-Based Question (DBQ) • Short-Answer Question (SAQ)',
    'Question, as well as scoring guidelines and student samples, is also available on',
    'Long Essay Question (LEQ) • General FRQ / Essay',
    'Change fostered by innovation',
    'This essay with full scoring guides and',
    'also for the score'
  ];

  const allRubrics = courseData.rubrics.filter(segment => {
    const title = segment.title?.toLowerCase() || '';
    const content = segment.content?.toLowerCase() || '';
    return !unwantedPatterns.some(pattern => 
      title.includes(pattern.toLowerCase()) || content.includes(pattern.toLowerCase())
    );
  });

  if (allRubrics.length === 0) {
    return [];
  }

  const scored = allRubrics.map(segment => {
    const score = scoreRubricSegment(segment, questionType, prompt, responseText);
    return { segment, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const topSegments = scored
    .filter(item => item.score > 0)
    .slice(0, 3)
    .map(item => item.segment);

  if (topSegments.length > 0) {
    return topSegments;
  }

  // Fallback: return up to first 2 general rubrics
  const generalRubrics = allRubrics.filter(segment => segment.questionTypes.includes('general'));
  if (generalRubrics.length > 0) {
    return generalRubrics.slice(0, 2);
  }

  return allRubrics.slice(0, 2);
}

function scoreRubricSegment(segment, questionType, prompt, responseText) {
  let score = 0;

  if (questionType && segment.questionTypes.includes(questionType)) {
    score += 8;
  } else if (segment.questionTypes.includes('general')) {
    score += 2;
  }

  const promptKeywords = buildKeywordSet(`${prompt} ${responseText}`);
  promptKeywords.forEach(keyword => {
    if (segment.keywordSet.has(keyword)) {
      score += 1;
    }
  });

  if (prompt && segment.title) {
    const normalizedPrompt = prompt.toLowerCase();
    const normalizedTitle = segment.title.toLowerCase();
    if (normalizedPrompt.includes(normalizedTitle) || normalizedTitle.includes(normalizedPrompt)) {
      score += 5;
    }
  }

  // Slight preference for rubrics with fewer chunk indices (more focused)
  score -= segment.chunkIndices.length * 0.1;

  return score;
}
