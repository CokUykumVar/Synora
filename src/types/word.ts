// Word difficulty levels
export type WordLevel = 'beginner' | 'elementary' | 'intermediate' | 'advanced';

// Supported languages for translations
export type LanguageCode = 'en' | 'tr' | 'de' | 'es' | 'fr' | 'it' | 'pt' | 'ru' | 'ja' | 'ko' | 'zh' | 'ar' | 'hi' | 'nl' | 'pl' | 'sv' | 'no' | 'da' | 'fi' | 'el' | 'he' | 'th' | 'vi' | 'id' | 'ms' | 'cs' | 'ro' | 'hu' | 'uk';

// Word data structure
export interface Word {
  id: string;
  word: string;                              // Base word (usually in English)
  translations: Partial<Record<LanguageCode, string>>;  // Translations to other languages
  image?: string;                            // Optional image URL (currently using emoji system)
  levels: WordLevel[];                       // Can belong to multiple levels
  category: string;                          // Category ID (e.g., 'food', 'travel')
  pronunciation?: string;                    // IPA pronunciation
  exampleSentence?: Partial<Record<LanguageCode, string>>;  // Example sentences
  tags?: string[];                           // Additional tags for searching
}

// Category structure
export interface WordCategory {
  id: string;
  name: Record<LanguageCode, string>;        // Localized category names
  icon: string;                              // Ionicon name
  color: string;                             // Theme color
  wordCount: number;                         // Total words in category
}

// Word data file structure (per category)
export interface WordDataFile {
  category: string;
  version: number;
  lastUpdated: string;
  words: Word[];
}

// User's learned word progress
export interface LearnedWord {
  wordId: string;
  category: string;
  learnedAt: string;
  correctCount: number;
  incorrectCount: number;
  lastReviewedAt: string;
  nextReviewAt: string;                      // For spaced repetition
  mastery: number;                           // 0-100 mastery level
}
