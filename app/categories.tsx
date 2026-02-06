import { useEffect, useRef, useState } from 'react';
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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../src/i18n';
import { useLanguage } from '../src/context/LanguageContext';
import { useUser } from '../src/context/UserContext';
import { colors, fontSize, spacing, borderRadius, fonts, layout } from '../src/constants/theme';
import { getWordsByCategory } from '../src/data/words';

const { width } = Dimensions.get('window');

const ALL_CATEGORIES = [
  { id: 'everyday_objects', icon: 'cube-outline', color: '#45B7D1' },
  { id: 'food_drink', icon: 'restaurant-outline', color: '#FF6B6B' },
  { id: 'people_roles', icon: 'people-outline', color: '#673AB7' },
  { id: 'actions', icon: 'flash-outline', color: '#FF5722' },
  { id: 'adjectives', icon: 'color-palette-outline', color: '#00BFA5' },
  { id: 'emotions', icon: 'heart-outline', color: '#F06292' },
  { id: 'nature_animals', icon: 'leaf-outline', color: '#8BC34A' },
  { id: 'travel', icon: 'airplane-outline', color: '#4ECDC4' },
  { id: 'sports_hobbies', icon: 'football-outline', color: '#E67E22' },
];

export default function CategoriesScreen() {
  const router = useRouter();
  const { locale } = useLanguage(); // For re-render on language change
  const { preferences } = useUser();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const [categoryProgress, setCategoryProgress] = useState<{ [key: string]: { learned: number; total: number } }>({});

  const learningLang = preferences.learningLanguage?.code || 'en';
  const nativeLang = preferences.nativeLanguage?.code || 'tr';
  const userLevel = preferences.level;

  useEffect(() => {
    const loadProgress = async () => {
      const progress: { [key: string]: { learned: number; total: number } } = {};

      for (const category of ALL_CATEGORIES) {
        // Get total words for this category
        const words = getWordsByCategory(category.id, learningLang, nativeLang, userLevel);
        const total = words.length;

        // Get learned words count (language-specific)
        let learned = 0;
        try {
          const saved = await AsyncStorage.getItem(`learned_${learningLang}_${category.id}`);
          if (saved) {
            const learnedIds = JSON.parse(saved) as string[];
            learned = learnedIds.length;
          }
        } catch {}

        progress[category.id] = { learned, total };
      }

      setCategoryProgress(progress);
    };

    loadProgress();
  }, [learningLang, nativeLang, userLevel]);

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

  const cardWidth = (width - spacing.lg * 2 - spacing.md) / 2;

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
            <Text style={styles.headerTitle}>{i18n.t('explore.categories')}</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Categories Grid */}
          <View style={styles.grid}>
            {ALL_CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[styles.categoryCard, { width: cardWidth }]}
                activeOpacity={0.8}
                onPress={() => router.push(`/topic?id=${category.id}`)}
              >
                <LinearGradient
                  colors={[`${category.color}25`, `${category.color}08`]}
                  style={styles.cardGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={[styles.iconContainer, { backgroundColor: `${category.color}30` }]}>
                    <Ionicons name={category.icon as any} size={32} color={category.color} />
                  </View>
                  <Text style={styles.categoryName}>
                    {i18n.t(`topicSelect.topics.${category.id}`)}
                  </Text>
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBarBg}>
                      <View
                        style={[
                          styles.progressBarFill,
                          {
                            width: `${categoryProgress[category.id]?.total > 0
                              ? (categoryProgress[category.id].learned / categoryProgress[category.id].total) * 100
                              : 0}%`,
                            backgroundColor: category.color,
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.progressText, { color: category.color }]}>
                      {Math.round(categoryProgress[category.id]?.total > 0
                        ? (categoryProgress[category.id].learned / categoryProgress[category.id].total) * 100
                        : 0)}%
                    </Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
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
    justifyContent: 'space-between',
    paddingTop: layout.headerPaddingTop,
    paddingBottom: spacing.xl,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.xl,
    color: colors.text.primary,
  },
  placeholder: {
    width: 40,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  categoryCard: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  cardGradient: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  categoryName: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  progressContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  progressBarBg: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.xs,
    minWidth: 32,
    textAlign: 'right',
  },
});
