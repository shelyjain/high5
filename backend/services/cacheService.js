import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const CACHE_FILE = path.join(process.cwd(), 'data', 'mcq_cache.json');

/**
 * Read the MCQ cache from disk
 */
export function readCache() {
  try {
    if (!fs.existsSync(CACHE_FILE)) {
      return {};
    }
    const data = fs.readFileSync(CACHE_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading MCQ cache:', error);
    return {};
  }
}

/**
 * Write the MCQ cache to disk
 */
export function writeCache(cache) {
  try {
    // Ensure data directory exists
    const dataDir = path.dirname(CACHE_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing MCQ cache:', error);
    return false;
  }
}

/**
 * Get cached questions for a specific course and unit
 */
export function getCachedQuestions(courseId, unitNumber) {
  const cache = readCache();
  const unitKey = `unit-${unitNumber}`;
  
  if (cache[courseId] && cache[courseId][unitKey]) {
    return cache[courseId][unitKey];
  }
  
  return null;
}

/**
 * Cache questions for a specific course and unit
 */
export function cacheQuestions(courseId, unitNumber, questions, cedHash = null) {
  const cache = readCache();
  const unitKey = `unit-${unitNumber}`;
  
  if (!cache[courseId]) {
    cache[courseId] = {};
  }
  
  cache[courseId][unitKey] = {
    questions,
    generatedAt: new Date().toISOString(),
    cedHash
  };
  
  return writeCache(cache);
}

/**
 * Check if cache is valid (CED hasn't changed)
 */
export function isCacheValid(courseId, unitNumber, currentCedHash) {
  const cached = getCachedQuestions(courseId, unitNumber);
  if (!cached) return false;
  
  // If no hash provided, assume valid
  if (!currentCedHash) return true;
  
  return cached.cedHash === currentCedHash;
}

/**
 * Generate hash for a file (used to detect CED changes)
 */
export function generateFileHash(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    const fileBuffer = fs.readFileSync(filePath);
    return crypto.createHash('md5').update(fileBuffer).digest('hex');
  } catch (error) {
    console.error('Error generating file hash:', error);
    return null;
  }
}

/**
 * Clear cache for a specific course
 */
export function clearCourseCache(courseId) {
  const cache = readCache();
  if (cache[courseId]) {
    delete cache[courseId];
    return writeCache(cache);
  }
  return true;
}

/**
 * Get all available units for a course from cache
 */
export function getAvailableUnits(courseId) {
  const cache = readCache();
  if (!cache[courseId]) return [];
  
  return Object.keys(cache[courseId])
    .filter(key => key.startsWith('unit-'))
    .map(key => parseInt(key.replace('unit-', '')))
    .sort((a, b) => a - b);
}
