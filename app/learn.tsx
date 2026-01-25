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
import i18n from '../src/i18n';
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

type LearningPhase = 'selection' | 'flashcard' | 'listening' | 'writing' | 'complete';

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
  }>({
    flashcard: { correct: 0, skipped: 0 },
    listening: { correct: 0, skipped: 0 },
    writing: { correct: 0, skipped: 0 },
  });
  const [options, setOptions] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [wordsLoading, setWordsLoading] = useState(true);

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

  // Generate random options for multiple choice
  const generateOptions = useCallback((correctWord: Word, allWords: Word[]) => {
    const otherWords = allWords.filter(w => w.id !== correctWord.id);
    const shuffled = otherWords.sort(() => Math.random() - 0.5);
    const wrongOptions = shuffled.slice(0, 3).map(w => w.word);
    const allOptions = [...wrongOptions, correctWord.word].sort(() => Math.random() - 0.5);
    return allOptions;
  }, []);

  // Update options when word changes in flashcard or listening phase
  useEffect(() => {
    if ((phase === 'flashcard' || phase === 'listening') && currentWord && allWords.length > 0) {
      const newOptions = generateOptions(currentWord, allWords);
      setOptions(newOptions);
      setSelectedOption(null);
      setIsCorrect(null);
    }
  }, [phase, currentWordIndex, currentWord, generateOptions, allWords]);

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
    if (availableWords.length <= 1) {
      if (selectedWords.length >= 5) {
        setPhase('flashcard');
        setCurrentWordIndex(0);
        setShowAnswer(false);
        setCorrectCount(0);
      }
      return;
    }
    animateCardOut('right', () => {
      setAvailableWords(prev => prev.slice(1));
    });
  }, [availableWords.length, selectedWords.length, animateCardOut]);

  const handleLearnWord = useCallback(() => {
    const word = availableWords[0];
    if (!word) return;

    animateCardOut('left', () => {
      setSelectedWords(prev => {
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
    });
  }, [availableWords, animateCardOut]);

  // Refs to hold latest handlers for panResponder
  const handleKnowWordRef = useRef(handleKnowWord);
  const handleLearnWordRef = useRef(handleLearnWord);
  const phaseRef = useRef(phase);

  useEffect(() => {
    handleKnowWordRef.current = handleKnowWord;
    handleLearnWordRef.current = handleLearnWord;
    phaseRef.current = phase;
  }, [handleKnowWord, handleLearnWord, phase]);

  const panResponder = useMemo(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => phaseRef.current === 'selection',
      onMoveShouldSetPanResponder: () => phaseRef.current === 'selection',
      onPanResponderMove: (_, gesture) => {
        cardPosition.setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (_, gesture) => {
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
      setPhase('complete');
    }
  };

  const handleWritingNext = () => {
    if (currentWordIndex < selectedWords.length - 1) {
      setCurrentWordIndex(prev => prev + 1);
      setUserInput('');
      setIsCorrect(null);
    } else {
      // Complete
      setPhase('complete');
    }
  };

  const playSound = () => {
    // TODO: Implement text-to-speech
    console.log('Playing sound for:', currentWord?.word);
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
            <Text style={styles.wordText}>{currentWord.word}</Text>
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
          style={[styles.actionButton, styles.learnButton]}
          onPress={handleLearnWord}
          activeOpacity={0.7}
        >
          <Ionicons name="add-circle" size={28} color={colors.brand.gold} />
          <Text style={styles.learnButtonText}>{i18n.t('learn.addToLearn')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.knowButton]}
          onPress={handleKnowWord}
          activeOpacity={0.7}
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
          style={styles.playButton}
          onPress={playSound}
          activeOpacity={0.7}
        >
          <Ionicons name="volume-high" size={32} color={colors.brand.gold} />
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

  const renderCompletePhase = () => {
    const totalCorrect = exerciseResults.flashcard.correct + exerciseResults.listening.correct + exerciseResults.writing.correct;
    const totalSkipped = exerciseResults.flashcard.skipped + exerciseResults.listening.skipped + exerciseResults.writing.skipped;
    const totalAnswered = (selectedWords.length * 3) - totalSkipped;
    const percentage = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

    const formatResult = (correct: number, skipped: number) => {
      const answered = selectedWords.length - skipped;
      if (skipped > 0) {
        return `${correct}/${answered} (${skipped} ${i18n.t('learn.skipped')})`;
      }
      return `${correct}/${selectedWords.length}`;
    };

    return (
      <View style={styles.completeContainer}>
        <View style={styles.completeIcon}>
          <Ionicons name="trophy" size={64} color={colors.brand.gold} />
        </View>

        <Text style={styles.completeTitle}>{i18n.t('learn.sessionComplete')}</Text>
        <Text style={styles.completeSubtitle}>{i18n.t('learn.greatJob')}</Text>

        <View style={styles.resultsCard}>
          <View style={styles.resultRow}>
            <Ionicons name="eye-outline" size={24} color={colors.brand.gold} />
            <Text style={styles.resultLabel}>{i18n.t('learn.visualLearning')}</Text>
            <Text style={styles.resultValue}>
              {formatResult(exerciseResults.flashcard.correct, exerciseResults.flashcard.skipped)}
            </Text>
          </View>
          <View style={styles.resultDivider} />
          <View style={styles.resultRow}>
            <Ionicons name="headset-outline" size={24} color={colors.brand.gold} />
            <Text style={styles.resultLabel}>{i18n.t('learn.audioLearning')}</Text>
            <Text style={styles.resultValue}>
              {formatResult(exerciseResults.listening.correct, exerciseResults.listening.skipped)}
            </Text>
          </View>
          <View style={styles.resultDivider} />
          <View style={styles.resultRow}>
            <Ionicons name="create-outline" size={24} color={colors.brand.gold} />
            <Text style={styles.resultLabel}>{i18n.t('learn.writingPractice')}</Text>
            <Text style={styles.resultValue}>
              {formatResult(exerciseResults.writing.correct, exerciseResults.writing.skipped)}
            </Text>
          </View>
        </View>

        <View style={styles.totalScore}>
          <Text style={styles.totalScoreLabel}>{i18n.t('learn.totalScore')}</Text>
          <Text style={styles.totalScoreValue}>{percentage}%</Text>
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
              });
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh" size={20} color={colors.brand.gold} />
            <Text style={styles.reviewButtonText}>{i18n.t('learn.reviewAgain')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.doneButton}
            onPress={() => router.push('/home')}
            activeOpacity={0.7}
          >
            <Text style={styles.doneButtonText}>{i18n.t('learn.done')}</Text>
            <Ionicons name="checkmark" size={20} color={colors.background.primary} />
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
    marginBottom: spacing.sm,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
  optionText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
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
    justifyContent: 'center',
  },
  completeIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(201, 162, 39, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  completeTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSize.xxl,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  completeSubtitle: {
    fontFamily: fonts.body,
    fontSize: fontSize.md,
    color: colors.text.muted,
    marginBottom: spacing.xl,
  },
  resultsCard: {
    width: '100%',
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border.primary,
    padding: spacing.lg,
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
    marginVertical: spacing.sm,
  },
  totalScore: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  totalScoreLabel: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text.muted,
    marginBottom: spacing.sm,
  },
  totalScoreValue: {
    fontFamily: fonts.bold,
    fontSize: 48,
    color: colors.brand.gold,
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
    fontSize: fontSize.md,
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
    fontSize: fontSize.md,
    color: colors.background.primary,
    marginRight: spacing.sm,
  },
});
