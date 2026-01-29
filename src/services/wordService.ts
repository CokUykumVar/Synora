import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'react-native';
import { Word, WordLevel, WordDataFile, LearnedWord, LanguageCode } from '../types/word';
import { getWordImageUrl } from '../config/cloudinary';

// Import word data files (will be created per category)
// These will be lazy loaded
const WORD_DATA_IMPORTS: Record<string, () => Promise<WordDataFile>> = {
  food: () => import('../data/words/food.json').then(m => m.default),
  travel: () => import('../data/words/travel.json').then(m => m.default),
  business: () => import('../data/words/business.json').then(m => m.default),
  technology: () => import('../data/words/technology.json').then(m => m.default),
  health: () => import('../data/words/health.json').then(m => m.default),
  sports: () => import('../data/words/sports.json').then(m => m.default),
  music: () => import('../data/words/music.json').then(m => m.default),
  entertainment: () => import('../data/words/entertainment.json').then(m => m.default),
  nature: () => import('../data/words/nature.json').then(m => m.default),
  shopping: () => import('../data/words/shopping.json').then(m => m.default),
  family: () => import('../data/words/family.json').then(m => m.default),
  education: () => import('../data/words/education.json').then(m => m.default),
};

// In-memory cache for loaded word data
const wordCache: Map<string, Word[]> = new Map();

// Storage keys
const LEARNED_WORDS_KEY = 'synora_learned_words';
const IMAGE_CACHE_KEY = 'synora_cached_images';

/**
 * Load words for a specific category
 */
export async function loadWordsByCategory(category: string): Promise<Word[]> {
  // Check cache first
  if (wordCache.has(category)) {
    return wordCache.get(category)!;
  }

  // Load from JSON file
  const loader = WORD_DATA_IMPORTS[category];
  if (!loader) {
    console.warn(`No word data found for category: ${category}`);
    return [];
  }

  try {
    const data = await loader();
    wordCache.set(category, data.words);
    return data.words;
  } catch (error) {
    console.error(`Error loading words for ${category}:`, error);
    return [];
  }
}

/**
 * Get words filtered by level
 */
export async function getWordsByLevel(
  category: string,
  level: WordLevel
): Promise<Word[]> {
  const words = await loadWordsByCategory(category);
  return words.filter(word => word.levels.includes(level));
}

/**
 * Get words with translations for specific language pair
 */
export async function getWordsForLearning(
  category: string,
  learningLang: LanguageCode,
  nativeLang: LanguageCode,
  level?: WordLevel
): Promise<Array<Word & { displayWord: string; displayTranslation: string }>> {
  let words = await loadWordsByCategory(category);

  // Filter by level if specified
  if (level) {
    words = words.filter(word => word.levels.includes(level));
  }

  // Map to include display values
  return words
    .filter(word => {
      // Ensure both translations exist
      const hasLearning = learningLang === 'en' ? word.word : word.translations[learningLang];
      const hasNative = nativeLang === 'en' ? word.word : word.translations[nativeLang];
      return hasLearning && hasNative;
    })
    .map(word => ({
      ...word,
      displayWord: learningLang === 'en' ? word.word : (word.translations[learningLang] || word.word),
      displayTranslation: nativeLang === 'en' ? word.word : (word.translations[nativeLang] || ''),
    }));
}

/**
 * Search words across all categories
 */
export async function searchWords(
  query: string,
  language: LanguageCode
): Promise<Word[]> {
  const results: Word[] = [];
  const searchTerm = query.toLowerCase();

  for (const category of Object.keys(WORD_DATA_IMPORTS)) {
    const words = await loadWordsByCategory(category);
    const matches = words.filter(word => {
      // Search in base word
      if (word.word.toLowerCase().includes(searchTerm)) return true;

      // Search in translations
      const translation = word.translations[language];
      if (translation && translation.toLowerCase().includes(searchTerm)) return true;

      // Search in tags
      if (word.tags?.some(tag => tag.toLowerCase().includes(searchTerm))) return true;

      return false;
    });
    results.push(...matches);
  }

  return results;
}

/**
 * Prefetch images for a list of words
 */
export async function prefetchWordImages(
  words: Word[],
  size: 'thumbnail' | 'medium' = 'thumbnail'
): Promise<void> {
  const urls = words.map(word => getWordImageUrl(word.image, size));

  await Promise.all(
    urls.map(url =>
      Image.prefetch(url).catch(err => {
        console.warn('Failed to prefetch image:', url, err);
      })
    )
  );
}

/**
 * Get learned words progress
 */
export async function getLearnedWords(): Promise<LearnedWord[]> {
  try {
    const stored = await AsyncStorage.getItem(LEARNED_WORDS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading learned words:', error);
    return [];
  }
}

/**
 * Mark a word as learned or update progress
 */
export async function updateWordProgress(
  wordId: string,
  category: string,
  correct: boolean
): Promise<void> {
  const learnedWords = await getLearnedWords();
  const existingIndex = learnedWords.findIndex(w => w.wordId === wordId);

  const now = new Date().toISOString();

  if (existingIndex >= 0) {
    // Update existing
    const word = learnedWords[existingIndex];
    if (correct) {
      word.correctCount++;
    } else {
      word.incorrectCount++;
    }
    word.lastReviewedAt = now;
    word.mastery = calculateMastery(word.correctCount, word.incorrectCount);
    word.nextReviewAt = calculateNextReview(word.mastery);
  } else {
    // Add new
    learnedWords.push({
      wordId,
      category,
      learnedAt: now,
      correctCount: correct ? 1 : 0,
      incorrectCount: correct ? 0 : 1,
      lastReviewedAt: now,
      nextReviewAt: calculateNextReview(correct ? 20 : 0),
      mastery: correct ? 20 : 0,
    });
  }

  await AsyncStorage.setItem(LEARNED_WORDS_KEY, JSON.stringify(learnedWords));
}

/**
 * Calculate mastery level (0-100)
 */
function calculateMastery(correct: number, incorrect: number): number {
  const total = correct + incorrect;
  if (total === 0) return 0;

  const accuracy = correct / total;
  const repetitionBonus = Math.min(total * 5, 50); // Max 50 points from repetition

  return Math.min(Math.round(accuracy * 50 + repetitionBonus), 100);
}

/**
 * Calculate next review date based on mastery (spaced repetition)
 */
function calculateNextReview(mastery: number): string {
  const now = new Date();
  let daysToAdd = 1;

  if (mastery >= 90) daysToAdd = 30;
  else if (mastery >= 70) daysToAdd = 14;
  else if (mastery >= 50) daysToAdd = 7;
  else if (mastery >= 30) daysToAdd = 3;
  else daysToAdd = 1;

  now.setDate(now.getDate() + daysToAdd);
  return now.toISOString();
}

/**
 * Get words due for review
 */
export async function getWordsForReview(): Promise<LearnedWord[]> {
  const learnedWords = await getLearnedWords();
  const now = new Date();

  return learnedWords.filter(word => {
    const reviewDate = new Date(word.nextReviewAt);
    return reviewDate <= now;
  });
}

/**
 * Get statistics for a category
 */
export async function getCategoryStats(category: string): Promise<{
  totalWords: number;
  learnedWords: number;
  masteredWords: number;
  averageMastery: number;
}> {
  const words = await loadWordsByCategory(category);
  const learnedWords = await getLearnedWords();

  const categoryLearned = learnedWords.filter(w => w.category === category);
  const masteredWords = categoryLearned.filter(w => w.mastery >= 80);

  const totalMastery = categoryLearned.reduce((sum, w) => sum + w.mastery, 0);
  const averageMastery = categoryLearned.length > 0
    ? Math.round(totalMastery / categoryLearned.length)
    : 0;

  return {
    totalWords: words.length,
    learnedWords: categoryLearned.length,
    masteredWords: masteredWords.length,
    averageMastery,
  };
}

/**
 * Clear word cache (useful for memory management)
 */
export function clearWordCache(): void {
  wordCache.clear();
}
