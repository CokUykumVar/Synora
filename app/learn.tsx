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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import i18n from '../src/i18n';
import {
  isAzureConfigured,
  speakWithAzure,
  assessPronunciation,
  getPronunciationFeedback,
  PronunciationResult,
} from '../src/services/azureSpeech';

// Language code mapping for Text-to-Speech
// Note: Some languages use fallback codes for better TTS support
const languageToSpeechCode: { [key: string]: string } = {
  en: 'en-US',
  tr: 'tr-TR',
  de: 'de-DE',
  es: 'es-ES',
  fr: 'fr-FR',
  it: 'it-IT',
  pt: 'pt-PT',    // European Portuguese (clearer pronunciation)
  ru: 'ru-RU',
  ja: 'ja-JP',
  zh: 'zh-CN',
  ko: 'ko-KR',
  ar: 'ar-XA',    // Google's Arabic (better support than ar-SA)
  az: 'tr-TR',    // Azerbaijani → Turkish (similar Turkic language)
  hr: 'hr-HR',
  cs: 'cs-CZ',
  da: 'da-DK',
  nl: 'nl-NL',
  fi: 'fi-FI',
  el: 'el-GR',
  hi: 'hi-IN',
  id: 'id-ID',
  no: 'nb-NO',
  pl: 'pl-PL',
  ro: 'ro-RO',
  sv: 'sv-SE',
  th: 'th-TH',
  uk: 'ru-RU',    // Ukrainian → Russian (Slavic, better TTS support)
  ur: 'hi-IN',    // Urdu → Hindi (mutually intelligible, same phonetics)
  vi: 'vi-VN',
};

// Language-specific speech rates for better clarity
// Some languages need slower speech for better pronunciation
const languageSpeechRate: { [key: string]: number } = {
  en: 0.75,
  tr: 0.7,
  de: 0.7,
  es: 0.75,
  fr: 0.7,
  it: 0.75,
  pt: 0.7,   // Portuguese
  ru: 0.65,  // Russian needs slower speech
  ja: 0.55,  // Japanese needs slower speech
  zh: 0.55,  // Chinese needs slower speech
  ko: 0.6,   // Korean needs slower speech
  ar: 0.55,  // Arabic needs slower speech
  az: 0.7,   // Azerbaijani (uses Turkish TTS)
  hr: 0.7,   // Croatian
  cs: 0.7,   // Czech
  da: 0.7,   // Danish
  nl: 0.7,   // Dutch
  fi: 0.7,   // Finnish
  el: 0.65,  // Greek
  hi: 0.6,   // Hindi
  id: 0.7,   // Indonesian
  no: 0.7,   // Norwegian
  pl: 0.7,   // Polish
  ro: 0.7,   // Romanian
  sv: 0.7,   // Swedish
  th: 0.55,  // Thai needs slower speech
  uk: 0.65,  // Ukrainian (uses Russian TTS)
  ur: 0.6,   // Urdu (uses Hindi TTS)
  vi: 0.55,  // Vietnamese needs slower speech
};
import { colors, fontSize, spacing, borderRadius, fonts } from '../src/constants/theme';
import { useUser } from '../src/context/UserContext';
import { getWordsForLanguagePair } from '../src/data/words';

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

type LearningPhase = 'selection' | 'flashcard' | 'listening' | 'writing' | 'reverseTranslation' | 'pronunciation' | 'complete';

export default function LearnScreen() {
  const router = useRouter();
  const { preferences, isLoading: prefsLoading } = useUser();
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
  const [selectedWords, setSelectedWords] = useState<Word[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [exerciseResults, setExerciseResults] = useState<{
    flashcard: { correct: number; skipped: number };
    listening: { correct: number; skipped: number };
    writing: { correct: number; skipped: number };
    reverseTranslation: { correct: number; skipped: number };
    pronunciation: { correct: number; skipped: number };
  }>({
    flashcard: { correct: 0, skipped: 0 },
    listening: { correct: 0, skipped: 0 },
    writing: { correct: 0, skipped: 0 },
    reverseTranslation: { correct: 0, skipped: 0 },
    pronunciation: { correct: 0, skipped: 0 },
  });
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

  // Check if Azure is configured on mount
  useEffect(() => {
    setUseAzure(isAzureConfigured());
  }, []);

  // Load words based on user's language preferences
  useEffect(() => {
    if (!prefsLoading) {
      const learningLang = preferences.learningLanguage?.code || 'en';
      const nativeLang = preferences.nativeLanguage?.code || 'tr';

      const words = getWordsForLanguagePair(learningLang, nativeLang);
      setAllWords(words);
      setAvailableWords([...words]);
      setWordsLoading(false);
    }
  }, [prefsLoading, preferences.learningLanguage, preferences.nativeLanguage]);

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
  }, [availableWords.length, selectedWords.length, animateCardOut, isSwiping]);

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

    if (correct) {
      setExerciseResults(prev => ({
        ...prev,
        flashcard: { ...prev.flashcard, correct: prev.flashcard.correct + 1 },
      }));
    }
  };

  const handleFlashcardSkip = () => {
    setExerciseResults(prev => ({
      ...prev,
      flashcard: { ...prev.flashcard, skipped: prev.flashcard.skipped + 1 },
    }));

    if (currentWordIndex < selectedWords.length - 1) {
      setCurrentWordIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsCorrect(null);
    } else {
      setPhase('listening');
      setCurrentWordIndex(0);
      setSelectedOption(null);
      setIsCorrect(null);
    }
  };

  const handleFlashcardNext = () => {
    if (currentWordIndex < selectedWords.length - 1) {
      setCurrentWordIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsCorrect(null);
    } else {
      // Move to listening phase
      setPhase('listening');
      setCurrentWordIndex(0);
      setShowAnswer(false);
      setSelectedOption(null);
      setIsCorrect(null);
    }
  };

  const handleListeningOptionSelect = (option: string) => {
    if (selectedOption !== null) return; // Already selected

    setSelectedOption(option);
    const correct = option === currentWord?.word;
    setIsCorrect(correct);

    if (correct) {
      setExerciseResults(prev => ({
        ...prev,
        listening: { ...prev.listening, correct: prev.listening.correct + 1 },
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
  };

  const handleWritingCheck = () => {
    const isMatch = userInput.toLowerCase().trim() === currentWord.word.toLowerCase();
    setIsCorrect(isMatch);
    if (isMatch) {
      setExerciseResults(prev => ({
        ...prev,
        writing: { ...prev.writing, correct: prev.writing.correct + 1 },
      }));
    }
  };

  const handleWritingSkip = () => {
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

    if (correct) {
      setExerciseResults(prev => ({
        ...prev,
        reverseTranslation: { ...prev.reverseTranslation, correct: prev.reverseTranslation.correct + 1 },
      }));
    }
  };

  const handleReverseSkip = () => {
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
  // Custom recording options for Azure Speech (WAV format)
  const azureRecordingOptions: Audio.RecordingOptions = {
    isMeteringEnabled: true,
    android: {
      extension: '.wav',
      outputFormat: Audio.AndroidOutputFormat.DEFAULT,
      audioEncoder: Audio.AndroidAudioEncoder.DEFAULT,
      sampleRate: 16000,
      numberOfChannels: 1,
      bitRate: 256000,
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
      mimeType: 'audio/wav',
      bitsPerSecond: 256000,
    },
  };

  const startRecording = async () => {
    try {
      // Request permissions
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        console.log('Permission not granted');
        return;
      }

      // Set audio mode for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Start recording with Azure-compatible options
      const { recording: newRecording } = await Audio.Recording.createAsync(
        useAzure ? azureRecordingOptions : Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
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
          const langCode = preferences.learningLanguage?.code || 'en';
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
    if (score >= 60) {
      setExerciseResults(prev => ({
        ...prev,
        pronunciation: { ...prev.pronunciation, correct: prev.pronunciation.correct + 1 },
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

    const langCode = preferences.learningLanguage?.code || 'en';

    setIsSpeaking(true);

    try {
      // Use Azure TTS if configured, otherwise fall back to expo-speech
      if (useAzure) {
        await speakWithAzure(
          currentWord.word,
          langCode,
          () => {},
          () => setIsSpeaking(false)
        );
      } else {
        const speechLang = languageToSpeechCode[langCode] || 'en-US';
        const speechRate = languageSpeechRate[langCode] || 0.7;

        await Speech.speak(currentWord.word, {
          language: speechLang,
          rate: speechRate,
          pitch: 1.0,
          onDone: () => setIsSpeaking(false),
          onError: () => setIsSpeaking(false),
        });
      }
    } catch (error) {
      console.log('Speech error:', error);
      setIsSpeaking(false);
      // Fall back to expo-speech if Azure fails
      if (useAzure) {
        const speechLang = languageToSpeechCode[langCode] || 'en-US';
        const speechRate = languageSpeechRate[langCode] || 0.7;
        try {
          await Speech.speak(currentWord.word, {
            language: speechLang,
            rate: speechRate,
            pitch: 1.0,
            onDone: () => setIsSpeaking(false),
            onError: () => setIsSpeaking(false),
          });
        } catch (fallbackError) {
          console.log('Fallback speech error:', fallbackError);
          setIsSpeaking(false);
        }
      }
    }
  };

  // Stop speech when leaving the screen
  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

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

      <View style={styles.swipeHints}>
        <View style={styles.swipeHint}>
          <Ionicons name="arrow-back" size={24} color={colors.brand.gold} />
          <Text style={styles.swipeHintText}>{i18n.t('learn.wantToLearn')}</Text>
        </View>
        <View style={styles.swipeHint}>
          <Text style={styles.swipeHintText}>{i18n.t('learn.alreadyKnow')}</Text>
          <Ionicons name="arrow-forward" size={24} color={colors.text.muted} />
        </View>
      </View>

      <View style={styles.actionButtons}>
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
            style={styles.skipButton}
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
            style={styles.skipButton}
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
              style={styles.skipButton}
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
            style={styles.skipButton}
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
            style={styles.skipButton}
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
    const totalCorrect = exerciseResults.flashcard.correct + exerciseResults.listening.correct + exerciseResults.writing.correct + exerciseResults.reverseTranslation.correct + exerciseResults.pronunciation.correct;
    const totalSkipped = exerciseResults.flashcard.skipped + exerciseResults.listening.skipped + exerciseResults.writing.skipped + exerciseResults.reverseTranslation.skipped + exerciseResults.pronunciation.skipped;
    const totalAnswered = (selectedWords.length * 5) - totalSkipped;
    const percentage = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

    const formatResult = (correct: number, skipped: number) => {
      const answered = selectedWords.length - skipped;
      if (skipped > 0) {
        return `${correct}/${answered} (${skipped} ${i18n.t('learn.skipped')})`;
      }
      return `${correct}/${selectedWords.length}`;
    };

    const getMotivationalMessage = () => {
      if (percentage >= 90) return i18n.t('learn.motivation.excellent');
      if (percentage >= 70) return i18n.t('learn.motivation.great');
      if (percentage >= 50) return i18n.t('learn.motivation.good');
      if (percentage >= 30) return i18n.t('learn.motivation.keepTrying');
      return i18n.t('learn.motivation.practiceMore');
    };

    return (
      <View style={styles.completeContainer}>
        <View style={styles.completeHeader}>
          <View style={styles.completeIcon}>
            <Ionicons name="trophy" size={48} color={colors.brand.gold} />
          </View>
          <Text style={styles.completeTitle}>{i18n.t('learn.sessionComplete')}</Text>
        </View>

        <View style={styles.scoreSection}>
          <Text style={styles.totalScoreValue}>{percentage}%</Text>
          <Text style={styles.motivationText}>{getMotivationalMessage()}</Text>
        </View>

        <View style={styles.resultsCard}>
          <View style={styles.resultRow}>
            <Ionicons name="eye-outline" size={22} color={colors.brand.gold} />
            <Text style={styles.resultLabel}>{i18n.t('learn.visualLearning')}</Text>
            <Text style={styles.resultValue}>
              {formatResult(exerciseResults.flashcard.correct, exerciseResults.flashcard.skipped)}
            </Text>
          </View>
          <View style={styles.resultDivider} />
          <View style={styles.resultRow}>
            <Ionicons name="headset-outline" size={22} color={colors.brand.gold} />
            <Text style={styles.resultLabel}>{i18n.t('learn.audioLearning')}</Text>
            <Text style={styles.resultValue}>
              {formatResult(exerciseResults.listening.correct, exerciseResults.listening.skipped)}
            </Text>
          </View>
          <View style={styles.resultDivider} />
          <View style={styles.resultRow}>
            <Ionicons name="create-outline" size={22} color={colors.brand.gold} />
            <Text style={styles.resultLabel}>{i18n.t('learn.writingPractice')}</Text>
            <Text style={styles.resultValue}>
              {formatResult(exerciseResults.writing.correct, exerciseResults.writing.skipped)}
            </Text>
          </View>
          <View style={styles.resultDivider} />
          <View style={styles.resultRow}>
            <Ionicons name="swap-horizontal" size={22} color={colors.brand.gold} />
            <Text style={styles.resultLabel}>{i18n.t('learn.reverseTranslation')}</Text>
            <Text style={styles.resultValue}>
              {formatResult(exerciseResults.reverseTranslation.correct, exerciseResults.reverseTranslation.skipped)}
            </Text>
          </View>
          <View style={styles.resultDivider} />
          <View style={styles.resultRow}>
            <Ionicons name="mic-outline" size={22} color={colors.brand.gold} />
            <Text style={styles.resultLabel}>{i18n.t('learn.pronunciationPractice')}</Text>
            <Text style={styles.resultValue}>
              {formatResult(exerciseResults.pronunciation.correct, exerciseResults.pronunciation.skipped)}
            </Text>
          </View>
        </View>

        <View style={styles.completeButtons}>
          <TouchableOpacity
            style={styles.reviewButton}
            onPress={() => {
              setPhase('flashcard');
              setCurrentWordIndex(0);
              setShowAnswer(false);
              setExerciseResults({
                flashcard: { correct: 0, skipped: 0 },
                listening: { correct: 0, skipped: 0 },
                writing: { correct: 0, skipped: 0 },
                reverseTranslation: { correct: 0, skipped: 0 },
                pronunciation: { correct: 0, skipped: 0 },
              });
              setHasRecorded(false);
              setRecordingUri(null);
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh" size={18} color={colors.brand.gold} />
            <Text style={styles.reviewButtonText}>{i18n.t('learn.reviewAgain')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.doneButton}
            onPress={() => router.push('/home')}
            activeOpacity={0.7}
          >
            <Text style={styles.doneButtonText}>{i18n.t('learn.done')}</Text>
            <Ionicons name="checkmark" size={18} color={colors.background.primary} />
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
    paddingTop: 60,
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
    marginBottom: spacing.lg,
  },
  selectionTitle: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.xl,
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
    marginBottom: spacing.xl,
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
    padding: spacing.xl,
    marginHorizontal: spacing.md,
    marginBottom: spacing.xl,
    minHeight: 280,
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
    fontSize: 32,
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
    height: 180,
    backgroundColor: colors.background.tertiary,
  },
  imagePlaceholder: {
    width: '100%',
    height: 180,
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
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    maxHeight: 450,
  },
  listeningPrompt: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  playButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
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
    fontSize: 24,
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
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.xl,
    maxHeight: 450,
  },
  writingPrompt: {
    fontFamily: fonts.medium,
    fontSize: fontSize.lg,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  writingTranslation: {
    fontFamily: fonts.bold,
    fontSize: 28,
    color: colors.brand.gold,
    marginBottom: spacing.xl,
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
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: spacing.md,
  },
  completeHeader: {
    alignItems: 'center',
  },
  completeIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(201, 162, 39, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  completeTitle: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: colors.text.primary,
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
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  reversePrompt: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  reverseWord: {
    fontFamily: fonts.bold,
    fontSize: 28,
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
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  pronunciationPrompt: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  pronunciationWord: {
    fontFamily: fonts.bold,
    fontSize: 32,
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
    marginBottom: spacing.lg,
  },
  recordButton: {
    alignItems: 'center',
  },
  recordButtonInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
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
    width: 80,
    height: 80,
    borderRadius: 40,
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
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  scoreValue: {
    fontFamily: fonts.bold,
    fontSize: 32,
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
    marginTop: spacing.md,
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
    marginTop: spacing.lg,
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
});
