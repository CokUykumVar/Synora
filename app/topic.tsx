import { useEffect, useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../src/i18n';
import { useLanguage } from '../src/context/LanguageContext';
import { useUser } from '../src/context/UserContext';
import { colors, fontSize, spacing, borderRadius, fonts, layout } from '../src/constants/theme';
import { speakWithAzure } from '../src/services/azureSpeech';
import { getWordsByCategory } from '../src/data/words';
import { useNetwork } from '../src/context/NetworkContext';

const { width } = Dimensions.get('window');

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
  verbs: '#FF5722',
  adjectives: '#00BFA5',
  emotions: '#F06292',
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
  verbs: 'flash-outline',
  adjectives: 'color-palette-outline',
  emotions: 'heart-outline',
};

export default function TopicScreen() {
  const router = useRouter();
  const { locale } = useLanguage(); // For re-render on language change
  const { preferences } = useUser(); // Get language settings from onboarding
  const { isConnected } = useNetwork();
  const { id } = useLocalSearchParams<{ id: string }>();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const [playingWord, setPlayingWord] = useState<string | null>(null);
  const [learnedWords, setLearnedWords] = useState<string[]>([]);

  const categoryId = id || 'travel';
  const color = CATEGORY_COLORS[categoryId] || colors.brand.gold;
  const icon = CATEGORY_ICONS[categoryId] || 'book-outline';

  // Get language codes from user preferences (set in onboarding)
  const learnLanguage = preferences.learningLanguage?.code || 'en';
  const nativeLanguage = preferences.nativeLanguage?.code || 'tr';

  // Get user level from preferences
  const userLevel = preferences.level;

  // Get words from the actual data based on user's language settings and level
  const words = useMemo(() => {
    const categoryWords = getWordsByCategory(categoryId, learnLanguage, nativeLanguage, userLevel);
    const mapped = categoryWords.map(w => ({
      id: w.id,
      word: w.word,
      translation: w.translation,
      learned: learnedWords.includes(w.id),
    }));
    // Sort learned words to the top
    return mapped.sort((a, b) => (a.learned === b.learned ? 0 : a.learned ? -1 : 1));
  }, [categoryId, learnLanguage, nativeLanguage, userLevel, learnedWords]);

  const learnedCount = words.filter(w => w.learned).length;
  const progress = words.length > 0 ? learnedCount / words.length : 0;


  useEffect(() => {
    // Load learned words for this category (language-specific)
    const loadLearnedWords = async () => {
      try {
        const savedLearned = await AsyncStorage.getItem(`learned_${learnLanguage}_${categoryId}`);
        if (savedLearned) setLearnedWords(JSON.parse(savedLearned));
        else setLearnedWords([]); // Reset if no data for this language
      } catch (error) {
        console.log('Error loading learned words:', error);
      }
    };
    loadLearnedWords();

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
  }, [categoryId, learnLanguage]);

  const playWordSound = async (word: string) => {
    if (playingWord) return;

    // Check internet connection - overlay will show automatically if not connected
    if (!isConnected) return;

    setPlayingWord(word);
    try {
      await speakWithAzure(
        word,
        learnLanguage,
        () => {},
        () => setPlayingWord(null)
      );
    } catch (error) {
      console.log('Error playing sound:', error);
      setPlayingWord(null);
    }
  };

  return (
    <LinearGradient
      colors={colors.background.gradient.colors}
      locations={colors.background.gradient.locations}
      style={styles.container}
      start={{ x: 0.5, y: 0.35 }}
      end={{ x: 0.5, y: 1 }}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
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
          </View>

          {/* Topic Info Card */}
          <View style={styles.topicCard}>
            <LinearGradient
              colors={[`${color}25`, `${color}08`]}
              style={styles.topicGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={[styles.topicIcon, { backgroundColor: `${color}30` }]}>
                <Ionicons name={icon as any} size={40} color={color} />
              </View>
              <Text style={styles.topicTitle}>
                {i18n.t(`topicSelect.topics.${categoryId}`)}
              </Text>
              <View style={styles.progressSection}>
                <View style={styles.progressHeader}>
                  <View style={styles.learnedBadgeInfo}>
                    <Ionicons name="checkmark-circle" size={16} color={color} />
                    <Text style={[styles.learnedText, { color }]}>{learnedCount} {i18n.t('learn.wordsLearned')}</Text>
                  </View>
                  <Text style={styles.progressPercent}>{Math.round(progress * 100)}%</Text>
                </View>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${progress * 100}%`, backgroundColor: color }]} />
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Start Learning Button */}
          <TouchableOpacity style={styles.startButton} activeOpacity={0.8} onPress={() => router.push(`/category-learn?category=${categoryId}`)}>
            <LinearGradient
              colors={[colors.brand.gold, colors.brand.goldSoft]}
              style={styles.startButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="play" size={24} color={colors.background.primary} />
              <Text style={styles.startButtonText}>{i18n.t('home.startLearning')}</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Words List */}
          <View style={styles.wordsSection}>
            <View style={styles.wordsGrid}>
              {words.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.wordCard,
                    item.learned && { borderColor: color, backgroundColor: `${color}10` },
                    playingWord === item.word && styles.wordCardPlaying
                  ]}
                  activeOpacity={0.7}
                  onPress={() => playWordSound(item.word)}
                >
                  {item.learned && (
                    <View style={[styles.learnedBadge, { backgroundColor: `${color}20` }]}>
                      <Ionicons name="checkmark" size={12} color={color} />
                    </View>
                  )}
                  {playingWord === item.word ? (
                    <Ionicons name="volume-high" size={16} color={colors.brand.gold} style={styles.playingIcon} />
                  ) : null}
                  <Text style={styles.wordText} numberOfLines={1}>{item.word.charAt(0).toUpperCase() + item.word.slice(1)}</Text>
                  <Text style={styles.translationText} numberOfLines={1}>{item.translation}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: layout.headerPaddingTop,
    paddingBottom: spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topicCard: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  topicGradient: {
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  topicIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  topicTitle: {
    fontFamily: fonts.heading,
    fontSize: fontSize.xxl,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  progressSection: {
    width: '100%',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  learnedBadgeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  learnedText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
  },
  progressPercent: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  progressBarBg: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  startButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.xl,
  },
  startButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  startButtonText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
    color: colors.background.primary,
  },
  wordsSection: {
    flex: 1,
  },
  sectionTitle: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  wordsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  wordCard: {
    width: (width - spacing.lg * 2 - spacing.sm * 2) / 3,
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.primary,
    alignItems: 'center',
    position: 'relative',
  },
  wordCardPlaying: {
    borderColor: colors.brand.gold,
    backgroundColor: 'rgba(201, 162, 39, 0.15)',
  },
  playingIcon: {
    marginBottom: spacing.xs,
  },
  wordText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.xs,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 2,
  },
  translationText: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.text.muted,
    textAlign: 'center',
  },
  learnedBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
