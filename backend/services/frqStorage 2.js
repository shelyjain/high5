import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

const { promises: fsPromises } = fs;

const DATA_DIR = path.join(process.cwd(), 'data');
const SUBMISSIONS_PATH = path.join(DATA_DIR, 'frqSubmissions.json');
const UPLOAD_DIR = path.join(DATA_DIR, 'frq_uploads');
const MAX_IMAGE_BYTES = 12 * 1024 * 1024; // 12 MB safety limit

/**
 * Persist an FRQ submission alongside grading results.
 */
export async function saveFrqSubmission({
  courseId,
  courseName,
  questionType,
  questionPrompt,
  responseText,
  rubricSegmentIds = [],
  grade,
  imageData,
  imageOriginalName
}) {
  await ensureDataFiles();

  const submissionId = randomUUID();
  let storedImage = null;

  if (imageData) {
    storedImage = await persistImageData(imageData, submissionId, imageOriginalName);
  }

  const record = {
    id: submissionId,
    courseId,
    courseName,
    questionType,
    questionPrompt,
    responseText,
    rubricSegmentIds,
    grade,
    image: storedImage,
    createdAt: new Date().toISOString()
  };

  const current = await readExistingSubmissions();
  current.push(record);
  await fsPromises.writeFile(SUBMISSIONS_PATH, JSON.stringify(current, null, 2), 'utf-8');

  return record;
}

async function ensureDataFiles() {
  await fsPromises.mkdir(DATA_DIR, { recursive: true });
  await fsPromises.mkdir(UPLOAD_DIR, { recursive: true });

  try {
    await fsPromises.access(SUBMISSIONS_PATH, fs.constants.F_OK);
  } catch {
    await fsPromises.writeFile(SUBMISSIONS_PATH, '[]', 'utf-8');
  }
}

async function readExistingSubmissions() {
  try {
    const raw = await fsPromises.readFile(SUBMISSIONS_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (error) {
    console.warn('Failed to read existing FRQ submissions, resetting file:', error);
    return [];
  }
}

async function persistImageData(dataUrl, submissionId, originalName = 'attachment') {
  const matches = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.*)$/.exec(dataUrl);
  if (!matches) {
    throw new Error('Invalid image data format.');
  }

  const [, mimeType, base64Data] = matches;
  const buffer = Buffer.from(base64Data, 'base64');

  if (buffer.length > MAX_IMAGE_BYTES) {
    throw new Error('Attached image exceeds maximum size (12 MB).');
  }

  const extension = getExtensionFromMime(mimeType) ?? inferExtensionFromName(originalName);
  const filename = `${submissionId}${extension ? `.${extension}` : ''}`;
  const filePath = path.join(UPLOAD_DIR, filename);

  await fsPromises.writeFile(filePath, buffer);

  return {
    mimeType,
    filePath,
    originalName,
    size: buffer.length
  };
}

function getExtensionFromMime(mimeType) {
  const map = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/webp': 'webp',
    'image/gif': 'gif'
  };
  return map[mimeType] ?? null;
}

function inferExtensionFromName(name) {
  if (!name) return null;
  const match = /\.([a-z0-9]+)$/i.exec(name);
  return match ? match[1].toLowerCase() : null;
}
