import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Dimensions,
  PanResponder,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../src/i18n';
import { useLanguage } from '../src/context/LanguageContext';
import { colors, fontSize, spacing, borderRadius, fonts, layout } from '../src/constants/theme';
import { useUser } from '../src/context/UserContext';
import {
  speakWithAzure,
  isAzureConfigured,
  assessPronunciation,
  getPronunciationFeedback,
  PronunciationResult,
} from '../src/services/azureSpeech';
import { getWordsByCategory } from '../src/data/words';
import { useNetwork } from '../src/context/NetworkContext';

const REQUIRED_WORDS = 5;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

// Word data structure from getWordsByCategory
interface CategoryWordData {
  id: string;
  word: string;
  translation: string;
  pronunciation: string;
  example: string;
  exampleTranslation: string;
  category: string;
}

// Words are now loaded dynamically using getWordsByCategory

const CATEGORY_COLORS: { [key: string]: string } = {
  travel: '#4ECDC4',
  food: '#FF6B6B',
  business: '#45B7D1',
  technology: '#9B59B6',
  health: '#2ECC71',
  sports: '#E67E22',
  music: '#E91E63',
  entertainment: '#00BCD4',
  nature: '#8BC34A',
  shopping: '#FF9800',
  family: '#673AB7',
  education: '#3F51B5',
};

const CATEGORY_ICONS: { [key: string]: string } = {
  travel: 'airplane-outline',
  food: 'restaurant-outline',
  business: 'briefcase-outline',
  technology: 'laptop-outline',
  health: 'fitness-outline',
  sports: 'football-outline',
  music: 'musical-notes-outline',
  entertainment: 'film-outline',
  nature: 'leaf-outline',
  shopping: 'cart-outline',
  family: 'people-outline',
  education: 'school-outline',
};

const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

type Phase = 'selection' | 'flashcard' | 'matching' | 'listening' | 'writing' | 'reverseTranslation' | 'pronunciation' | 'complete';

export default function CategoryLearnScreen() {
  const router = useRouter();
  const { locale } = useLanguage(); // For re-render on language change
  const { category } = useLocalSearchParams<{ category: string }>();
  const { preferences } = useUser();
  const { isConnected } = useNetwork();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const cardPosition = useRef(new Animated.ValueXY()).current;
  const cardRotation = cardPosition.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ['-10deg', '0deg', '10deg'],
  });
  const categoryId = category || 'travel';

  const color = CATEGORY_COLORS[categoryId] || colors.brand.gold;
  const icon = CATEGORY_ICONS[categoryId] || 'book-outline';

  // Get user's language preferences
  const learningLang = preferences.learningLanguage?.code || 'en';
  const nativeLang = preferences.nativeLanguage?.code || 'tr';
  const userLevel = preferences.level;

  // Load words based on user's language preferences and level
  const allCategoryWords = useMemo(() => {
    return getWordsByCategory(categoryId, learningLang, nativeLang, userLevel);
  }, [categoryId, learningLang, nativeLang, userLevel]);
  const [phase, setPhase] = useState<Phase>('selection');
  const [selectedWords, setSelectedWords] = useState<CategoryWordData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0, skipped: 0 });
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
  const [flashcardOptions, setFlashcardOptions] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  // Matching phase states
  const [shuffledTranslations, setShuffledTranslations] = useState<CategoryWordData[]>([]);
  const [shuffledMatchWords, setShuffledMatchWords] = useState<CategoryWordData[]>([]);
  const [selectedTranslation, setSelectedTranslation] = useState<string | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<string[]>([]);
  const [wrongMatch, setWrongMatch] = useState<{ translationId: string; wordId: string } | null>(null);
  const [listeningOptions, setListeningOptions] = useState<string[]>([]);
  const [reverseOptions, setReverseOptions] = useState<string[]>([]);
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
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const [isSwiping, setIsSwiping] = useState(false);
  const [availableCategoryWords, setAvailableCategoryWords] = useState<CategoryWordData[]>([]);
  const [masteredWordIds, setMasteredWordIds] = useState<string[]>([]);
  const isSwipingRef = useRef(false);

  // Initialize available words: load mastered IDs, filter them out, shuffle
  useEffect(() => {
    const loadAndFilterWords = async () => {
      if (allCategoryWords.length === 0) return;

      // Load mastered word IDs for this category (language-specific)
      const masteredKey = `learned_${learningLang}_${categoryId}`;
      let mastered: string[] = [];
      try {
        const saved = await AsyncStorage.getItem(masteredKey);
        if (saved) mastered = JSON.parse(saved);
      } catch {}
      setMasteredWordIds(mastered);

      // Filter out mastered words and shuffle
      const unmastered = allCategoryWords.filter(w => !mastered.includes(w.id));
      setAvailableCategoryWords(shuffleArray(unmastered.length > 0 ? unmastered : allCategoryWords));
    };
    loadAndFilterWords();
  }, [allCategoryWords, categoryId, learningLang]);

  // Refs for phase and handlers
  const phaseRef = useRef(phase);
  const handleKnowWordRef = useRef<() => void>(() => {});
  const handleLearnWordRef = useRef<() => void>(() => {});

  // Current word for selection phase
  const currentSelectionWord = availableCategoryWords[0] || null;

  // Learning words (selected words for exercise phases)
  const learningWords = selectedWords;
  const currentWord = learningWords[currentIndex];


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

  // Check if Azure is configured on mount
  useEffect(() => {
    setUseAzure(isAzureConfigured());
  }, []);

  // Update phase ref
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  // Save mastered word IDs to AsyncStorage (reads current list to avoid race conditions)
  // updateStats: false for "I know this" words, true for words that completed exercises
  const saveMasteredWords = async (newMasteredIds: string[], updateStats: boolean = true) => {
    try {
      // Use language-specific key to track learned words per language
      const masteredKey = `learned_${learningLang}_${categoryId}`;
      let existing: string[] = [];
      try {
        const saved = await AsyncStorage.getItem(masteredKey);
        if (saved) existing = JSON.parse(saved);
      } catch {}
      const merged = [...new Set([...existing, ...newMasteredIds])];
      await AsyncStorage.setItem(masteredKey, JSON.stringify(merged));
      setMasteredWordIds(merged);

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
        await AsyncStorage.setItem(todayKey, String(todayCount + newMasteredIds.length));

        // Update streak (language-specific)
        await updateStreak(learningLang);

        // Update weekly progress (language-specific)
        await updateWeeklyProgress(learningLang, newMasteredIds.length);
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
        saveMasteredWords(learnedWords.map(w => w.id));
      }
    }
  }, [phase]);

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

  // Handle "I know this" - mark as learned and skip
  const handleKnowWord = useCallback(() => {
    if (isSwipingRef.current || isSwiping) return;

    // Save the known word as learned (but don't update stats - only mark as learned)
    const knownWord = availableCategoryWords[0];
    if (knownWord) {
      saveMasteredWords([knownWord.id], false);
    }

    if (availableCategoryWords.length <= 1) {
      if (selectedWords.length >= REQUIRED_WORDS) {
        setPhase('flashcard');
        setCurrentIndex(0);
        setScore({ correct: 0, total: 0, skipped: 0 });
        setExerciseResults({
          flashcard: { correct: 0, skipped: 0 },
          matching: { correct: 0, skipped: 0 },
          listening: { correct: 0, skipped: 0 },
          writing: { correct: 0, skipped: 0 },
          reverseTranslation: { correct: 0, skipped: 0 },
          pronunciation: { correct: 0, skipped: 0 },
        });
        setWordResults({});
      }
      return;
    }

    isSwipingRef.current = true;
    setIsSwiping(true);
    animateCardOut('right', () => {
      setAvailableCategoryWords(prev => prev.slice(1));
      setTimeout(() => {
        isSwipingRef.current = false;
        setIsSwiping(false);
      }, 100);
    });
  }, [availableCategoryWords, selectedWords.length, animateCardOut, isSwiping]);

  // Handle "I want to learn" - select word
  const handleLearnWord = useCallback(() => {
    if (isSwipingRef.current || isSwiping || selectedWords.length >= REQUIRED_WORDS) return;

    const word = availableCategoryWords[0];
    if (!word) return;

    isSwipingRef.current = true;
    setIsSwiping(true);
    animateCardOut('left', () => {
      setSelectedWords(prev => {
        if (prev.length >= REQUIRED_WORDS) return prev;
        const newSelected = [...prev, word];
        if (newSelected.length >= REQUIRED_WORDS) {
          setTimeout(() => {
            setPhase('flashcard');
            setCurrentIndex(0);
            setScore({ correct: 0, total: 0, skipped: 0 });
            setExerciseResults({
              flashcard: { correct: 0, skipped: 0 },
              matching: { correct: 0, skipped: 0 },
              listening: { correct: 0, skipped: 0 },
              writing: { correct: 0, skipped: 0 },
              reverseTranslation: { correct: 0, skipped: 0 },
              pronunciation: { correct: 0, skipped: 0 },
            });
            setWordResults({});
          }, 500);
        }
        return newSelected;
      });
      setAvailableCategoryWords(prev => prev.slice(1));
      setTimeout(() => {
        isSwipingRef.current = false;
        setIsSwiping(false);
      }, 100);
    });
  }, [availableCategoryWords, selectedWords.length, animateCardOut, isSwiping]);

  // Keep refs updated for panResponder
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
          handleKnowWordRef.current();
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          handleLearnWordRef.current();
        } else {
          Animated.spring(cardPosition, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: true,
          }).start();
        }
      },
    }), [cardPosition]);

  // Generate flashcard options (multiple choice with words in learning language)
  const generateFlashcardOptions = useCallback((correctWord: CategoryWordData) => {
    const otherWords = selectedWords
      .filter(w => w.id !== correctWord.id)
      .sort(() => Math.random() - 0.5)
      .map(w => w.word);
    const allOptions = [...otherWords, correctWord.word].sort(() => Math.random() - 0.5);
    setFlashcardOptions(allOptions);
  }, [selectedWords]);

  // Update flashcard options when word changes
  useEffect(() => {
    if (phase === 'flashcard' && currentWord && selectedWords.length > 0) {
      generateFlashcardOptions(currentWord);
      setSelectedOption(null);
      setIsCorrect(null);
    }
  }, [phase, currentIndex, currentWord, generateFlashcardOptions, selectedWords]);

  const handleFlashcardOptionSelect = (option: string) => {
    if (selectedOption !== null) return;
    setSelectedOption(option);
    const correct = option === currentWord?.word;
    setIsCorrect(correct);
    if (correct) {
      setScore(prev => ({ ...prev, correct: prev.correct + 1, total: prev.total + 1 }));
      setExerciseResults(prev => ({
        ...prev,
        flashcard: { ...prev.flashcard, correct: prev.flashcard.correct + 1 },
      }));
      if (currentWord) {
        setWordResults(prev => ({
          ...prev,
          [currentWord.id]: { ...prev[currentWord.id], flashcard: true },
        }));
      }
    } else {
      setScore(prev => ({ ...prev, total: prev.total + 1 }));
    }
  };

  const handleFlashcardSkip = () => {
    if (isSkipping) return;
    setIsSkipping(true);
    setScore(prev => ({ ...prev, skipped: prev.skipped + 1 }));
    setExerciseResults(prev => ({
      ...prev,
      flashcard: { ...prev.flashcard, skipped: prev.flashcard.skipped + 1 },
    }));

    if (currentIndex < learningWords.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsCorrect(null);
    } else {
      initMatchingPhase();
    }
    setTimeout(() => setIsSkipping(false), 500);
  };

  const handleFlashcardNext = () => {
    if (currentIndex < learningWords.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsCorrect(null);
    } else {
      initMatchingPhase();
    }
  };

  // Matching phase
  const initMatchingPhase = () => {
    const shuffledTrans = [...selectedWords].sort(() => Math.random() - 0.5);
    const shuffledWrds = [...selectedWords].sort(() => Math.random() - 0.5);
    setShuffledTranslations(shuffledTrans);
    setShuffledMatchWords(shuffledWrds);
    setSelectedTranslation(null);
    setMatchedPairs([]);
    setWrongMatch(null);
    setPhase('matching');
  };

  const handleTranslationSelect = (wordId: string) => {
    if (matchedPairs.includes(wordId)) return;
    setSelectedTranslation(wordId);
    setWrongMatch(null);
  };

  const handleWordMatchSelect = (wordId: string) => {
    if (matchedPairs.includes(wordId)) return;
    if (!selectedTranslation) return;

    if (selectedTranslation === wordId) {
      // Correct match
      const newMatched = [...matchedPairs, wordId];
      setMatchedPairs(newMatched);
      setScore(prev => ({ ...prev, correct: prev.correct + 1, total: prev.total + 1 }));
      setExerciseResults(prev => ({
        ...prev,
        matching: { ...prev.matching, correct: prev.matching.correct + 1 },
      }));
      setWordResults(prev => ({
        ...prev,
        [wordId]: { ...prev[wordId], matching: true },
      }));
      setSelectedTranslation(null);

      if (newMatched.length >= selectedWords.length) {
        setTimeout(() => {
          setPhase('listening');
          setCurrentIndex(0);
        }, 800);
      }
    } else {
      // Wrong match
      setScore(prev => ({ ...prev, total: prev.total + 1 }));
      setWrongMatch({ translationId: selectedTranslation, wordId });
      setTimeout(() => {
        setWrongMatch(null);
        setSelectedTranslation(null);
      }, 800);
    }
  };

  const handleMatchingSkip = () => {
    if (isSkipping) return;
    setIsSkipping(true);

    const remaining = selectedWords.length - matchedPairs.length;
    setScore(prev => ({ ...prev, skipped: prev.skipped + remaining }));
    setExerciseResults(prev => ({
      ...prev,
      matching: { ...prev.matching, skipped: prev.matching.skipped + remaining },
    }));

    setPhase('listening');
    setCurrentIndex(0);

    setTimeout(() => setIsSkipping(false), 500);
  };

  // Listening phase
  const generateListeningOptions = useCallback((correctWord: CategoryWordData) => {
    const otherWords = selectedWords
      .filter(w => w.id !== correctWord.id)
      .sort(() => Math.random() - 0.5)
      .map(w => w.word);
    const allOptions = [...otherWords, correctWord.word].sort(() => Math.random() - 0.5);
    setListeningOptions(allOptions);
  }, [selectedWords]);

  // Generate listening options when entering listening phase or changing word
  useEffect(() => {
    if (phase === 'listening' && currentWord && selectedWords.length > 0) {
      generateListeningOptions(currentWord);
      setSelectedOption(null);
      setIsCorrect(null);
    }
  }, [phase, currentIndex, currentWord, generateListeningOptions, selectedWords]);

  const handleListeningOptionSelect = (option: string) => {
    if (selectedOption !== null) return;
    setSelectedOption(option);
    const correct = option === currentWord?.word;
    setIsCorrect(correct);
    if (correct) {
      setScore(prev => ({ ...prev, correct: prev.correct + 1, total: prev.total + 1 }));
      setExerciseResults(prev => ({
        ...prev,
        listening: { ...prev.listening, correct: prev.listening.correct + 1 },
      }));
      if (currentWord) {
        setWordResults(prev => ({
          ...prev,
          [currentWord.id]: { ...prev[currentWord.id], listening: true },
        }));
      }
    } else {
      setScore(prev => ({ ...prev, total: prev.total + 1 }));
    }
  };

  const handleListeningNext = () => {
    if (currentIndex < learningWords.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsCorrect(null);
    } else {
      setPhase('writing');
      setCurrentIndex(0);
      setUserInput('');
      setSelectedOption(null);
      setIsCorrect(null);
    }
  };

  const handleListeningSkip = () => {
    if (isSkipping) return;
    setIsSkipping(true);
    setScore(prev => ({ ...prev, skipped: prev.skipped + 1 }));
    setExerciseResults(prev => ({
      ...prev,
      listening: { ...prev.listening, skipped: prev.listening.skipped + 1 },
    }));

    if (currentIndex < learningWords.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsCorrect(null);
    } else {
      setPhase('writing');
      setCurrentIndex(0);
      setUserInput('');
      setSelectedOption(null);
      setIsCorrect(null);
    }
    setTimeout(() => setIsSkipping(false), 500);
  };

  // Writing phase handlers
  const handleWritingCheck = () => {
    const isMatch = userInput.toLowerCase().trim() === currentWord?.word.toLowerCase();
    setIsCorrect(isMatch);
    if (isMatch) {
      setScore(prev => ({ ...prev, correct: prev.correct + 1, total: prev.total + 1 }));
      setExerciseResults(prev => ({
        ...prev,
        writing: { ...prev.writing, correct: prev.writing.correct + 1 },
      }));
      if (currentWord) {
        setWordResults(prev => ({
          ...prev,
          [currentWord.id]: { ...prev[currentWord.id], writing: true },
        }));
      }
    } else {
      setScore(prev => ({ ...prev, total: prev.total + 1 }));
    }
  };

  const handleWritingSkip = () => {
    if (isSkipping) return;
    setIsSkipping(true);
    setScore(prev => ({ ...prev, skipped: prev.skipped + 1 }));
    setExerciseResults(prev => ({
      ...prev,
      writing: { ...prev.writing, skipped: prev.writing.skipped + 1 },
    }));

    if (currentIndex < learningWords.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setUserInput('');
      setIsCorrect(null);
    } else {
      setPhase('reverseTranslation');
      setCurrentIndex(0);
      setSelectedOption(null);
      setIsCorrect(null);
    }
    setTimeout(() => setIsSkipping(false), 500);
  };

  const handleWritingNext = () => {
    if (currentIndex < learningWords.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setUserInput('');
      setIsCorrect(null);
    } else {
      setPhase('reverseTranslation');
      setCurrentIndex(0);
      setSelectedOption(null);
      setIsCorrect(null);
    }
  };

  // Reverse Translation phase
  const generateReverseOptions = useCallback((correctWord: CategoryWordData) => {
    const otherWords = selectedWords
      .filter(w => w.id !== correctWord.id)
      .sort(() => Math.random() - 0.5)
      .map(w => w.translation);
    const allOptions = [...otherWords, correctWord.translation].sort(() => Math.random() - 0.5);
    setReverseOptions(allOptions);
  }, [selectedWords]);

  useEffect(() => {
    if (phase === 'reverseTranslation' && currentWord && selectedWords.length > 0) {
      generateReverseOptions(currentWord);
      setSelectedOption(null);
      setIsCorrect(null);
    }
  }, [phase, currentIndex, currentWord, generateReverseOptions, selectedWords]);

  const handleReverseOptionSelect = (option: string) => {
    if (selectedOption !== null) return;
    setSelectedOption(option);
    const correct = option === currentWord?.translation;
    setIsCorrect(correct);
    if (correct) {
      setScore(prev => ({ ...prev, correct: prev.correct + 1, total: prev.total + 1 }));
      setExerciseResults(prev => ({
        ...prev,
        reverseTranslation: { ...prev.reverseTranslation, correct: prev.reverseTranslation.correct + 1 },
      }));
      if (currentWord) {
        setWordResults(prev => ({
          ...prev,
          [currentWord.id]: { ...prev[currentWord.id], reverseTranslation: true },
        }));
      }
    } else {
      setScore(prev => ({ ...prev, total: prev.total + 1 }));
    }
  };

  const handleReverseSkip = () => {
    if (isSkipping) return;
    setIsSkipping(true);
    setScore(prev => ({ ...prev, skipped: prev.skipped + 1 }));
    setExerciseResults(prev => ({
      ...prev,
      reverseTranslation: { ...prev.reverseTranslation, skipped: prev.reverseTranslation.skipped + 1 },
    }));

    if (currentIndex < learningWords.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsCorrect(null);
    } else {
      setPhase('pronunciation');
      setCurrentIndex(0);
      setHasRecorded(false);
      setRecordingUri(null);
    }
    setTimeout(() => setIsSkipping(false), 500);
  };

  const handleReverseNext = () => {
    if (currentIndex < learningWords.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsCorrect(null);
    } else {
      setPhase('pronunciation');
      setCurrentIndex(0);
      setHasRecorded(false);
      setRecordingUri(null);
    }
  };

  // Pronunciation phase
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
    web: {},
  };

  const startRecording = async () => {
    try {
      // Check internet connection - overlay will show automatically if not connected
      if (!isConnected) return;

      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') return;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      let recordingOptions = azureRecordingOptions;
      if (Platform.OS === 'android') {
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
      }

      const { recording: newRecording } = await Audio.Recording.createAsync(recordingOptions);
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

      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

      if (useAzure && uri && currentWord) {
        setIsAnalyzing(true);
        try {
          const result = await assessPronunciation(uri, currentWord.word, learningLang);
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
    const pronScore = pronunciationResult?.pronunciationScore || 0;
    if (pronScore >= 60) {
      setScore(prev => ({ ...prev, correct: prev.correct + 1, total: prev.total + 1 }));
      setExerciseResults(prev => ({
        ...prev,
        pronunciation: { ...prev.pronunciation, correct: prev.pronunciation.correct + 1 },
      }));
      if (currentWord) {
        setWordResults(prev => ({
          ...prev,
          [currentWord.id]: { ...prev[currentWord.id], pronunciation: true },
        }));
      }
    } else {
      setScore(prev => ({ ...prev, total: prev.total + 1 }));
    }

    if (currentIndex < learningWords.length - 1) {
      setCurrentIndex(prev => prev + 1);
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
    setScore(prev => ({ ...prev, skipped: prev.skipped + 1 }));
    setExerciseResults(prev => ({
      ...prev,
      pronunciation: { ...prev.pronunciation, skipped: prev.pronunciation.skipped + 1 },
    }));

    if (currentIndex < learningWords.length - 1) {
      setCurrentIndex(prev => prev + 1);
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


  const speakWord = useCallback(async (text: string) => {
    if (!text || isSpeaking) return;

    // Check internet connection - overlay will show automatically if not connected
    if (!isConnected) return;

    setIsSpeaking(true);

    try {
      await speakWithAzure(
        text,
        learningLang,
        () => setIsSpeaking(true),
        () => setIsSpeaking(false)
      );
    } catch (error) {
      console.log('Azure TTS error:', error);
      setIsSpeaking(false);
    }
  }, [isSpeaking, learningLang, isConnected]);

  const stopSpeaking = useCallback(() => {
    setIsSpeaking(false);
  }, []);

  const renderSelection = () => (
    <View style={styles.selectionContainer}>
      <View style={styles.selectionHeader}>
        <Text style={styles.selectionTitle}>{i18n.t('learn.selectWords')}</Text>
        <Text style={styles.selectionSubtitle}>
          {i18n.t('learn.selectedCount', { count: selectedWords.length, total: REQUIRED_WORDS })}
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

      {currentSelectionWord && (
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
              <Text style={styles.cardWordText}>{currentSelectionWord.word}</Text>
              <TouchableOpacity
                style={styles.soundButtonSmall}
                onPress={() => speakWord(currentSelectionWord.word)}
                disabled={isSpeaking}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={isSpeaking ? "volume-medium" : "volume-high"}
                  size={22}
                  color={isSpeaking ? colors.text.primary : colors.brand.gold}
                />
              </TouchableOpacity>
            </View>
            {currentSelectionWord.pronunciation && (
              <Text style={styles.pronunciationText}>{currentSelectionWord.pronunciation}</Text>
            )}
            <View style={styles.dividerLine} />
            <Text style={styles.cardTranslationText}>{currentSelectionWord.translation}</Text>
            {currentSelectionWord.example && (
              <Text style={styles.exampleText}>"{currentSelectionWord.example}"</Text>
            )}
          </View>
        </Animated.View>
      )}

      <View style={[styles.actionButtons, { marginTop: spacing.lg }]}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.learnButton,
            (isSwiping || selectedWords.length >= REQUIRED_WORDS) && styles.buttonDisabled,
          ]}
          onPress={handleLearnWord}
          activeOpacity={0.7}
          disabled={isSwiping || selectedWords.length >= REQUIRED_WORDS}
        >
          <Ionicons
            name="add-circle"
            size={28}
            color={selectedWords.length >= REQUIRED_WORDS ? colors.text.muted : colors.brand.gold}
          />
          <Text style={[
            styles.learnButtonText,
            selectedWords.length >= REQUIRED_WORDS && styles.buttonTextDisabled
          ]}>
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

  const renderFlashcard = () => (
    <View style={styles.exerciseContainer}>
      <View style={styles.exerciseHeader}>
        <View style={styles.phaseIndicatorBadge}>
          <Ionicons name="eye-outline" size={20} color={colors.brand.gold} />
          <Text style={styles.phaseText}>{i18n.t('learn.visualLearning')}</Text>
        </View>
        <Text style={styles.progressText}>
          {currentIndex + 1} / {learningWords.length}
        </Text>
      </View>

      {/* Image Card */}
      <View style={styles.imageCard}>
        <View style={styles.imagePlaceholder}>
          <Ionicons name="image-outline" size={64} color={colors.text.muted} />
          <Text style={styles.imageHint}>{currentWord?.translation}</Text>
        </View>
      </View>

      {/* Multiple Choice Options */}
      <Text style={styles.questionText}>{i18n.t('learn.selectCorrectWord')}</Text>

      <View style={styles.flashcardOptionsContainer}>
        {flashcardOptions.map((option, index) => {
          const isSelected = selectedOption === option;
          const isCorrectOption = option === currentWord?.word;
          const showResult = selectedOption !== null;

          let optionStyle = styles.fcOptionButton;
          let textStyle = styles.fcOptionText;

          if (showResult) {
            if (isCorrectOption) {
              optionStyle = { ...styles.fcOptionButton, ...styles.fcOptionCorrect };
              textStyle = { ...styles.fcOptionText, ...styles.fcOptionTextCorrect };
            } else if (isSelected && !isCorrectOption) {
              optionStyle = { ...styles.fcOptionButton, ...styles.fcOptionWrong };
              textStyle = { ...styles.fcOptionText, ...styles.fcOptionTextWrong };
            }
          }

          return (
            <TouchableOpacity
              key={index}
              style={optionStyle}
              onPress={() => handleFlashcardOptionSelect(option)}
              activeOpacity={0.7}
              disabled={selectedOption !== null}
            >
              <Text style={textStyle}>{option}</Text>
              {showResult && isCorrectOption && (
                <Ionicons name="checkmark-circle" size={24} color="#4ECDC4" />
              )}
              {showResult && isSelected && !isCorrectOption && (
                <Ionicons name="close-circle" size={24} color="#FF6B6B" />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Action Buttons */}
      <View style={styles.exerciseActions}>
        {selectedOption === null && (
          <TouchableOpacity
            style={[styles.fcSkipButton, isSkipping && styles.buttonDisabled]}
            disabled={isSkipping}
            onPress={handleFlashcardSkip}
            activeOpacity={0.7}
          >
            <Ionicons name="play-skip-forward" size={18} color={colors.text.muted} />
            <Text style={styles.fcSkipButtonText}>{i18n.t('learn.skip')}</Text>
          </TouchableOpacity>
        )}
        {selectedOption !== null && (
          <TouchableOpacity
            style={styles.fcNextButton}
            onPress={handleFlashcardNext}
            activeOpacity={0.7}
          >
            <Text style={styles.fcNextButtonText}>{i18n.t('learn.next')}</Text>
            <Ionicons name="arrow-forward" size={20} color={colors.background.primary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderMatching = () => (
    <View style={styles.exerciseContainer}>
      <View style={styles.exerciseHeader}>
        <View style={styles.phaseIndicatorBadge}>
          <Ionicons name="grid-outline" size={20} color={colors.brand.gold} />
          <Text style={styles.phaseText}>{i18n.t('learn.matchingGame')}</Text>
        </View>
        <Text style={styles.progressText}>
          {matchedPairs.length} / {selectedWords.length}
        </Text>
      </View>

      <Text style={styles.matchingInstruction}>{i18n.t('learn.matchImageToWord')}</Text>

      {/* Translations Row */}
      <View style={styles.matchingTransRow}>
        {shuffledTranslations.map((word) => {
          const isMatched = matchedPairs.includes(word.id);
          const isSelected = selectedTranslation === word.id;
          const isWrong = wrongMatch?.translationId === word.id;

          return (
            <TouchableOpacity
              key={`trans-${word.id}`}
              style={[
                styles.matchingTransCard,
                isMatched && styles.matchedCard,
                isSelected && styles.selectedCard,
                isWrong && styles.wrongCard,
              ]}
              onPress={() => handleTranslationSelect(word.id)}
              disabled={isMatched}
              activeOpacity={0.7}
            >
              <Text style={[styles.matchingTransText, isMatched && styles.matchedText]}>
                {word.translation}
              </Text>
              {isMatched && (
                <View style={styles.matchedOverlay}>
                  <Ionicons name="checkmark-circle" size={32} color="#4CAF50" />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Words Row */}
      <View style={styles.matchingWordsRow}>
        {shuffledMatchWords.map((word) => {
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
              onPress={() => handleWordMatchSelect(word.id)}
              disabled={isMatched || !selectedTranslation}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.matchingWordText,
                isMatched && styles.matchedText,
                !selectedTranslation && !isMatched && styles.disabledText,
              ]}>
                {word.word}
              </Text>
              {isMatched && (
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" style={{ marginLeft: spacing.xs }} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Hint */}
      {!selectedTranslation && matchedPairs.length < selectedWords.length && (
        <Text style={styles.matchingHint}>{i18n.t('learn.selectImageFirst')}</Text>
      )}

      {/* Skip Button */}
      <View style={styles.exerciseActions}>
        <TouchableOpacity
          style={[styles.fcSkipButton, isSkipping && styles.buttonDisabled]}
          disabled={isSkipping}
          onPress={handleMatchingSkip}
          activeOpacity={0.7}
        >
          <Ionicons name="play-skip-forward" size={18} color={colors.text.muted} />
          <Text style={styles.fcSkipButtonText}>{i18n.t('learn.skip')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderListening = () => (
    <ScrollView
      style={styles.exerciseContainer}
      contentContainerStyle={styles.listeningScrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.exerciseHeader}>
        <View style={styles.phaseIndicatorBadge}>
          <Ionicons name="headset-outline" size={20} color={colors.brand.gold} />
          <Text style={styles.phaseText}>{i18n.t('learn.audioLearning')}</Text>
        </View>
        <Text style={styles.progressText}>
          {currentIndex + 1} / {learningWords.length}
        </Text>
      </View>

      {/* Audio Card */}
      <View style={styles.audioCard}>
        <Text style={styles.listeningPrompt}>{i18n.t('learn.listenAndGuess')}</Text>

        <TouchableOpacity
          style={[styles.playButton, isSpeaking && styles.playButtonActive]}
          onPress={() => speakWord(currentWord?.word || '')}
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
      <Text style={styles.questionText}>{i18n.t('learn.selectCorrectWord')}</Text>

      <View style={styles.flashcardOptionsContainer}>
        {listeningOptions.map((option, index) => {
          const isSelected = selectedOption === option;
          const isCorrectOption = option === currentWord?.word;
          const showResult = selectedOption !== null;

          let optionStyle = styles.fcOptionButton;
          let textStyle = styles.fcOptionText;

          if (showResult) {
            if (isCorrectOption) {
              optionStyle = { ...styles.fcOptionButton, ...styles.fcOptionCorrect };
              textStyle = { ...styles.fcOptionText, ...styles.fcOptionTextCorrect };
            } else if (isSelected && !isCorrectOption) {
              optionStyle = { ...styles.fcOptionButton, ...styles.fcOptionWrong };
              textStyle = { ...styles.fcOptionText, ...styles.fcOptionTextWrong };
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
                <Ionicons name="checkmark-circle" size={24} color="#4ECDC4" />
              )}
              {showResult && isSelected && !isCorrectOption && (
                <Ionicons name="close-circle" size={24} color="#FF6B6B" />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Action Buttons */}
      <View style={styles.exerciseActions}>
        {selectedOption === null && (
          <TouchableOpacity
            style={[styles.fcSkipButton, isSkipping && styles.buttonDisabled]}
            disabled={isSkipping}
            onPress={handleListeningSkip}
            activeOpacity={0.7}
          >
            <Ionicons name="play-skip-forward" size={18} color={colors.text.muted} />
            <Text style={styles.fcSkipButtonText}>{i18n.t('learn.skip')}</Text>
          </TouchableOpacity>
        )}
        {selectedOption !== null && (
          <TouchableOpacity
            style={styles.fcNextButton}
            onPress={handleListeningNext}
            activeOpacity={0.7}
          >
            <Text style={styles.fcNextButtonText}>{i18n.t('learn.next')}</Text>
            <Ionicons name="arrow-forward" size={20} color={colors.background.primary} />
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );

  const renderWriting = () => (
    <View style={styles.exerciseContainer}>
      <View style={styles.exerciseHeader}>
        <View style={styles.phaseIndicatorBadge}>
          <Ionicons name="create-outline" size={20} color={colors.brand.gold} />
          <Text style={styles.phaseText}>{i18n.t('learn.writingPractice')}</Text>
        </View>
        <Text style={styles.progressText}>
          {currentIndex + 1} / {learningWords.length}
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
          onSubmitEditing={handleWritingCheck}
          returnKeyType="done"
        />

        {isCorrect === null ? (
          <View style={styles.writingActions}>
            <TouchableOpacity
              style={[styles.fcSkipButton, isSkipping && styles.buttonDisabled]}
              disabled={isSkipping}
              onPress={handleWritingSkip}
              activeOpacity={0.7}
            >
              <Ionicons name="play-skip-forward" size={18} color={colors.text.muted} />
              <Text style={styles.fcSkipButtonText}>{i18n.t('learn.skip')}</Text>
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
                <Ionicons name="checkmark-circle" size={32} color="#4ECDC4" />
                <Text style={styles.resultCorrectText}>{i18n.t('learn.correct')}</Text>
              </View>
            ) : (
              <View style={styles.resultWrong}>
                <Ionicons name="close-circle" size={32} color="#FF6B6B" />
                <Text style={styles.resultWrongText}>{i18n.t('learn.incorrect')}</Text>
                <Text style={styles.correctAnswer}>
                  {i18n.t('learn.correctAnswer')}: {currentWord?.word}
                </Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.fcNextButton}
              onPress={handleWritingNext}
              activeOpacity={0.7}
            >
              <Text style={styles.fcNextButtonText}>{i18n.t('learn.next')}</Text>
              <Ionicons name="arrow-forward" size={20} color={colors.background.primary} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  const renderReverseTranslation = () => (
    <View style={styles.exerciseContainer}>
      <View style={styles.exerciseHeader}>
        <View style={styles.phaseIndicatorBadge}>
          <Ionicons name="swap-horizontal" size={20} color={colors.brand.gold} />
          <Text style={styles.phaseText}>{i18n.t('learn.reverseTranslation')}</Text>
        </View>
        <Text style={styles.progressText}>
          {currentIndex + 1} / {learningWords.length}
        </Text>
      </View>

      {/* Word Card */}
      <View style={styles.reverseCard}>
        <Text style={styles.reversePrompt}>{i18n.t('learn.findTranslation')}</Text>
        <View style={styles.wordWithSound}>
          <Text style={styles.reverseWord}>{currentWord?.word}</Text>
          <TouchableOpacity
            style={styles.soundButtonSmall}
            onPress={() => speakWord(currentWord?.word || '')}
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

      <View style={styles.flashcardOptionsContainer}>
        {reverseOptions.map((option, index) => {
          const isSelected = selectedOption === option;
          const isCorrectOption = option === currentWord?.translation;
          const showResult = selectedOption !== null;

          let optionStyle = styles.fcOptionButton;
          let textStyle = styles.fcOptionText;

          if (showResult) {
            if (isCorrectOption) {
              optionStyle = { ...styles.fcOptionButton, ...styles.fcOptionCorrect };
              textStyle = { ...styles.fcOptionText, ...styles.fcOptionTextCorrect };
            } else if (isSelected && !isCorrectOption) {
              optionStyle = { ...styles.fcOptionButton, ...styles.fcOptionWrong };
              textStyle = { ...styles.fcOptionText, ...styles.fcOptionTextWrong };
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
                <Ionicons name="checkmark-circle" size={24} color="#4ECDC4" />
              )}
              {showResult && isSelected && !isCorrectOption && (
                <Ionicons name="close-circle" size={24} color="#FF6B6B" />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Action Buttons */}
      <View style={styles.exerciseActions}>
        {selectedOption === null && (
          <TouchableOpacity
            style={[styles.fcSkipButton, isSkipping && styles.buttonDisabled]}
            disabled={isSkipping}
            onPress={handleReverseSkip}
            activeOpacity={0.7}
          >
            <Ionicons name="play-skip-forward" size={18} color={colors.text.muted} />
            <Text style={styles.fcSkipButtonText}>{i18n.t('learn.skip')}</Text>
          </TouchableOpacity>
        )}
        {selectedOption !== null && (
          <TouchableOpacity
            style={styles.fcNextButton}
            onPress={handleReverseNext}
            activeOpacity={0.7}
          >
            <Text style={styles.fcNextButtonText}>{i18n.t('learn.next')}</Text>
            <Ionicons name="arrow-forward" size={20} color={colors.background.primary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderPronunciation = () => {
    const feedback = pronunciationResult ? getPronunciationFeedback(pronunciationResult.pronunciationScore) : null;

    return (
      <ScrollView style={styles.exerciseContainer} contentContainerStyle={styles.pronunciationScrollContent}>
        <View style={styles.exerciseHeader}>
          <View style={styles.phaseIndicatorBadge}>
            <Ionicons name="mic-outline" size={20} color={colors.brand.gold} />
            <Text style={styles.phaseText}>{i18n.t('learn.pronunciationPractice')}</Text>
          </View>
          <Text style={styles.progressText}>
            {currentIndex + 1} / {learningWords.length}
          </Text>
        </View>

        {/* Word Card */}
        <View style={styles.pronunciationCard}>
          <Text style={styles.pronunciationPrompt}>{i18n.t('learn.sayTheWord')}</Text>
          <Text style={styles.pronunciationWord}>{currentWord?.word}</Text>
          {currentWord?.pronunciation && (
            <Text style={styles.pronunciationHintText}>{currentWord.pronunciation}</Text>
          )}

          {/* Listen Button */}
          <TouchableOpacity
            style={[styles.listenButton, isSpeaking && styles.listenButtonActive]}
            onPress={() => speakWord(currentWord?.word || '')}
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
              style={styles.stopRecordButton}
              onPress={stopRecording}
              activeOpacity={0.7}
            >
              <View style={styles.stopRecordButtonInner}>
                <Ionicons name="stop" size={32} color={colors.text.primary} />
              </View>
              <Text style={styles.stopRecordButtonText}>{i18n.t('learn.recording')}</Text>
            </TouchableOpacity>
          )}

          {isAnalyzing && (
            <View style={styles.analyzingSection}>
              <ActivityIndicator size="large" color={colors.brand.gold} />
              <Text style={styles.analyzingText}>{i18n.t('learn.pronunciation.analyzing')}</Text>
            </View>
          )}

          {hasRecorded && !isRecording && !isAnalyzing && pronunciationResult && (
            <View style={styles.pronResultSection}>
              {/* Score Circle */}
              <View style={[styles.pronScoreCircle, { borderColor: feedback?.color }]}>
                <Text style={[styles.pronScoreValue, { color: feedback?.color }]}>
                  {Math.round(pronunciationResult.pronunciationScore)}
                </Text>
                <Text style={styles.pronScoreLabel}>%</Text>
              </View>

              {/* Feedback Message */}
              <Text style={[styles.pronFeedbackText, { color: feedback?.color }]}>
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
                <View style={styles.pronScoreItem}>
                  <Text style={styles.pronScoreItemLabel}>{i18n.t('learn.pronunciation.accuracy')}</Text>
                  <Text style={styles.pronScoreItemValue}>{Math.round(pronunciationResult.accuracyScore)}%</Text>
                </View>
                <View style={styles.pronScoreItem}>
                  <Text style={styles.pronScoreItemLabel}>{i18n.t('learn.pronunciation.fluency')}</Text>
                  <Text style={styles.pronScoreItemValue}>{Math.round(pronunciationResult.fluencyScore)}%</Text>
                </View>
                <View style={styles.pronScoreItem}>
                  <Text style={styles.pronScoreItemLabel}>{i18n.t('learn.pronunciation.completeness')}</Text>
                  <Text style={styles.pronScoreItemValue}>{Math.round(pronunciationResult.completenessScore)}%</Text>
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
            style={[styles.fcSkipButton, isSkipping && styles.buttonDisabled]}
            disabled={isSkipping}
            onPress={handlePronunciationSkip}
            activeOpacity={0.7}
          >
            <Ionicons name="play-skip-forward" size={18} color={colors.text.muted} />
            <Text style={styles.fcSkipButtonText}>{i18n.t('learn.skip')}</Text>
          </TouchableOpacity>

          {hasRecorded && !isAnalyzing && (
            <TouchableOpacity
              style={[styles.fcNextButton, { marginLeft: spacing.md }]}
              onPress={handlePronunciationComplete}
              activeOpacity={0.7}
            >
              <Text style={styles.fcNextButtonText}>{i18n.t('learn.next')}</Text>
              <Ionicons name="arrow-forward" size={20} color={colors.background.primary} />
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    );
  };

  const renderComplete = () => {
    // Calculate learned words (correct in all phases)
    const learnedWordsList = selectedWords.filter(word => {
      const results = wordResults[word.id];
      if (!results) return false;
      return results.flashcard && results.matching && results.listening &&
             results.writing && results.reverseTranslation && results.pronunciation;
    });

    const getMotivationalMessage = () => {
      if (learnedWordsList.length === selectedWords.length) return i18n.t('learn.motivation.excellent');
      if (learnedWordsList.length >= 3) return i18n.t('learn.motivation.great');
      if (learnedWordsList.length >= 1) return i18n.t('learn.motivation.good');
      return i18n.t('learn.motivation.keepTrying');
    };

    const needsPracticeWords = selectedWords.filter(w => !learnedWordsList.includes(w));

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
          {learnedWordsList.length > 0 && (
            <View style={styles.resultSection}>
              <View style={styles.resultSectionHeader}>
                <Ionicons name="checkmark-circle" size={18} color={colors.status.success} />
                <Text style={styles.resultSectionTitleSuccess}>
                  {i18n.t('learn.youLearnedTheseWords')}
                </Text>
                <Text style={styles.resultCount}>{learnedWordsList.length}</Text>
              </View>
              <View style={styles.resultWordsRow}>
                {learnedWordsList.map(word => (
                  <View key={word.id} style={styles.learnedWordTag}>
                    <Text style={styles.learnedWordTagText}>{word.word}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Divider */}
          {learnedWordsList.length > 0 && needsPracticeWords.length > 0 && (
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
              setCurrentIndex(0);
              setExerciseResults({
                flashcard: { correct: 0, skipped: 0 },
                matching: { correct: 0, skipped: 0 },
                listening: { correct: 0, skipped: 0 },
                writing: { correct: 0, skipped: 0 },
                reverseTranslation: { correct: 0, skipped: 0 },
                pronunciation: { correct: 0, skipped: 0 },
              });
              setWordResults({});
              setScore({ correct: 0, total: 0, skipped: 0 });
              setHasRecorded(false);
              setRecordingUri(null);
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh" size={20} color={colors.brand.gold} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.doneButtonNew}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Text style={styles.doneButtonNewText}>{i18n.t('learn.done')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <LinearGradient
      colors={colors.background.gradient.colors}
      locations={colors.background.gradient.locations}
      style={styles.container}
      start={{ x: 0.5, y: 0.35 }}
      end={{ x: 0.5, y: 1 }}
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
            onPress={() => {
              stopSpeaking();
              router.back();
            }}
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

        {phase === 'selection' && renderSelection()}
        {phase === 'flashcard' && renderFlashcard()}
        {phase === 'matching' && renderMatching()}
        {phase === 'listening' && renderListening()}
        {phase === 'writing' && renderWriting()}
        {phase === 'reverseTranslation' && renderReverseTranslation()}
        {phase === 'pronunciation' && renderPronunciation()}
        {phase === 'complete' && renderComplete()}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: layout.headerPaddingTop,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
    color: colors.text.primary,
  },
  headerSubtitle: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: colors.brand.gold,
    marginTop: 2,
  },
  placeholder: {
    width: 40,
  },
  // Selection Phase Styles (matching learn.tsx)
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
  cardWordText: {
    fontFamily: fonts.heading,
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
    marginVertical: spacing.lg,
  },
  cardTranslationText: {
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
    overflow: 'hidden',
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
  progressText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text.secondary,
  },
  // Matching Phase Styles
  matchingInstruction: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  matchingTransRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  matchingTransCard: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    minWidth: (SCREEN_WIDTH - spacing.lg * 2 - spacing.sm * 2) / 2.5,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  matchingTransText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: colors.text.primary,
    textAlign: 'center',
  },
  matchingWordsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  matchingWordCard: {
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
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
    backgroundColor: 'rgba(201, 162, 39, 0.15)',
  },
  matchedCard: {
    borderColor: '#4CAF50',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    opacity: 0.7,
  },
  wrongCard: {
    borderColor: '#FF6B6B',
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
  },
  matchedText: {
    color: '#4CAF50',
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
    backgroundColor: 'rgba(76, 175, 80, 0.08)',
  },
  matchingHint: {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    color: colors.text.muted,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  // Listening Phase Styles
  listeningScrollContent: {
    paddingBottom: spacing.xl,
  },
  audioCard: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border.primary,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
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
  // Writing Phase Styles
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
    fontFamily: fonts.heading,
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
    borderColor: '#4ECDC4',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  inputWrong: {
    borderColor: '#FF6B6B',
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
  },
  writingActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
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
    color: '#4ECDC4',
    marginTop: spacing.sm,
  },
  resultWrong: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  resultWrongText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
    color: '#FF6B6B',
    marginTop: spacing.sm,
  },
  correctAnswer: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text.secondary,
    marginTop: spacing.sm,
  },
  // Reverse Translation Phase Styles
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
    fontFamily: fonts.heading,
    fontSize: layout.isSmallDevice ? 24 : 28,
    color: colors.text.primary,
  },
  reversePronunciation: {
    fontFamily: fonts.body,
    fontSize: fontSize.md,
    color: colors.text.muted,
    marginTop: spacing.xs,
  },
  // Pronunciation Phase Styles
  pronunciationScrollContent: {
    paddingBottom: spacing.xl,
  },
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
    fontFamily: fonts.heading,
    fontSize: layout.isSmallDevice ? 26 : 32,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  pronunciationHintText: {
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
    backgroundColor: '#F44336',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  recordButtonText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  stopRecordButton: {
    alignItems: 'center',
  },
  stopRecordButtonInner: {
    width: layout.isSmallDevice ? 64 : 80,
    height: layout.isSmallDevice ? 64 : 80,
    borderRadius: layout.isSmallDevice ? 32 : 40,
    backgroundColor: '#F44336',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
    borderWidth: 3,
    borderColor: colors.text.primary,
  },
  stopRecordButtonText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: '#F44336',
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
  pronResultSection: {
    alignItems: 'center',
    width: '100%',
  },
  pronScoreCircle: {
    width: layout.isSmallDevice ? 80 : 100,
    height: layout.isSmallDevice ? 80 : 100,
    borderRadius: layout.isSmallDevice ? 40 : 50,
    borderWidth: layout.isSmallDevice ? 3 : 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: layout.isSmallDevice ? spacing.sm : spacing.md,
  },
  pronScoreValue: {
    fontFamily: fonts.heading,
    fontSize: layout.isSmallDevice ? 26 : 32,
  },
  pronScoreLabel: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: colors.text.muted,
    marginTop: -4,
  },
  pronFeedbackText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  recognizedText: {
    fontFamily: fonts.body,
    fontSize: fontSize.md,
    color: colors.text.secondary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  detailedScores: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: layout.isSmallDevice ? spacing.sm : spacing.md,
    paddingHorizontal: spacing.md,
  },
  pronScoreItem: {
    alignItems: 'center',
  },
  pronScoreItemLabel: {
    fontFamily: fonts.body,
    fontSize: fontSize.xs,
    color: colors.text.muted,
    marginBottom: 2,
  },
  pronScoreItemValue: {
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
  playbackButtonActive: {
    backgroundColor: colors.brand.gold,
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
  completeContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    justifyContent: 'center',
  },
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
  // Flashcard (Visual Learning) Phase Styles
  exerciseContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  phaseIndicatorBadge: {
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
  imageCard: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border.primary,
    marginBottom: spacing.lg,
    overflow: 'hidden',
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
  flashcardOptionsContainer: {
    marginBottom: spacing.md,
  },
  fcOptionButton: {
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
  fcOptionText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text.primary,
    flex: 1,
  },
  fcOptionCorrect: {
    backgroundColor: 'rgba(78, 205, 196, 0.15)',
    borderColor: '#4ECDC4',
  },
  fcOptionTextCorrect: {
    color: '#4ECDC4',
  },
  fcOptionWrong: {
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
    borderColor: '#FF6B6B',
  },
  fcOptionTextWrong: {
    color: '#FF6B6B',
  },
  exerciseActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fcSkipButton: {
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
  fcSkipButtonText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: colors.text.muted,
    marginLeft: spacing.xs,
  },
  fcNextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand.gold,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  fcNextButtonText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: colors.background.primary,
    marginRight: spacing.sm,
  },
});
