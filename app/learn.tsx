import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  TextInput,
  Dimensions,
  PanResponder,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import i18n from '../src/i18n';
import { useLanguage } from '../src/context/LanguageContext';
import {
  isAzureConfigured,
  speakWithAzure,
  assessPronunciation,
  getPronunciationFeedback,
  PronunciationResult,
} from '../src/services/azureSpeech';

import { colors, fontSize, spacing, borderRadius, fonts, layout } from '../src/constants/theme';
import { useUser } from '../src/context/UserContext';
import { getWordsForLanguagePair } from '../src/data/words';
import { useNetwork } from '../src/context/NetworkContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

interface Word {
  id: string;
  word: string;
  translation: string;
  pronunciation: string;
  example: string;
  exampleTranslation: string;
  image?: string;
  category?: string;
}

type LearningPhase = 'selection' | 'flashcard' | 'matching' | 'listening' | 'writing' | 'reverseTranslation' | 'pronunciation' | 'complete';

// Emoji mapping for words (based on word ID for consistency)
const wordEmojis: { [key: string]: string } = {
  '1': '🧳',   // Journey
  '2': '🏔️',   // Adventure
  '3': '🔍',   // Discover
  '4': '✈️',   // Flight
  '5': '🏨',   // Hotel
  '6': '🗺️',   // Map
  '7': '📸',   // Camera/Photo
  '8': '🎫',   // Ticket
  '9': '🧭',   // Compass/Direction
  '10': '🚂',  // Train
  '11': '🍕',  // Food
  '12': '☕',  // Coffee
  '13': '🍎',  // Apple/Fruit
  '14': '🍞',  // Bread
  '15': '🥗',  // Salad
  '16': '💼',  // Business
  '17': '💻',  // Computer
  '18': '📱',  // Phone
  '19': '🏠',  // Home
  '20': '👨‍👩‍👧',  // Family
};

// Get emoji for a word, fallback to category emoji or generic
const getWordEmoji = (wordId: string, category?: string): string => {
  if (wordEmojis[wordId]) return wordEmojis[wordId];

  // Category fallbacks
  const categoryEmojis: { [key: string]: string } = {
    travel: '✈️',
    food: '🍽️',
    business: '💼',
    technology: '💻',
    health: '🏥',
    sports: '⚽',
    music: '🎵',
    entertainment: '🎬',
    nature: '🌿',
    shopping: '🛍️',
    family: '👨‍👩‍👧',
    education: '📚',
  };

  return categoryEmojis[category || ''] || '📝';
};

export default function LearnScreen() {
  const router = useRouter();
  const { locale } = useLanguage(); // For re-render on language change
  const { review } = useLocalSearchParams<{ review?: string }>();
  const isReviewMode = review === 'true';
  const { preferences, isLoading: prefsLoading } = useUser();
  const { isConnected } = useNetwork();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const cardPosition = useRef(new Animated.ValueXY()).current;
  const cardRotation = cardPosition.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ['-10deg', '0deg', '10deg'],
  });

  const [phase, setPhase] = useState<LearningPhase>('selection');
  const [allWords, setAllWords] = useState<Word[]>([]);
  const [availableWords, setAvailableWords] = useState<Word[]>([]);
  const [masteredWordIds, setMasteredWordIds] = useState<string[]>([]);
  const [selectedWords, setSelectedWords] = useState<Word[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [exerciseResults, setExerciseResults] = useState<{
    flashcard: { correct: number; skipped: number };
    matching: { correct: number; skipped: number };
    listening: { correct: number; skipped: number };
    writing: { correct: number; skipped: number };
    reverseTranslation: { correct: number; skipped: number };
    pronunciation: { correct: number; skipped: number };
  }>({
    flashcard: { correct: 0, skipped: 0 },
    matching: { correct: 0, skipped: 0 },
    listening: { correct: 0, skipped: 0 },
    writing: { correct: 0, skipped: 0 },
    reverseTranslation: { correct: 0, skipped: 0 },
    pronunciation: { correct: 0, skipped: 0 },
  });

  // Track correct answers per word per phase
  const [wordResults, setWordResults] = useState<{
    [wordId: string]: {
      flashcard: boolean;
      matching: boolean;
      listening: boolean;
      writing: boolean;
      reverseTranslation: boolean;
      pronunciation: boolean;
    };
  }>({});

  // Matching phase states
  const [shuffledImages, setShuffledImages] = useState<Word[]>([]);
  const [shuffledWords, setShuffledWords] = useState<Word[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<string[]>([]);
  const [wrongMatch, setWrongMatch] = useState<{ imageId: string; wordId: string } | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [wordsLoading, setWordsLoading] = useState(true);
  const [isSwiping, setIsSwiping] = useState(false); // For visual button disable

  // Recording states for pronunciation
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlayingRecording, setIsPlayingRecording] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  // Pronunciation assessment states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [pronunciationResult, setPronunciationResult] = useState<PronunciationResult | null>(null);
  const [useAzure, setUseAzure] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);

  // Check if Azure is configured on mount
  useEffect(() => {
    setUseAzure(isAzureConfigured());
  }, []);

  // Shuffle array (Fisher-Yates)
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Load words based on user's language preferences and level
  useEffect(() => {
    const loadWords = async () => {
      if (!prefsLoading) {
        const learningLang = preferences.learningLanguage?.code || 'en';
        const nativeLang = preferences.nativeLanguage?.code || 'tr';
        const userLevel = preferences.level;

        // Load mastered word IDs
        const masteredKey = `mastered_words_${learningLang}`;
        let mastered: string[] = [];
        try {
          const saved = await AsyncStorage.getItem(masteredKey);
          if (saved) mastered = JSON.parse(saved);
        } catch {}
        setMasteredWordIds(mastered);

        const words = getWordsForLanguagePair(learningLang, nativeLang, userLevel);
        setAllWords(words);

        // Filter out mastered words
        const unmastered = words.filter(w => !mastered.includes(w.id));
        setAvailableWords(shuffleArray(unmastered.length > 0 ? unmastered : words));
        setWordsLoading(false);
      }
    };
    loadWords();
  }, [prefsLoading, preferences.learningLanguage, preferences.nativeLanguage, preferences.level]);

  // Load last selected words for review mode
  useEffect(() => {
    const loadLastWords = async () => {
      if (isReviewMode && !prefsLoading && allWords.length > 0) {
        try {
          const learningLang = preferences.learningLanguage?.code || 'en';
          const savedKey = `lastSelectedWords_${learningLang}`;
          const savedWords = await AsyncStorage.getItem(savedKey);

          if (savedWords) {
            const words = JSON.parse(savedWords) as Word[];
            if (words.length > 0) {
              setSelectedWords(words);
              setPhase('flashcard');
              setWordsLoading(false);
              return;
            }
          }

          // If no saved words, use random 5 words
          if (allWords.length >= 5) {
            const defaultWords = shuffleArray(allWords).slice(0, 5);
            setSelectedWords(defaultWords);
            setPhase('flashcard');
          }
          setWordsLoading(false);
        } catch (error) {
          console.log('Error loading last words:', error);
          // Fallback to random 5 words
          if (allWords.length >= 5) {
            const defaultWords = shuffleArray(allWords).slice(0, 5);
            setSelectedWords(defaultWords);
            setPhase('flashcard');
          }
          setWordsLoading(false);
        }
      }
    };
    loadLastWords();
  }, [isReviewMode, prefsLoading, allWords, preferences.learningLanguage]);

  // Save selected words when starting learning (with language-specific key)
  const saveSelectedWords = async (words: Word[]) => {
    try {
      const learningLang = preferences.learningLanguage?.code || 'en';
      const savedKey = `lastSelectedWords_${learningLang}`;
      await AsyncStorage.setItem(savedKey, JSON.stringify(words));
    } catch (error) {
      console.log('Error saving words:', error);
    }
  };

  // Save word to its category's learned list (language-specific)
  const saveWordToCategory = async (word: Word) => {
    if (!word.category) return;
    try {
      const learningLang = preferences.learningLanguage?.code || 'en';
      const catKey = `learned_${learningLang}_${word.category}`;
      let existing: string[] = [];
      try {
        const saved = await AsyncStorage.getItem(catKey);
        if (saved) existing = JSON.parse(saved);
      } catch {}
      if (!existing.includes(word.id)) {
        const merged = [...existing, word.id];
        await AsyncStorage.setItem(catKey, JSON.stringify(merged));
      }
    } catch (error) {
      console.log('Error saving word to category:', error);
    }
  };

  // Save mastered word IDs to AsyncStorage (reads current list to avoid race conditions)
  // updateStats: false for "I know this" words, true for words that completed exercises
  const saveMasteredWords = async (words: Word[], updateStats: boolean = true) => {
    try {
      const learningLang = preferences.learningLanguage?.code || 'en';
      const masteredKey = `mastered_words_${learningLang}`;
      const newIds = words.map(w => w.id);

      // Save to main mastered list
      let existing: string[] = [];
      try {
        const saved = await AsyncStorage.getItem(masteredKey);
        if (saved) existing = JSON.parse(saved);
      } catch {}
      const merged = [...new Set([...existing, ...newIds])];
      await AsyncStorage.setItem(masteredKey, JSON.stringify(merged));
      setMasteredWordIds(merged);

      // Save each word to its category's learned list
      for (const word of words) {
        await saveWordToCategory(word);
      }

      // Only update statistics for words that completed exercises successfully
      if (updateStats) {
        // Update today's words count (language-specific)
        const today = new Date().toISOString().split('T')[0];
        const todayKey = `today_words_${learningLang}_${today}`;
        let todayCount = 0;
        try {
          const savedToday = await AsyncStorage.getItem(todayKey);
          if (savedToday) todayCount = parseInt(savedToday, 10) || 0;
        } catch {}
        await AsyncStorage.setItem(todayKey, String(todayCount + words.length));

        // Update streak (language-specific)
        await updateStreak(learningLang);

        // Update weekly progress (language-specific)
        await updateWeeklyProgress(learningLang, words.length);
      }
    } catch (error) {
      console.log('Error saving mastered words:', error);
    }
  };

  // Update streak for a language
  const updateStreak = async (lang: string) => {
    try {
      const streakKey = `streak_${lang}`;
      const lastActiveKey = `last_active_${lang}`;

      const today = new Date().toISOString().split('T')[0];
      let lastActive = '';
      try {
        const saved = await AsyncStorage.getItem(lastActiveKey);
        if (saved) lastActive = saved;
      } catch {}

      let streak = 0;
      try {
        const savedStreak = await AsyncStorage.getItem(streakKey);
        if (savedStreak) streak = parseInt(savedStreak, 10) || 0;
      } catch {}

      if (lastActive === today) {
        // Already active today, no change
        return;
      }

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (lastActive === yesterdayStr) {
        // Streak continues
        streak += 1;
      } else {
        // Streak resets
        streak = 1;
      }

      await AsyncStorage.setItem(streakKey, String(streak));
      await AsyncStorage.setItem(lastActiveKey, today);
    } catch (error) {
      console.log('Error updating streak:', error);
    }
  };

  // Update weekly progress for a language
  const updateWeeklyProgress = async (lang: string, wordsCount: number) => {
    try {
      const weeklyKey = `weekly_progress_${lang}`;
      const weekNumberKey = `weekly_progress_week_${lang}`;

      // Get current day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
      const now = new Date();
      const dayOfWeek = now.getDay();
      // Map to array index (mon=0, tue=1, wed=2, thu=3, fri=4, sat=5, sun=6)
      const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

      // Calculate current week number (ISO week)
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const days = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
      const currentWeek = Math.ceil((days + startOfYear.getDay() + 1) / 7);
      const currentYear = now.getFullYear();
      const currentWeekKey = `${currentYear}-${currentWeek}`;

      // Load existing weekly progress or create new
      let weeklyProgress = [
        { day: 'mon', words: 0 },
        { day: 'tue', words: 0 },
        { day: 'wed', words: 0 },
        { day: 'thu', words: 0 },
        { day: 'fri', words: 0 },
        { day: 'sat', words: 0 },
        { day: 'sun', words: 0 },
      ];

      // Check if we're in a new week
      let savedWeekKey = '';
      try {
        const saved = await AsyncStorage.getItem(weekNumberKey);
        if (saved) savedWeekKey = saved;
      } catch {}

      if (savedWeekKey !== currentWeekKey) {
        // New week - reset the progress
        await AsyncStorage.setItem(weekNumberKey, currentWeekKey);
      } else {
        // Same week - load existing progress
        try {
          const saved = await AsyncStorage.getItem(weeklyKey);
          if (saved) {
            weeklyProgress = JSON.parse(saved);
          }
        } catch {}
      }

      // Update today's count
      weeklyProgress[dayIndex].words += wordsCount;

      await AsyncStorage.setItem(weeklyKey, JSON.stringify(weeklyProgress));
    } catch (error) {
      console.log('Error updating weekly progress:', error);
    }
  };

  // When session completes, save mastered words so they don't reappear
  useEffect(() => {
    if (phase === 'complete' && selectedWords.length > 0) {
      const learnedWords = selectedWords.filter(word => {
        const results = wordResults[word.id];
        if (!results) return false;
        return results.flashcard && results.matching && results.listening &&
               results.writing && results.reverseTranslation && results.pronunciation;
      });
      if (learnedWords.length > 0) {
        saveMasteredWords(learnedWords);
      }
    }
  }, [phase]);

  const currentWord = phase === 'selection'
    ? availableWords[0]
    : selectedWords[currentWordIndex];

  // Generate random options for multiple choice (only from selected 5 words)
  const generateOptions = useCallback((correctWord: Word, wordPool: Word[], useTranslations: boolean = false) => {
    const otherWords = wordPool.filter(w => w.id !== correctWord.id);
    const shuffled = otherWords.sort(() => Math.random() - 0.5);
    // Use all other selected words as wrong options (max 4 for 5 selected words)
    const wrongOptions = shuffled.map(w => useTranslations ? w.translation : w.word);
    const correctOption = useTranslations ? correctWord.translation : correctWord.word;
    const allOptions = [...wrongOptions, correctOption].sort(() => Math.random() - 0.5);
    return allOptions;
  }, []);

  // Update options when word changes in flashcard, listening, or reverseTranslation phase
  useEffect(() => {
    if ((phase === 'flashcard' || phase === 'listening') && currentWord && selectedWords.length > 0) {
      // Use only the 5 selected words for options (show words in learning language)
      const newOptions = generateOptions(currentWord, selectedWords, false);
      setOptions(newOptions);
      setSelectedOption(null);
      setIsCorrect(null);
    } else if (phase === 'reverseTranslation' && currentWord && selectedWords.length > 0) {
      // Reverse mode: show translations (native language) as options
      const newOptions = generateOptions(currentWord, selectedWords, true);
      setOptions(newOptions);
      setSelectedOption(null);
      setIsCorrect(null);
    }
  }, [phase, currentWordIndex, currentWord, generateOptions, selectedWords]);

  // Initialize wordResults when entering flashcard phase
  useEffect(() => {
    if (phase === 'flashcard' && selectedWords.length > 0 && Object.keys(wordResults).length === 0) {
      const initialResults: typeof wordResults = {};
      selectedWords.forEach(word => {
        initialResults[word.id] = {
          flashcard: false,
          matching: false,
          listening: false,
          writing: false,
          reverseTranslation: false,
          pronunciation: false,
        };
      });
      setWordResults(initialResults);
    }
  }, [phase, selectedWords]);

  // Auto-play sound when entering listening phase or changing word
  useEffect(() => {
    if (phase === 'listening' && currentWord && !isSpeaking) {
      const timer = setTimeout(() => {
        playSound();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [phase, currentWordIndex]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const animateCardOut = useCallback((direction: 'left' | 'right', callback: () => void) => {
    const toValue = direction === 'right' ? SCREEN_WIDTH + 100 : -SCREEN_WIDTH - 100;
    Animated.timing(cardPosition, {
      toValue: { x: toValue, y: 0 },
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      cardPosition.setValue({ x: 0, y: 0 });
      callback();
    });
  }, [cardPosition]);

  const handleKnowWord = useCallback(() => {
    // Prevent rapid swipes
    if (isSwipingRef.current || isSwiping) return;

    // Save the known word as learned (but don't update stats - only mark as learned)
    const knownWord = availableWords[0];
    if (knownWord) {
      saveMasteredWords([knownWord], false);
    }

    if (availableWords.length <= 1) {
      if (selectedWords.length >= 5) {
        setPhase('flashcard');
        setCurrentWordIndex(0);
        setShowAnswer(false);
        setCorrectCount(0);
      }
      return;
    }

    isSwipingRef.current = true;
    setIsSwiping(true);
    animateCardOut('right', () => {
      setAvailableWords(prev => prev.slice(1));
      // Unlock after animation completes
      setTimeout(() => {
        isSwipingRef.current = false;
        setIsSwiping(false);
      }, 100);
    });
  }, [availableWords, selectedWords.length, animateCardOut, isSwiping]);

  const handleLearnWord = useCallback(() => {
    // Prevent rapid swipes and check if already at max
    if (isSwipingRef.current || isSwiping || selectedWords.length >= 5) return;

    const word = availableWords[0];
    if (!word) return;

    isSwipingRef.current = true;
    setIsSwiping(true);
    animateCardOut('left', () => {
      setSelectedWords(prev => {
        // Double-check to prevent exceeding 5
        if (prev.length >= 5) return prev;

        const newSelected = [...prev, word];
        if (newSelected.length >= 5) {
          // Save words for review mode
          saveSelectedWords(newSelected);
          setTimeout(() => {
            setPhase('flashcard');
            setCurrentWordIndex(0);
            setShowAnswer(false);
            setCorrectCount(0);
          }, 500);
        }
        return newSelected;
      });
      setAvailableWords(prev => prev.slice(1));
      // Unlock after animation completes
      setTimeout(() => {
        isSwipingRef.current = false;
        setIsSwiping(false);
      }, 100);
    });
  }, [availableWords, selectedWords.length, animateCardOut, isSwiping]);

  // Refs to hold latest handlers for panResponder
  const handleKnowWordRef = useRef(handleKnowWord);
  const handleLearnWordRef = useRef(handleLearnWord);
  const phaseRef = useRef(phase);
  const isSwipingRef = useRef(false); // Lock to prevent rapid swipes

  useEffect(() => {
    handleKnowWordRef.current = handleKnowWord;
    handleLearnWordRef.current = handleLearnWord;
    phaseRef.current = phase;
  }, [handleKnowWord, handleLearnWord, phase]);

  const panResponder = useMemo(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => phaseRef.current === 'selection' && !isSwipingRef.current,
      onMoveShouldSetPanResponder: () => phaseRef.current === 'selection' && !isSwipingRef.current,
      onPanResponderMove: (_, gesture) => {
        if (!isSwipingRef.current) {
          cardPosition.setValue({ x: gesture.dx, y: gesture.dy });
        }
      },
      onPanResponderRelease: (_, gesture) => {
        if (isSwipingRef.current) return;

        if (gesture.dx > SWIPE_THRESHOLD) {
          // Swipe right - I know this word
          handleKnowWordRef.current();
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          // Swipe left - I want to learn
          handleLearnWordRef.current();
        } else {
          // Reset position
          Animated.spring(cardPosition, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: true,
          }).start();
        }
      },
    }), [cardPosition]);

  const startLearning = () => {
    setPhase('flashcard');
    setCurrentWordIndex(0);
    setShowAnswer(false);
    setCorrectCount(0);
  };

  const handleOptionSelect = (option: string) => {
    if (selectedOption !== null) return; // Already selected

    setSelectedOption(option);
    const correct = option === currentWord?.word;
    setIsCorrect(correct);

    if (correct && currentWord) {
      setExerciseResults(prev => ({
        ...prev,
        flashcard: { ...prev.flashcard, correct: prev.flashcard.correct + 1 },
      }));
      setWordResults(prev => ({
        ...prev,
        [currentWord.id]: { ...prev[currentWord.id], flashcard: true },
      }));
    }
  };

  const handleFlashcardSkip = () => {
    if (isSkipping) return;
    setIsSkipping(true);

    setExerciseResults(prev => ({
      ...prev,
      flashcard: { ...prev.flashcard, skipped: prev.flashcard.skipped + 1 },
    }));

    if (currentWordIndex < selectedWords.length - 1) {
      setCurrentWordIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsCorrect(null);
    } else {
      // Move to matching phase
      initMatchingPhase();
    }

    setTimeout(() => setIsSkipping(false), 500);
  };

  const handleFlashcardNext = () => {
    if (currentWordIndex < selectedWords.length - 1) {
      setCurrentWordIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsCorrect(null);
    } else {
      // Move to matching phase
      initMatchingPhase();
    }
  };

  // Initialize matching phase
  const initMatchingPhase = () => {
    // Shuffle images and words separately
    const shuffledImgs = [...selectedWords].sort(() => Math.random() - 0.5);
    const shuffledWrds = [...selectedWords].sort(() => Math.random() - 0.5);
    setShuffledImages(shuffledImgs);
    setShuffledWords(shuffledWrds);
    setSelectedImage(null);
    setMatchedPairs([]);
    setWrongMatch(null);
    setPhase('matching');
  };

  // Matching phase handlers
  const handleImageSelect = (wordId: string) => {
    if (matchedPairs.includes(wordId)) return; // Already matched
    setSelectedImage(wordId);
    setWrongMatch(null);
  };

  const handleWordSelect = (wordId: string) => {
    if (matchedPairs.includes(wordId)) return; // Already matched
    if (!selectedImage) return; // No image selected

    if (selectedImage === wordId) {
      // Correct match!
      setMatchedPairs(prev => [...prev, wordId]);
      setExerciseResults(prev => ({
        ...prev,
        matching: { ...prev.matching, correct: prev.matching.correct + 1 },
      }));
      setWordResults(prev => ({
        ...prev,
        [wordId]: { ...prev[wordId], matching: true },
      }));
      setSelectedImage(null);

      // Check if all matched
      if (matchedPairs.length + 1 >= selectedWords.length) {
        // All matched, move to next phase after a short delay
        setTimeout(() => {
          setPhase('listening');
          setCurrentWordIndex(0);
          setSelectedOption(null);
          setIsCorrect(null);
        }, 800);
      }
    } else {
      // Wrong match
      setWrongMatch({ imageId: selectedImage, wordId });
      setTimeout(() => {
        setWrongMatch(null);
        setSelectedImage(null);
      }, 800);
    }
  };

  const handleMatchingSkip = () => {
    if (isSkipping) return;
    setIsSkipping(true);

    // Count remaining as skipped
    const remaining = selectedWords.length - matchedPairs.length;
    setExerciseResults(prev => ({
      ...prev,
      matching: { ...prev.matching, skipped: prev.matching.skipped + remaining },
    }));

    setPhase('listening');
    setCurrentWordIndex(0);
    setSelectedOption(null);
    setIsCorrect(null);

    setTimeout(() => setIsSkipping(false), 500);
  };

  const handleListeningOptionSelect = (option: string) => {
    if (selectedOption !== null) return; // Already selected

    setSelectedOption(option);
    const correct = option === currentWord?.word;
    setIsCorrect(correct);

    if (correct && currentWord) {
      setExerciseResults(prev => ({
        ...prev,
        listening: { ...prev.listening, correct: prev.listening.correct + 1 },
      }));
      setWordResults(prev => ({
        ...prev,
        [currentWord.id]: { ...prev[currentWord.id], listening: true },
      }));
    }
  };

  const handleListeningNext = () => {
    if (currentWordIndex < selectedWords.length - 1) {
      setCurrentWordIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsCorrect(null);
    } else {
      // Move to writing phase
      setPhase('writing');
      setCurrentWordIndex(0);
      setUserInput('');
      setSelectedOption(null);
      setIsCorrect(null);
    }
  };

  const handleListeningSkip = () => {
    if (isSkipping) return;
    setIsSkipping(true);

    setExerciseResults(prev => ({
      ...prev,
      listening: { ...prev.listening, skipped: prev.listening.skipped + 1 },
    }));

    if (currentWordIndex < selectedWords.length - 1) {
      setCurrentWordIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsCorrect(null);
    } else {
      setPhase('writing');
      setCurrentWordIndex(0);
      setUserInput('');
      setSelectedOption(null);
      setIsCorrect(null);
    }

    setTimeout(() => setIsSkipping(false), 500);
  };

  const handleWritingCheck = () => {
    const isMatch = userInput.toLowerCase().trim() === currentWord.word.toLowerCase();
    setIsCorrect(isMatch);
    if (isMatch && currentWord) {
      setExerciseResults(prev => ({
        ...prev,
        writing: { ...prev.writing, correct: prev.writing.correct + 1 },
      }));
      setWordResults(prev => ({
        ...prev,
        [currentWord.id]: { ...prev[currentWord.id], writing: true },
      }));
    }
  };

  const handleWritingSkip = () => {
    if (isSkipping) return;
    setIsSkipping(true);

    setExerciseResults(prev => ({
      ...prev,
      writing: { ...prev.writing, skipped: prev.writing.skipped + 1 },
    }));

    if (currentWordIndex < selectedWords.length - 1) {
      setCurrentWordIndex(prev => prev + 1);
      setUserInput('');
      setIsCorrect(null);
    } else {
      // Move to reverse translation phase
      setPhase('reverseTranslation');
      setCurrentWordIndex(0);
      setSelectedOption(null);
      setIsCorrect(null);
    }

    setTimeout(() => setIsSkipping(false), 500);
  };

  const handleWritingNext = () => {
    if (currentWordIndex < selectedWords.length - 1) {
      setCurrentWordIndex(prev => prev + 1);
      setUserInput('');
      setIsCorrect(null);
    } else {
      // Move to reverse translation phase
      setPhase('reverseTranslation');
      setCurrentWordIndex(0);
      setSelectedOption(null);
      setIsCorrect(null);
    }
  };

  // Reverse Translation handlers
  const handleReverseOptionSelect = (option: string) => {
    if (selectedOption !== null) return;

    setSelectedOption(option);
    const correct = option === currentWord?.translation;
    setIsCorrect(correct);

    if (correct && currentWord) {
      setExerciseResults(prev => ({
        ...prev,
        reverseTranslation: { ...prev.reverseTranslation, correct: prev.reverseTranslation.correct + 1 },
      }));
      setWordResults(prev => ({
        ...prev,
        [currentWord.id]: { ...prev[currentWord.id], reverseTranslation: true },
      }));
    }
  };

  const handleReverseSkip = () => {
    if (isSkipping) return;
    setIsSkipping(true);

    setExerciseResults(prev => ({
      ...prev,
      reverseTranslation: { ...prev.reverseTranslation, skipped: prev.reverseTranslation.skipped + 1 },
    }));

    if (currentWordIndex < selectedWords.length - 1) {
      setCurrentWordIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsCorrect(null);
    } else {
      // Move to pronunciation phase
      setPhase('pronunciation');
      setCurrentWordIndex(0);
      setHasRecorded(false);
      setRecordingUri(null);
    }

    setTimeout(() => setIsSkipping(false), 500);
  };

  const handleReverseNext = () => {
    if (currentWordIndex < selectedWords.length - 1) {
      setCurrentWordIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsCorrect(null);
    } else {
      // Move to pronunciation phase
      setPhase('pronunciation');
      setCurrentWordIndex(0);
      setHasRecorded(false);
      setRecordingUri(null);
    }
  };

  // Pronunciation recording handlers
  // Custom recording options for Azure Speech
  // iOS uses WAV/PCM which works perfectly with Azure
  const azureRecordingOptions: Audio.RecordingOptions = {
    isMeteringEnabled: true,
    android: {
      extension: '.m4a',
      outputFormat: Audio.AndroidOutputFormat.MPEG_4,
      audioEncoder: Audio.AndroidAudioEncoder.AAC,
      sampleRate: 16000,
      numberOfChannels: 1,
      bitRate: 128000,
    },
    ios: {
      extension: '.wav',
      outputFormat: Audio.IOSOutputFormat.LINEARPCM,
      audioQuality: Audio.IOSAudioQuality.HIGH,
      sampleRate: 16000,
      numberOfChannels: 1,
      bitRate: 256000,
      linearPCMBitDepth: 16,
      linearPCMIsBigEndian: false,
      linearPCMIsFloat: false,
    },
    web: {
      mimeType: 'audio/webm',
      bitsPerSecond: 128000,
    },
  };

  const startRecording = async () => {
    try {
      // Check internet connection - overlay will show automatically if not connected
      if (!isConnected) return;

      // Request permissions
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        console.log('Permission not granted');
        return;
      }

      console.log('Starting recording...');

      // Set audio mode for recording (important for Android)
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // Start recording with platform-specific options
      let recordingOptions = azureRecordingOptions;

      if (Platform.OS === 'android') {
        // Use HIGH_QUALITY preset for Android - most compatible
        // Then convert/process for Azure
        const highQualityPreset = Audio.RecordingOptionsPresets.HIGH_QUALITY;
        recordingOptions = {
          ...highQualityPreset,
          isMeteringEnabled: true,
          android: {
            ...highQualityPreset.android,
            sampleRate: 16000,
            numberOfChannels: 1,
          },
        };
        console.log('Android recording preset:', JSON.stringify(recordingOptions.android));
      }

      console.log('Using recording options for platform:', Platform.OS);

      const { recording: newRecording } = await Audio.Recording.createAsync(recordingOptions);

      console.log('Recording started successfully');
      setRecording(newRecording);
      setIsRecording(true);
      setHasRecorded(false);
    } catch (error) {
      console.log('Failed to start recording:', error);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecordingUri(uri);
      setRecording(null);
      setHasRecorded(true);

      // Reset audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      // If Azure is configured, assess pronunciation
      if (useAzure && uri && currentWord) {
        setIsAnalyzing(true);
        try {
          // Use the learning language for pronunciation assessment
          const langCode = preferences.learningLanguage?.code || 'en';
          console.log('Pronunciation assessment language:', langCode, 'Word:', currentWord.word);
          const result = await assessPronunciation(uri, currentWord.word, langCode);
          setPronunciationResult(result);
        } catch (error) {
          console.log('Pronunciation assessment error:', error);
          setPronunciationResult(null);
        } finally {
          setIsAnalyzing(false);
        }
      }
    } catch (error) {
      console.log('Failed to stop recording:', error);
    }
  };

  const playRecording = async () => {
    if (!recordingUri || isPlayingRecording) return;

    try {
      setIsPlayingRecording(true);
      const { sound } = await Audio.Sound.createAsync({ uri: recordingUri });
      soundRef.current = sound;

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlayingRecording(false);
        }
      });

      await sound.playAsync();
    } catch (error) {
      console.log('Failed to play recording:', error);
      setIsPlayingRecording(false);
    }
  };

  const handlePronunciationComplete = () => {
    // Mark as completed based on pronunciation score
    const score = pronunciationResult?.pronunciationScore || 0;
    if (score >= 60 && currentWord) {
      setExerciseResults(prev => ({
        ...prev,
        pronunciation: { ...prev.pronunciation, correct: prev.pronunciation.correct + 1 },
      }));
      setWordResults(prev => ({
        ...prev,
        [currentWord.id]: { ...prev[currentWord.id], pronunciation: true },
      }));
    }

    if (currentWordIndex < selectedWords.length - 1) {
      setCurrentWordIndex(prev => prev + 1);
      setHasRecorded(false);
      setRecordingUri(null);
      setPronunciationResult(null);
    } else {
      setPhase('complete');
    }
  };

  const handlePronunciationSkip = () => {
    if (isSkipping) return;
    setIsSkipping(true);

    setExerciseResults(prev => ({
      ...prev,
      pronunciation: { ...prev.pronunciation, skipped: prev.pronunciation.skipped + 1 },
    }));

    if (currentWordIndex < selectedWords.length - 1) {
      setCurrentWordIndex(prev => prev + 1);
      setHasRecorded(false);
      setRecordingUri(null);
      setPronunciationResult(null);
    } else {
      setPhase('complete');
    }

    setTimeout(() => setIsSkipping(false), 500);
  };

  const handlePronunciationRetry = () => {
    setHasRecorded(false);
    setRecordingUri(null);
    setPronunciationResult(null);
  };

  // Cleanup recording on unmount
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const [isSpeaking, setIsSpeaking] = useState(false);

  const playSound = async () => {
    if (!currentWord || isSpeaking) return;

    // Check internet connection - overlay will show automatically if not connected
    if (!isConnected) return;

    const langCode = preferences.learningLanguage?.code || 'en';

    setIsSpeaking(true);

    try {
      await speakWithAzure(
        currentWord.word,
        langCode,
        () => {},
        () => setIsSpeaking(false)
      );
    } catch (error) {
      console.log('Azure TTS error:', error);
      setIsSpeaking(false);
    }
  };

  const renderSelectionPhase = () => (
    <View style={styles.selectionContainer}>
      <View style={styles.selectionHeader}>
        <Text style={styles.selectionTitle}>{i18n.t('learn.selectWords')}</Text>
        <Text style={styles.selectionSubtitle}>
          {i18n.t('learn.selectedCount', { count: selectedWords.length, total: 5 })}
        </Text>
      </View>

      <View style={styles.progressDots}>
        {[0, 1, 2, 3, 4].map((i) => (
          <View
            key={i}
            style={[
              styles.progressDot,
              i < selectedWords.length && styles.progressDotFilled,
            ]}
          />
        ))}
      </View>

      {currentWord && (
        <Animated.View
          style={[
            styles.wordCard,
            {
              transform: [
                { translateX: cardPosition.x },
                { translateY: cardPosition.y },
                { rotate: cardRotation },
              ],
            },
          ]}
          {...panResponder.panHandlers}
        >
          <View style={styles.wordCardContent}>
            <View style={styles.wordWithSound}>
              <Text style={styles.wordText}>{currentWord.word}</Text>
              <TouchableOpacity
                style={styles.soundButtonSmall}
                onPress={playSound}
                activeOpacity={0.7}
                disabled={isSpeaking}
              >
                <Ionicons
                  name={isSpeaking ? "volume-medium" : "volume-high"}
                  size={22}
                  color={isSpeaking ? colors.text.primary : colors.brand.gold}
                />
              </TouchableOpacity>
            </View>
            <Text style={styles.pronunciationText}>{currentWord.pronunciation}</Text>
            <View style={styles.dividerLine} />
            <Text style={styles.translationText}>{currentWord.translation}</Text>
            <Text style={styles.exampleText}>"{currentWord.example}"</Text>
          </View>
        </Animated.View>
      )}

      <View style={[styles.actionButtons, { marginTop: spacing.lg }]}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.learnButton,
            (isSwiping || selectedWords.length >= 5) && styles.buttonDisabled,
          ]}
          onPress={handleLearnWord}
          activeOpacity={0.7}
          disabled={isSwiping || selectedWords.length >= 5}
        >
          <Ionicons name="add-circle" size={28} color={selectedWords.length >= 5 ? colors.text.muted : colors.brand.gold} />
          <Text style={[styles.learnButtonText, selectedWords.length >= 5 && styles.buttonTextDisabled]}>
            {i18n.t('learn.addToLearn')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.knowButton, isSwiping && styles.buttonDisabled]}
          onPress={handleKnowWord}
          activeOpacity={0.7}
          disabled={isSwiping}
        >
          <Ionicons name="checkmark-circle" size={28} color={colors.text.muted} />
          <Text style={styles.knowButtonText}>{i18n.t('learn.iKnowThis')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderFlashcardPhase = () => (
    <View style={styles.exerciseContainer}>
      <View style={styles.exerciseHeader}>
        <View style={styles.phaseIndicator}>
          <Ionicons name="eye-outline" size={20} color={colors.brand.gold} />
          <Text style={styles.phaseText}>{i18n.t('learn.visualLearning')}</Text>
        </View>
        <Text style={styles.progressText}>
          {currentWordIndex + 1} / {selectedWords.length}
        </Text>
      </View>

      {/* Image Card */}
      <View style={styles.imageCard}>
        {currentWord?.image ? (
          <View style={styles.wordImage}>
            {/* Image will be added here later */}
          </View>
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="image-outline" size={64} color={colors.text.muted} />
            <Text style={styles.imageHint}>{currentWord?.translation}</Text>
          </View>
        )}
      </View>

      {/* Multiple Choice Options */}
      <Text style={styles.questionText}>{i18n.t('learn.selectCorrectWord')}</Text>

      <View style={styles.optionsContainer}>
        {options.map((option, index) => {
          const isSelected = selectedOption === option;
          const isCorrectOption = option === currentWord?.word;
          const showResult = selectedOption !== null;

          let optionStyle = styles.optionButton;
          let textStyle = styles.optionText;

          if (showResult) {
            if (isCorrectOption) {
              optionStyle = { ...styles.optionButton, ...styles.optionCorrect };
              textStyle = { ...styles.optionText, ...styles.optionTextCorrect };
            } else if (isSelected && !isCorrectOption) {
              optionStyle = { ...styles.optionButton, ...styles.optionWrong };
              textStyle = { ...styles.optionText, ...styles.optionTextWrong };
            }
          }

          return (
            <TouchableOpacity
              key={index}
              style={optionStyle}
              onPress={() => handleOptionSelect(option)}
              activeOpacity={0.7}
              disabled={selectedOption !== null}
            >
              <Text style={textStyle}>{option}</Text>
              {showResult && isCorrectOption && (
                <Ionicons name="checkmark-circle" size={24} color={colors.status.success} />
              )}
              {showResult && isSelected && !isCorrectOption && (
                <Ionicons name="close-circle" size={24} color={colors.status.error} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Action Buttons */}
      <View style={styles.exerciseActions}>
        {selectedOption === null && (
          <TouchableOpacity
            style={[styles.skipButton, isSkipping && styles.buttonDisabled]}
            disabled={isSkipping}
            onPress={handleFlashcardSkip}
            activeOpacity={0.7}
          >
            <Ionicons name="play-skip-forward" size={18} color={colors.text.muted} />
            <Text style={styles.skipButtonText}>{i18n.t('learn.skip')}</Text>
          </TouchableOpacity>
        )}
        {selectedOption !== null && (
          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleFlashcardNext}
            activeOpacity={0.7}
          >
            <Text style={styles.nextButtonText}>{i18n.t('learn.next')}</Text>
            <Ionicons name="arrow-forward" size={20} color={colors.background.primary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderMatchingPhase = () => (
    <View style={styles.exerciseContainer}>
      <View style={styles.exerciseHeader}>
        <View style={styles.phaseIndicator}>
          <Ionicons name="grid-outline" size={20} color={colors.brand.gold} />
          <Text style={styles.phaseText}>{i18n.t('learn.matchingGame')}</Text>
        </View>
        <Text style={styles.progressText}>
          {matchedPairs.length} / {selectedWords.length}
        </Text>
      </View>

      <Text style={styles.matchingInstruction}>{i18n.t('learn.matchImageToWord')}</Text>

      {/* Images Row */}
      <View style={styles.matchingImagesRow}>
        {shuffledImages.map((word) => {
          const isMatched = matchedPairs.includes(word.id);
          const isSelected = selectedImage === word.id;
          const isWrong = wrongMatch?.imageId === word.id;

          return (
            <TouchableOpacity
              key={`img-${word.id}`}
              style={[
                styles.matchingImageCard,
                isMatched && styles.matchedCard,
                isSelected && styles.selectedCard,
                isWrong && styles.wrongCard,
              ]}
              onPress={() => handleImageSelect(word.id)}
              disabled={isMatched}
              activeOpacity={0.7}
            >
              <Text style={styles.matchingEmoji}>{getWordEmoji(word.id, word.category)}</Text>
              {isMatched && (
                <View style={styles.matchedOverlay}>
                  <Ionicons name="checkmark-circle" size={40} color={colors.status.success} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Words Row */}
      <View style={styles.matchingWordsRow}>
        {shuffledWords.map((word) => {
          const isMatched = matchedPairs.includes(word.id);
          const isWrong = wrongMatch?.wordId === word.id;

          return (
            <TouchableOpacity
              key={`word-${word.id}`}
              style={[
                styles.matchingWordCard,
                isMatched && styles.matchedCard,
                isWrong && styles.wrongCard,
              ]}
              onPress={() => handleWordSelect(word.id)}
              disabled={isMatched || !selectedImage}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.matchingWordText,
                isMatched && styles.matchedText,
                !selectedImage && !isMatched && styles.disabledText,
              ]}>
                {word.word}
              </Text>
              {isMatched && (
                <Ionicons name="checkmark-circle" size={20} color={colors.status.success} style={styles.matchedIcon} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Hint */}
      {!selectedImage && matchedPairs.length < selectedWords.length && (
        <Text style={styles.matchingHint}>{i18n.t('learn.selectImageFirst')}</Text>
      )}

      {/* Skip Button */}
      <View style={styles.exerciseActions}>
        <TouchableOpacity
          style={[styles.skipButton, isSkipping && styles.buttonDisabled]}
            disabled={isSkipping}
          onPress={handleMatchingSkip}
          activeOpacity={0.7}
        >
          <Ionicons name="play-skip-forward" size={18} color={colors.text.muted} />
          <Text style={styles.skipButtonText}>{i18n.t('learn.skip')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderListeningPhase = () => (
    <ScrollView
      style={styles.exerciseContainer}
      contentContainerStyle={styles.listeningScrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.exerciseHeader}>
        <View style={styles.phaseIndicator}>
          <Ionicons name="headset-outline" size={20} color={colors.brand.gold} />
          <Text style={styles.phaseText}>{i18n.t('learn.audioLearning')}</Text>
        </View>
        <Text style={styles.progressText}>
          {currentWordIndex + 1} / {selectedWords.length}
        </Text>
      </View>

      {/* Audio Card */}
      <View style={styles.audioCard}>
        <Text style={styles.listeningPrompt}>{i18n.t('learn.listenAndGuess')}</Text>

        <TouchableOpacity
          style={[styles.playButton, isSpeaking && styles.playButtonActive]}
          onPress={playSound}
          activeOpacity={0.7}
          disabled={isSpeaking}
        >
          <Ionicons
            name={isSpeaking ? "volume-medium" : "volume-high"}
            size={32}
            color={isSpeaking ? colors.text.primary : colors.brand.gold}
          />
        </TouchableOpacity>

        <Text style={styles.translationHint}>{currentWord?.translation}</Text>
      </View>

      {/* Multiple Choice Options */}
      <Text style={styles.questionTextSmall}>{i18n.t('learn.selectCorrectWord')}</Text>

      <View style={styles.optionsContainer}>
        {options.map((option, index) => {
          const isSelected = selectedOption === option;
          const isCorrectOption = option === currentWord?.word;
          const showResult = selectedOption !== null;

          let optionStyle = styles.optionButton;
          let textStyle = styles.optionText;

          if (showResult) {
            if (isCorrectOption) {
              optionStyle = { ...styles.optionButton, ...styles.optionCorrect };
              textStyle = { ...styles.optionText, ...styles.optionTextCorrect };
            } else if (isSelected && !isCorrectOption) {
              optionStyle = { ...styles.optionButton, ...styles.optionWrong };
              textStyle = { ...styles.optionText, ...styles.optionTextWrong };
            }
          }

          return (
            <TouchableOpacity
              key={index}
              style={optionStyle}
              onPress={() => handleListeningOptionSelect(option)}
              activeOpacity={0.7}
              disabled={selectedOption !== null}
            >
              <Text style={textStyle}>{option}</Text>
              {showResult && isCorrectOption && (
                <Ionicons name="checkmark-circle" size={20} color={colors.status.success} />
              )}
              {showResult && isSelected && !isCorrectOption && (
                <Ionicons name="close-circle" size={20} color={colors.status.error} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Action Buttons */}
      <View style={styles.exerciseActions}>
        {selectedOption === null && (
          <TouchableOpacity
            style={[styles.skipButton, isSkipping && styles.buttonDisabled]}
            disabled={isSkipping}
            onPress={handleListeningSkip}
            activeOpacity={0.7}
          >
            <Ionicons name="play-skip-forward" size={18} color={colors.text.muted} />
            <Text style={styles.skipButtonText}>{i18n.t('learn.skip')}</Text>
          </TouchableOpacity>
        )}
        {selectedOption !== null && (
          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleListeningNext}
            activeOpacity={0.7}
          >
            <Text style={styles.nextButtonText}>{i18n.t('learn.next')}</Text>
            <Ionicons name="arrow-forward" size={20} color={colors.background.primary} />
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );

  const renderWritingPhase = () => (
    <View style={styles.exerciseContainer}>
      <View style={styles.exerciseHeader}>
        <View style={styles.phaseIndicator}>
          <Ionicons name="create-outline" size={20} color={colors.brand.gold} />
          <Text style={styles.phaseText}>{i18n.t('learn.writingPractice')}</Text>
        </View>
        <Text style={styles.progressText}>
          {currentWordIndex + 1} / {selectedWords.length}
        </Text>
      </View>

      <View style={styles.writingCard}>
        <Text style={styles.writingPrompt}>{i18n.t('learn.writeTheWord')}</Text>
        <Text style={styles.writingTranslation}>{currentWord?.translation}</Text>

        <TextInput
          style={[
            styles.writingInput,
            isCorrect === true && styles.inputCorrect,
            isCorrect === false && styles.inputWrong,
          ]}
          value={userInput}
          onChangeText={setUserInput}
          placeholder={i18n.t('learn.typeHere')}
          placeholderTextColor={colors.text.muted}
          autoCapitalize="none"
          autoCorrect={false}
          editable={isCorrect === null}
        />

        {isCorrect === null ? (
          <View style={styles.writingActions}>
            <TouchableOpacity
              style={[styles.skipButton, isSkipping && styles.buttonDisabled]}
            disabled={isSkipping}
              onPress={handleWritingSkip}
              activeOpacity={0.7}
            >
              <Ionicons name="play-skip-forward" size={18} color={colors.text.muted} />
              <Text style={styles.skipButtonText}>{i18n.t('learn.skip')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.checkButton}
              onPress={handleWritingCheck}
              activeOpacity={0.7}
            >
              <Text style={styles.checkButtonText}>{i18n.t('learn.check')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.writingResult}>
            {isCorrect ? (
              <View style={styles.resultCorrect}>
                <Ionicons name="checkmark-circle" size={32} color={colors.status.success} />
                <Text style={styles.resultCorrectText}>{i18n.t('learn.correct')}</Text>
              </View>
            ) : (
              <View style={styles.resultWrong}>
                <Ionicons name="close-circle" size={32} color={colors.status.error} />
                <Text style={styles.resultWrongText}>{i18n.t('learn.incorrect')}</Text>
                <Text style={styles.correctAnswer}>
                  {i18n.t('learn.correctAnswer')}: {currentWord?.word}
                </Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.nextButton}
              onPress={handleWritingNext}
              activeOpacity={0.7}
            >
              <Text style={styles.nextButtonText}>{i18n.t('learn.next')}</Text>
              <Ionicons name="arrow-forward" size={20} color={colors.background.primary} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  const renderReverseTranslationPhase = () => (
    <View style={styles.exerciseContainer}>
      <View style={styles.exerciseHeader}>
        <View style={styles.phaseIndicator}>
          <Ionicons name="swap-horizontal" size={20} color={colors.brand.gold} />
          <Text style={styles.phaseText}>{i18n.t('learn.reverseTranslation')}</Text>
        </View>
        <Text style={styles.progressText}>
          {currentWordIndex + 1} / {selectedWords.length}
        </Text>
      </View>

      {/* Word Card - Show learning language word */}
      <View style={styles.reverseCard}>
        <Text style={styles.reversePrompt}>{i18n.t('learn.findTranslation')}</Text>
        <View style={styles.wordWithSound}>
          <Text style={styles.reverseWord}>{currentWord?.word}</Text>
          <TouchableOpacity
            style={styles.soundButtonSmall}
            onPress={playSound}
            activeOpacity={0.7}
            disabled={isSpeaking}
          >
            <Ionicons
              name={isSpeaking ? "volume-medium" : "volume-high"}
              size={22}
              color={isSpeaking ? colors.text.primary : colors.brand.gold}
            />
          </TouchableOpacity>
        </View>
        {currentWord?.pronunciation && (
          <Text style={styles.reversePronunciation}>{currentWord.pronunciation}</Text>
        )}
      </View>

      {/* Multiple Choice Options - Translations */}
      <Text style={styles.questionText}>{i18n.t('learn.selectCorrectTranslation')}</Text>

      <View style={styles.optionsContainer}>
        {options.map((option, index) => {
          const isSelected = selectedOption === option;
          const isCorrectOption = option === currentWord?.translation;
          const showResult = selectedOption !== null;

          let optionStyle = styles.optionButton;
          let textStyle = styles.optionText;

          if (showResult) {
            if (isCorrectOption) {
              optionStyle = { ...styles.optionButton, ...styles.optionCorrect };
              textStyle = { ...styles.optionText, ...styles.optionTextCorrect };
            } else if (isSelected && !isCorrectOption) {
              optionStyle = { ...styles.optionButton, ...styles.optionWrong };
              textStyle = { ...styles.optionText, ...styles.optionTextWrong };
            }
          }

          return (
            <TouchableOpacity
              key={index}
              style={optionStyle}
              onPress={() => handleReverseOptionSelect(option)}
              activeOpacity={0.7}
              disabled={selectedOption !== null}
            >
              <Text style={textStyle}>{option}</Text>
              {showResult && isCorrectOption && (
                <Ionicons name="checkmark-circle" size={24} color={colors.status.success} />
              )}
              {showResult && isSelected && !isCorrectOption && (
                <Ionicons name="close-circle" size={24} color={colors.status.error} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Action Buttons */}
      <View style={styles.exerciseActions}>
        {selectedOption === null && (
          <TouchableOpacity
            style={[styles.skipButton, isSkipping && styles.buttonDisabled]}
            disabled={isSkipping}
            onPress={handleReverseSkip}
            activeOpacity={0.7}
          >
            <Ionicons name="play-skip-forward" size={18} color={colors.text.muted} />
            <Text style={styles.skipButtonText}>{i18n.t('learn.skip')}</Text>
          </TouchableOpacity>
        )}
        {selectedOption !== null && (
          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleReverseNext}
            activeOpacity={0.7}
          >
            <Text style={styles.nextButtonText}>{i18n.t('learn.next')}</Text>
            <Ionicons name="arrow-forward" size={20} color={colors.background.primary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderPronunciationPhase = () => {
    const feedback = pronunciationResult ? getPronunciationFeedback(pronunciationResult.pronunciationScore) : null;

    return (
      <ScrollView style={styles.exerciseContainer} contentContainerStyle={styles.pronunciationScrollContent}>
        <View style={styles.exerciseHeader}>
          <View style={styles.phaseIndicator}>
            <Ionicons name="mic-outline" size={20} color={colors.brand.gold} />
            <Text style={styles.phaseText}>{i18n.t('learn.pronunciationPractice')}</Text>
          </View>
          <Text style={styles.progressText}>
            {currentWordIndex + 1} / {selectedWords.length}
          </Text>
        </View>

        {/* Word Card */}
        <View style={styles.pronunciationCard}>
          <Text style={styles.pronunciationPrompt}>{i18n.t('learn.sayTheWord')}</Text>

          <Text style={styles.pronunciationWord}>{currentWord?.word}</Text>
          {currentWord?.pronunciation && (
            <Text style={styles.pronunciationHint}>{currentWord.pronunciation}</Text>
          )}

          {/* Listen Button */}
          <TouchableOpacity
            style={[styles.listenButton, isSpeaking && styles.listenButtonActive]}
            onPress={playSound}
            activeOpacity={0.7}
            disabled={isSpeaking}
          >
            <Ionicons
              name={isSpeaking ? "volume-medium" : "volume-high"}
              size={24}
              color={isSpeaking ? colors.text.primary : colors.brand.gold}
            />
            <Text style={[styles.listenButtonText, isSpeaking && styles.listenButtonTextActive]}>
              {i18n.t('learn.listenFirst')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Recording Controls */}
        <View style={styles.recordingSection}>
          {!isRecording && !hasRecorded && !isAnalyzing && (
            <TouchableOpacity
              style={styles.recordButton}
              onPress={startRecording}
              activeOpacity={0.7}
            >
              <View style={styles.recordButtonInner}>
                <Ionicons name="mic" size={32} color={colors.text.primary} />
              </View>
              <Text style={styles.recordButtonText}>{i18n.t('learn.tapToRecord')}</Text>
            </TouchableOpacity>
          )}

          {isRecording && (
            <TouchableOpacity
              style={styles.stopButton}
              onPress={stopRecording}
              activeOpacity={0.7}
            >
              <View style={styles.stopButtonInner}>
                <Ionicons name="stop" size={32} color={colors.text.primary} />
              </View>
              <Text style={styles.stopButtonText}>{i18n.t('learn.recording')}</Text>
            </TouchableOpacity>
          )}

          {isAnalyzing && (
            <View style={styles.analyzingSection}>
              <ActivityIndicator size="large" color={colors.brand.gold} />
              <Text style={styles.analyzingText}>{i18n.t('learn.pronunciation.analyzing')}</Text>
            </View>
          )}

          {hasRecorded && !isRecording && !isAnalyzing && pronunciationResult && (
            <View style={styles.resultSection}>
              {/* Score Circle */}
              <View style={[styles.scoreCircle, { borderColor: feedback?.color }]}>
                <Text style={[styles.scoreValue, { color: feedback?.color }]}>
                  {Math.round(pronunciationResult.pronunciationScore)}
                </Text>
                <Text style={styles.scoreLabel}>%</Text>
              </View>

              {/* Feedback Message */}
              <Text style={[styles.feedbackText, { color: feedback?.color }]}>
                {i18n.t(`learn.pronunciation.${feedback?.level}`)}
              </Text>

              {/* Recognized Text */}
              {pronunciationResult.recognizedText && (
                <Text style={styles.recognizedText}>
                  {i18n.t('learn.youSaid')}: "{pronunciationResult.recognizedText}"
                </Text>
              )}

              {/* Detailed Scores */}
              <View style={styles.detailedScores}>
                <View style={styles.scoreItem}>
                  <Text style={styles.scoreItemLabel}>{i18n.t('learn.pronunciation.accuracy')}</Text>
                  <Text style={styles.scoreItemValue}>{Math.round(pronunciationResult.accuracyScore)}%</Text>
                </View>
                <View style={styles.scoreItem}>
                  <Text style={styles.scoreItemLabel}>{i18n.t('learn.pronunciation.fluency')}</Text>
                  <Text style={styles.scoreItemValue}>{Math.round(pronunciationResult.fluencyScore)}%</Text>
                </View>
                <View style={styles.scoreItem}>
                  <Text style={styles.scoreItemLabel}>{i18n.t('learn.pronunciation.completeness')}</Text>
                  <Text style={styles.scoreItemValue}>{Math.round(pronunciationResult.completenessScore)}%</Text>
                </View>
              </View>

              {/* Playback and Retry Buttons */}
              <View style={styles.playbackRow}>
                <TouchableOpacity
                  style={[styles.smallPlaybackButton, isPlayingRecording && styles.playbackButtonActive]}
                  onPress={playRecording}
                  activeOpacity={0.7}
                  disabled={isPlayingRecording}
                >
                  <Ionicons
                    name={isPlayingRecording ? "pause" : "play"}
                    size={20}
                    color={colors.brand.gold}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={handlePronunciationRetry}
                  activeOpacity={0.7}
                >
                  <Ionicons name="refresh" size={18} color={colors.text.muted} />
                  <Text style={styles.retryButtonText}>{i18n.t('learn.tryAgain')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {hasRecorded && !isRecording && !isAnalyzing && !pronunciationResult && !useAzure && (
            <View style={styles.playbackSection}>
              <TouchableOpacity
                style={[styles.playbackButton, isPlayingRecording && styles.playbackButtonActive]}
                onPress={playRecording}
                activeOpacity={0.7}
                disabled={isPlayingRecording}
              >
                <Ionicons
                  name={isPlayingRecording ? "pause" : "play"}
                  size={28}
                  color={colors.brand.gold}
                />
                <Text style={styles.playbackButtonText}>
                  {isPlayingRecording ? i18n.t('learn.playing') : i18n.t('learn.playRecording')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.rerecordButton}
                onPress={handlePronunciationRetry}
                activeOpacity={0.7}
              >
                <Ionicons name="refresh" size={20} color={colors.text.muted} />
                <Text style={styles.rerecordButtonText}>{i18n.t('learn.recordAgain')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.exerciseActions}>
          <TouchableOpacity
            style={[styles.skipButton, isSkipping && styles.buttonDisabled]}
            disabled={isSkipping}
            onPress={handlePronunciationSkip}
            activeOpacity={0.7}
          >
            <Ionicons name="play-skip-forward" size={18} color={colors.text.muted} />
            <Text style={styles.skipButtonText}>{i18n.t('learn.skip')}</Text>
          </TouchableOpacity>

          {hasRecorded && !isAnalyzing && (
            <TouchableOpacity
              style={styles.nextButton}
              onPress={handlePronunciationComplete}
              activeOpacity={0.7}
            >
              <Text style={styles.nextButtonText}>{i18n.t('learn.next')}</Text>
              <Ionicons name="arrow-forward" size={20} color={colors.background.primary} />
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    );
  };

  const renderCompletePhase = () => {
    const totalCorrect = exerciseResults.flashcard.correct + exerciseResults.matching.correct + exerciseResults.listening.correct + exerciseResults.writing.correct + exerciseResults.reverseTranslation.correct + exerciseResults.pronunciation.correct;
    const totalSkipped = exerciseResults.flashcard.skipped + exerciseResults.matching.skipped + exerciseResults.listening.skipped + exerciseResults.writing.skipped + exerciseResults.reverseTranslation.skipped + exerciseResults.pronunciation.skipped;
    const totalAnswered = (selectedWords.length * 6) - totalSkipped;
    const percentage = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

    // Calculate learned words (correct in all phases)
    const learnedWords = selectedWords.filter(word => {
      const results = wordResults[word.id];
      if (!results) return false;
      return results.flashcard && results.matching && results.listening &&
             results.writing && results.reverseTranslation && results.pronunciation;
    });

    const getMotivationalMessage = () => {
      if (learnedWords.length === selectedWords.length) return i18n.t('learn.motivation.excellent');
      if (learnedWords.length >= 3) return i18n.t('learn.motivation.great');
      if (learnedWords.length >= 1) return i18n.t('learn.motivation.good');
      return i18n.t('learn.motivation.keepTrying');
    };

    const needsPracticeWords = selectedWords.filter(w => !learnedWords.includes(w));

    return (
      <View style={styles.completeContainer}>
        {/* Top Section with Icon and Title */}
        <View style={styles.completeTopSection}>
          <View style={styles.completeTrophyCircle}>
            <Ionicons name="trophy" size={36} color={colors.brand.gold} />
          </View>
          <Text style={styles.completeMainTitle}>{i18n.t('learn.sessionComplete')}</Text>
          <Text style={styles.completeSubtitle}>{getMotivationalMessage()}</Text>
        </View>

        {/* Results Card */}
        <View style={styles.resultsCardNew}>
          {/* Learned Section */}
          {learnedWords.length > 0 && (
            <View style={styles.resultSection}>
              <View style={styles.resultSectionHeader}>
                <Ionicons name="checkmark-circle" size={18} color={colors.status.success} />
                <Text style={styles.resultSectionTitleSuccess}>
                  {i18n.t('learn.youLearnedTheseWords')}
                </Text>
                <Text style={styles.resultCount}>{learnedWords.length}</Text>
              </View>
              <View style={styles.resultWordsRow}>
                {learnedWords.map(word => (
                  <View key={word.id} style={styles.learnedWordTag}>
                    <Text style={styles.learnedWordTagText}>{word.word}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Divider */}
          {learnedWords.length > 0 && needsPracticeWords.length > 0 && (
            <View style={styles.sectionDivider} />
          )}

          {/* Needs Practice Section */}
          {needsPracticeWords.length > 0 && (
            <View style={styles.resultSection}>
              <View style={styles.resultSectionHeader}>
                <Ionicons name="refresh-circle" size={18} color={colors.brand.gold} />
                <Text style={styles.resultSectionTitlePractice}>
                  {i18n.t('learn.keepPracticing')}
                </Text>
                <Text style={styles.resultCountPractice}>{needsPracticeWords.length}</Text>
              </View>
              <View style={styles.resultWordsRow}>
                {needsPracticeWords.map(word => (
                  <View key={word.id} style={styles.practiceWordTag}>
                    <Text style={styles.practiceWordTagText}>{word.word}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Buttons */}
        <View style={styles.completeButtonsNew}>
          <TouchableOpacity
            style={styles.reviewButtonNew}
            onPress={() => {
              setPhase('flashcard');
              setCurrentWordIndex(0);
              setShowAnswer(false);
              setExerciseResults({
                flashcard: { correct: 0, skipped: 0 },
                matching: { correct: 0, skipped: 0 },
                listening: { correct: 0, skipped: 0 },
                writing: { correct: 0, skipped: 0 },
                reverseTranslation: { correct: 0, skipped: 0 },
                pronunciation: { correct: 0, skipped: 0 },
              });
              setWordResults({});
              setHasRecorded(false);
              setRecordingUri(null);
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh" size={20} color={colors.brand.gold} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.doneButtonNew}
            onPress={() => router.push('/home')}
            activeOpacity={0.7}
          >
            <Text style={styles.doneButtonNewText}>{i18n.t('learn.done')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Show loading while fetching preferences and words
  if (prefsLoading || wordsLoading) {
    return (
      <LinearGradient
        colors={[colors.background.primary, colors.background.secondary]}
        style={styles.container}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brand.gold} />
        </View>
      </LinearGradient>
    );
  }

  // Show message if no words available for the language pair
  if (allWords.length === 0) {
    return (
      <LinearGradient
        colors={[colors.background.primary, colors.background.secondary]}
        style={styles.container}
      >
        <View style={styles.loadingContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.text.muted} />
          <Text style={styles.noWordsText}>
            {preferences.learningLanguage?.name || 'Selected language'} - Coming soon!
          </Text>
          <TouchableOpacity
            style={styles.backHomeButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Text style={styles.backHomeButtonText}>{i18n.t('learn.done')}</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={[colors.background.primary, colors.background.secondary]}
      style={styles.container}
    >
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{i18n.t('learn.title')}</Text>
            {preferences.learningLanguage && (
              <Text style={styles.headerSubtitle}>
                {preferences.learningLanguage.flag} {preferences.learningLanguage.name}
              </Text>
            )}
          </View>
          <View style={styles.placeholder} />
        </View>

        {phase === 'selection' && renderSelectionPhase()}
        {phase === 'flashcard' && renderFlashcardPhase()}
        {phase === 'matching' && renderMatchingPhase()}
        {phase === 'listening' && renderListeningPhase()}
        {phase === 'writing' && renderWritingPhase()}
        {phase === 'reverseTranslation' && renderReverseTranslationPhase()}
        {phase === 'pronunciation' && renderPronunciationPhase()}
        {phase === 'complete' && renderCompletePhase()}
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  noWordsText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.lg,
    color: colors.text.muted,
    textAlign: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  backHomeButton: {
    backgroundColor: colors.brand.gold,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  backHomeButtonText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: layout.headerPaddingTop,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerSubtitle: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: colors.brand.gold,
    marginTop: 2,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
    color: colors.text.primary,
  },
  placeholder: {
    width: 40,
  },

  // Selection Phase
  selectionContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  selectionHeader: {
    alignItems: 'center',
    marginBottom: layout.isSmallDevice ? spacing.md : spacing.lg,
  },
  selectionTitle: {
    fontFamily: fonts.semiBold,
    fontSize: layout.isSmallDevice ? fontSize.lg : fontSize.xl,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  selectionSubtitle: {
    fontFamily: fonts.body,
    fontSize: fontSize.md,
    color: colors.text.muted,
  },
  progressDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: layout.isSmallDevice ? spacing.md : spacing.xl,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.background.tertiary,
    borderWidth: 2,
    borderColor: colors.border.primary,
    marginHorizontal: 4,
  },
  progressDotFilled: {
    backgroundColor: colors.brand.gold,
    borderColor: colors.brand.gold,
  },
  wordCard: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border.primary,
    padding: layout.isSmallDevice ? spacing.lg : spacing.xl,
    marginHorizontal: spacing.md,
    marginBottom: layout.isSmallDevice ? spacing.md : spacing.xl,
    minHeight: layout.isSmallDevice ? 220 : 280,
    justifyContent: 'center',
  },
  wordCardContent: {
    alignItems: 'center',
  },
  wordWithSound: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  soundButtonSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(201, 162, 39, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  wordText: {
    fontFamily: fonts.bold,
    fontSize: layout.isSmallDevice ? 26 : 32,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  pronunciationText: {
    fontFamily: fonts.body,
    fontSize: fontSize.md,
    color: colors.text.muted,
    marginBottom: spacing.lg,
  },
  dividerLine: {
    width: 60,
    height: 2,
    backgroundColor: colors.brand.gold,
    marginBottom: spacing.lg,
  },
  translationText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.xl,
    color: colors.brand.gold,
    marginBottom: spacing.md,
  },
  exampleText: {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  swipeHints: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  swipeHint: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  swipeHintText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: colors.text.muted,
    marginHorizontal: spacing.xs,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginHorizontal: spacing.xs,
  },
  learnButton: {
    backgroundColor: 'rgba(201, 162, 39, 0.1)',
    borderColor: colors.brand.gold,
  },
  learnButtonText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.sm,
    color: colors.brand.gold,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  knowButton: {
    backgroundColor: colors.background.tertiary,
    borderColor: colors.border.primary,
  },
  knowButtonText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.sm,
    color: colors.text.muted,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonTextDisabled: {
    color: colors.text.muted,
  },

  // Exercise Container
  exerciseContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  listeningScrollContent: {
    paddingBottom: spacing.xl,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  phaseIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(201, 162, 39, 0.1)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  phaseText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: colors.brand.gold,
    marginLeft: spacing.sm,
  },
  progressText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: colors.text.secondary,
  },

  // Image Card for Visual Learning
  imageCard: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border.primary,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  wordImage: {
    width: '100%',
    height: layout.isSmallDevice ? 140 : 180,
    backgroundColor: colors.background.tertiary,
  },
  imagePlaceholder: {
    width: '100%',
    height: layout.isSmallDevice ? 140 : 180,
    backgroundColor: colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageHint: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
    color: colors.brand.gold,
    marginTop: spacing.md,
  },
  questionText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  questionTextSmall: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  optionsContainer: {
    marginBottom: spacing.md,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  optionText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text.primary,
    flex: 1,
  },
  optionCorrect: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    borderColor: colors.status.success,
  },
  optionTextCorrect: {
    color: colors.status.success,
  },
  optionWrong: {
    backgroundColor: 'rgba(244, 67, 54, 0.15)',
    borderColor: colors.status.error,
  },
  optionTextWrong: {
    color: colors.status.error,
  },
  feedbackButtons: {
    flexDirection: 'row',
  },
  feedbackButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginHorizontal: spacing.xs,
  },
  wrongButton: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderColor: colors.status.error,
  },
  wrongButtonText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: colors.status.error,
    marginLeft: spacing.sm,
  },
  correctButton: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderColor: colors.status.success,
  },
  correctButtonText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: colors.status.success,
    marginLeft: spacing.sm,
  },

  // Listening
  audioCard: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border.primary,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  listeningCard: {
    flex: 1,
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border.primary,
    padding: layout.isSmallDevice ? spacing.lg : spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: layout.isSmallDevice ? spacing.md : spacing.xl,
    maxHeight: layout.isSmallDevice ? 350 : 450,
  },
  listeningPrompt: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  playButton: {
    width: layout.isSmallDevice ? 56 : 70,
    height: layout.isSmallDevice ? 56 : 70,
    borderRadius: layout.isSmallDevice ? 28 : 35,
    backgroundColor: 'rgba(201, 162, 39, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: colors.brand.gold,
  },
  playButtonActive: {
    backgroundColor: colors.brand.gold,
    borderColor: colors.brand.gold,
  },
  translationHint: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
    color: colors.brand.gold,
  },
  revealButton: {
    backgroundColor: colors.brand.gold,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  revealButtonText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: colors.background.primary,
  },
  answerText: {
    fontFamily: fonts.bold,
    fontSize: layout.isSmallDevice ? 20 : 24,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  pronunciationAnswer: {
    fontFamily: fonts.body,
    fontSize: fontSize.md,
    color: colors.text.muted,
    marginBottom: spacing.lg,
  },

  // Writing
  writingCard: {
    flex: 1,
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border.primary,
    padding: layout.isSmallDevice ? spacing.lg : spacing.xl,
    alignItems: 'center',
    marginBottom: layout.isSmallDevice ? spacing.md : spacing.xl,
    maxHeight: layout.isSmallDevice ? 350 : 450,
  },
  writingPrompt: {
    fontFamily: fonts.medium,
    fontSize: fontSize.lg,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  writingTranslation: {
    fontFamily: fonts.bold,
    fontSize: layout.isSmallDevice ? 24 : 28,
    color: colors.brand.gold,
    marginBottom: layout.isSmallDevice ? spacing.lg : spacing.xl,
    textAlign: 'center',
  },
  writingInput: {
    width: '100%',
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontFamily: fonts.medium,
    fontSize: fontSize.lg,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  inputCorrect: {
    borderColor: colors.status.success,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  inputWrong: {
    borderColor: colors.status.error,
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
  },
  checkButton: {
    backgroundColor: colors.brand.gold,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    marginLeft: spacing.md,
  },
  checkButtonText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: colors.background.primary,
  },
  writingResult: {
    alignItems: 'center',
    width: '100%',
  },
  resultCorrect: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  resultCorrectText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
    color: colors.status.success,
    marginTop: spacing.sm,
  },
  resultWrong: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  resultWrongText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
    color: colors.status.error,
    marginTop: spacing.sm,
  },
  correctAnswer: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text.secondary,
    marginTop: spacing.sm,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand.gold,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  nextButtonText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: colors.background.primary,
    marginRight: spacing.sm,
  },
  exerciseActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.primary,
    backgroundColor: colors.background.tertiary,
  },
  skipButtonText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: colors.text.muted,
    marginLeft: spacing.xs,
  },
  writingActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },

  // Complete Phase
  completeContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    justifyContent: 'center',
  },
  completeHeader: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  completeIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(201, 162, 39, 0.15)',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  completeTitle: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  scoreSection: {
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  motivationText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: colors.brand.gold,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  resultsCard: {
    width: '100%',
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border.primary,
    padding: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.lg,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  resultLabel: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text.secondary,
    marginLeft: spacing.md,
  },
  resultValue: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: colors.text.primary,
  },
  resultDivider: {
    height: 1,
    backgroundColor: colors.border.primary,
    marginVertical: spacing.xs,
  },
  totalScoreValue: {
    fontFamily: fonts.bold,
    fontSize: 48,
    color: colors.brand.gold,
    lineHeight: 52,
  },
  completeButtons: {
    flexDirection: 'row',
    width: '100%',
  },
  reviewButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.brand.gold,
    backgroundColor: 'rgba(201, 162, 39, 0.1)',
    marginRight: spacing.sm,
  },
  reviewButtonText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.sm,
    color: colors.brand.gold,
    marginLeft: spacing.sm,
  },
  doneButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand.gold,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    marginLeft: spacing.sm,
  },
  doneButtonText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.sm,
    color: colors.background.primary,
    marginRight: spacing.sm,
  },

  // Reverse Translation
  reverseCard: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border.primary,
    padding: layout.isSmallDevice ? spacing.lg : spacing.xl,
    alignItems: 'center',
    marginBottom: layout.isSmallDevice ? spacing.md : spacing.lg,
  },
  reversePrompt: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  reverseWord: {
    fontFamily: fonts.bold,
    fontSize: layout.isSmallDevice ? 24 : 28,
    color: colors.text.primary,
  },
  reversePronunciation: {
    fontFamily: fonts.body,
    fontSize: fontSize.md,
    color: colors.text.muted,
    marginTop: spacing.xs,
  },

  // Pronunciation Phase
  pronunciationCard: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border.primary,
    padding: layout.isSmallDevice ? spacing.md : spacing.xl,
    alignItems: 'center',
    marginBottom: layout.isSmallDevice ? spacing.sm : spacing.lg,
  },
  pronunciationPrompt: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  pronunciationWord: {
    fontFamily: fonts.bold,
    fontSize: layout.isSmallDevice ? 26 : 32,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  pronunciationHint: {
    fontFamily: fonts.body,
    fontSize: fontSize.md,
    color: colors.text.muted,
    marginBottom: spacing.lg,
  },
  listenButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(201, 162, 39, 0.1)',
    borderWidth: 1,
    borderColor: colors.brand.gold,
  },
  listenButtonActive: {
    backgroundColor: colors.brand.gold,
  },
  listenButtonText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: colors.brand.gold,
    marginLeft: spacing.sm,
  },
  listenButtonTextActive: {
    color: colors.background.primary,
  },
  recordingSection: {
    alignItems: 'center',
    marginBottom: layout.isSmallDevice ? spacing.sm : spacing.lg,
  },
  recordButton: {
    alignItems: 'center',
  },
  recordButtonInner: {
    width: layout.isSmallDevice ? 64 : 80,
    height: layout.isSmallDevice ? 64 : 80,
    borderRadius: layout.isSmallDevice ? 32 : 40,
    backgroundColor: colors.status.error,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  recordButtonText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  stopButton: {
    alignItems: 'center',
  },
  stopButtonInner: {
    width: layout.isSmallDevice ? 64 : 80,
    height: layout.isSmallDevice ? 64 : 80,
    borderRadius: layout.isSmallDevice ? 32 : 40,
    backgroundColor: colors.status.error,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
    borderWidth: 3,
    borderColor: colors.text.primary,
  },
  stopButtonText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: colors.status.error,
  },
  playbackSection: {
    alignItems: 'center',
  },
  playbackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(201, 162, 39, 0.1)',
    borderWidth: 1,
    borderColor: colors.brand.gold,
    marginBottom: spacing.md,
  },
  playbackButtonActive: {
    backgroundColor: colors.brand.gold,
  },
  playbackButtonText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.brand.gold,
    marginLeft: spacing.sm,
  },
  rerecordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  rerecordButtonText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: colors.text.muted,
    marginLeft: spacing.xs,
  },
  // Speech Recognition Result
  resultSection: {
    alignItems: 'center',
    width: '100%',
  },
  recognizedText: {
    fontFamily: fonts.body,
    fontSize: fontSize.md,
    color: colors.text.secondary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  tryAgainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginTop: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background.tertiary,
  },
  tryAgainButtonText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: colors.text.muted,
    marginLeft: spacing.xs,
  },

  // Pronunciation Assessment Styles
  pronunciationScrollContent: {
    paddingBottom: spacing.xl,
  },
  analyzingSection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  analyzingText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
  scoreCircle: {
    width: layout.isSmallDevice ? 80 : 100,
    height: layout.isSmallDevice ? 80 : 100,
    borderRadius: layout.isSmallDevice ? 40 : 50,
    borderWidth: layout.isSmallDevice ? 3 : 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: layout.isSmallDevice ? spacing.sm : spacing.md,
  },
  scoreValue: {
    fontFamily: fonts.bold,
    fontSize: layout.isSmallDevice ? 26 : 32,
  },
  scoreLabel: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: colors.text.muted,
    marginTop: -4,
  },
  feedbackText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  detailedScores: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: layout.isSmallDevice ? spacing.sm : spacing.md,
    paddingHorizontal: spacing.md,
  },
  scoreItem: {
    alignItems: 'center',
  },
  scoreItemLabel: {
    fontFamily: fonts.body,
    fontSize: fontSize.xs,
    color: colors.text.muted,
    marginBottom: 2,
  },
  scoreItemValue: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: colors.text.primary,
  },
  playbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: layout.isSmallDevice ? spacing.sm : spacing.lg,
    gap: spacing.md,
  },
  smallPlaybackButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(201, 162, 39, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.brand.gold,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background.tertiary,
  },
  retryButtonText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: colors.text.muted,
    marginLeft: spacing.xs,
  },

  // Matching Phase Styles
  matchingInstruction: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  matchingImagesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  matchingImageCard: {
    width: (SCREEN_WIDTH - spacing.md * 2 - spacing.sm * 2) / 3,
    aspectRatio: 1,
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.border.primary,
  },
  matchingEmoji: {
    fontSize: 52,
  },
  matchingWordsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.xs,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  matchingWordCard: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.border.primary,
    flexDirection: 'row',
    alignItems: 'center',
  },
  matchingWordText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: colors.text.primary,
  },
  selectedCard: {
    borderColor: colors.brand.gold,
    backgroundColor: 'rgba(201, 162, 39, 0.1)',
  },
  matchedCard: {
    borderColor: colors.status.success,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    opacity: 0.7,
  },
  wrongCard: {
    borderColor: colors.status.error,
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
  },
  matchedText: {
    color: colors.status.success,
  },
  disabledText: {
    color: colors.text.muted,
  },
  matchedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.3)',
    borderRadius: borderRadius.xl - 3,
  },
  matchedIcon: {
    marginLeft: spacing.xs,
  },
  matchingHint: {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    color: colors.text.muted,
    textAlign: 'center',
    marginBottom: spacing.md,
  },

  // Complete Phase - Card Design
  completeTopSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  completeTrophyCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(201, 162, 39, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  completeMainTitle: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.xl,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  completeSubtitle: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.brand.gold,
  },
  resultsCardNew: {
    width: '100%',
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  resultSection: {
    marginBottom: spacing.md,
  },
  resultSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  resultSectionTitleSuccess: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.sm,
    color: colors.status.success,
    flex: 1,
  },
  resultSectionTitlePractice: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.sm,
    color: colors.brand.gold,
    flex: 1,
  },
  resultCount: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.sm,
    color: colors.status.success,
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  resultCountPractice: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.sm,
    color: colors.brand.gold,
    backgroundColor: 'rgba(201, 162, 39, 0.15)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  resultWordsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: colors.border.primary,
    marginVertical: spacing.md,
  },
  learnedWordTag: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },
  learnedWordTagText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: colors.status.success,
  },
  practiceWordTag: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(201, 162, 39, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 39, 0.3)',
  },
  practiceWordTagText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: colors.brand.gold,
  },
  completeButtonsNew: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    width: '100%',
  },
  reviewButtonNew: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.background.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.brand.gold,
  },
  doneButtonNew: {
    flex: 1,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.brand.gold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneButtonNewText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
    color: colors.background.primary,
  },
});
