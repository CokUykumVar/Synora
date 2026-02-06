import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
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

// Base weekly data without goal (goal will be added dynamically from user preferences)
const WEEKLY_DATA_BASE = [
  { day: 'mon', words: 0 },
  { day: 'tue', words: 0 },
  { day: 'wed', words: 0 },
  { day: 'thu', words: 0 },
  { day: 'fri', words: 0 },
  { day: 'sat', words: 0 },
  { day: 'sun', words: 0 },
];

const ALL_CATEGORIES = [
  { id: 'everyday_objects', color: '#45B7D1', icon: 'cube-outline' },
  { id: 'food_drink', color: '#FF6B6B', icon: 'restaurant-outline' },
  { id: 'people_roles', color: '#673AB7', icon: 'people-outline' },
  { id: 'actions', color: '#FF5722', icon: 'flash-outline' },
  { id: 'adjectives', color: '#00BFA5', icon: 'color-palette-outline' },
  { id: 'emotions', color: '#F06292', icon: 'heart-outline' },
  { id: 'nature_animals', color: '#8BC34A', icon: 'leaf-outline' },
  { id: 'travel', color: '#4ECDC4', icon: 'airplane-outline' },
  { id: 'sports_hobbies', color: '#E67E22', icon: 'football-outline' },
];

export default function StatsScreen() {
  const router = useRouter();
  const { locale } = useLanguage(); // For re-render on language change
  const { preferences } = useUser(); // Get user preferences
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const barAnims = useRef(WEEKLY_DATA_BASE.map(() => new Animated.Value(0))).current;

  // Get language codes from user preferences
  const learningLang = preferences.learningLanguage?.code || 'en';
  const nativeLang = preferences.nativeLanguage?.code || 'tr';
  const userLevel = preferences.level;

  // Get daily goal from user preferences (set in onboarding/settings)
  const dailyGoal = preferences.dailyGoal || 10;

  // State for dynamic stats (language-specific)
  const [stats, setStats] = useState({
    totalWords: 0,
    weeklyWords: 0,
    streak: 0,
    weeklyAverage: 0,
    totalTime: 0,
    weeklyTime: 0,
    topCategory: 'everyday_objects',
  });

  const [weeklyData, setWeeklyData] = useState(WEEKLY_DATA_BASE.map(day => ({ ...day, goal: dailyGoal })));
  const [categoryStats, setCategoryStats] = useState<Array<{ id: string; words: number; total: number; color: string; icon: string }>>([]);

  // Load stats from AsyncStorage (language-specific)
  const loadStats = useCallback(async () => {
    try {
      // Load total learned words across all categories for this language
      let totalLearned = 0;
      let topCat = 'everyday_objects';
      let maxCatWords = 0;
      const catStatsArray: Array<{ id: string; words: number; total: number; color: string; icon: string }> = [];

      for (const cat of ALL_CATEGORIES) {
        const key = `learned_${learningLang}_${cat.id}`;
        let learnedCount = 0;
        try {
          const saved = await AsyncStorage.getItem(key);
          if (saved) {
            const learnedIds = JSON.parse(saved) as string[];
            learnedCount = learnedIds.length;
            totalLearned += learnedCount;
            if (learnedCount > maxCatWords) {
              maxCatWords = learnedCount;
              topCat = cat.id;
            }
          }
        } catch {}

        // Get total words for this category
        const words = getWordsByCategory(cat.id, learningLang, nativeLang, userLevel);
        catStatsArray.push({
          id: cat.id,
          words: learnedCount,
          total: words.length,
          color: cat.color,
          icon: cat.icon,
        });
      }

      // Filter to only show categories with words
      const filteredCatStats = catStatsArray.filter(c => c.total > 0);
      setCategoryStats(filteredCatStats);

      // Load weekly progress (language-specific)
      const weeklyKey = `weekly_progress_${learningLang}`;
      let weeklyProgressData = WEEKLY_DATA_BASE.map(day => ({ ...day, goal: dailyGoal }));
      let weeklyTotal = 0;
      try {
        const savedWeekly = await AsyncStorage.getItem(weeklyKey);
        if (savedWeekly) {
          const parsed = JSON.parse(savedWeekly);
          weeklyProgressData = parsed.map((day: any, index: number) => ({
            ...WEEKLY_DATA_BASE[index],
            words: day.words || 0,
            goal: dailyGoal,
          }));
          weeklyTotal = weeklyProgressData.reduce((sum: number, day: any) => sum + day.words, 0);
        }
      } catch {}
      setWeeklyData(weeklyProgressData);

      // Load streak (language-specific)
      const streakKey = `streak_${learningLang}`;
      let streak = 0;
      try {
        const savedStreak = await AsyncStorage.getItem(streakKey);
        if (savedStreak) {
          streak = parseInt(savedStreak, 10) || 0;
        }
      } catch {}

      // Load total time (language-specific)
      const timeKey = `total_time_${learningLang}`;
      let totalTime = 0;
      try {
        const savedTime = await AsyncStorage.getItem(timeKey);
        if (savedTime) {
          totalTime = parseFloat(savedTime) || 0;
        }
      } catch {}

      // Calculate weekly average
      const weeklyAverage = weeklyTotal > 0 ? Math.round((weeklyTotal / 7) * 10) / 10 : 0;

      setStats({
        totalWords: totalLearned,
        weeklyWords: weeklyTotal,
        streak,
        weeklyAverage,
        totalTime,
        weeklyTime: Math.round(totalTime * 10) / 10,
        topCategory: topCat,
      });
    } catch (error) {
      console.log('Error loading stats:', error);
    }
  }, [learningLang, nativeLang, userLevel, dailyGoal]);

  // Load stats when language changes
  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const maxWords = Math.max(...weeklyData.map(d => d.words), 1);

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

  // Animate bars when weekly data changes
  useEffect(() => {
    const barAnimations = barAnims.map((anim, index) =>
      Animated.timing(anim, {
        toValue: weeklyData[index]?.words ? weeklyData[index].words / maxWords : 0,
        duration: 600,
        delay: index * 100,
        useNativeDriver: false,
      })
    );
    Animated.stagger(50, barAnimations).start();
  }, [weeklyData, maxWords]);

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
            <Text style={styles.headerTitle}>{i18n.t('stats.title')}</Text>
            <Text style={styles.headerSubtitle}>{i18n.t('stats.subtitle')}</Text>
          </View>

          {/* Overview Cards */}
          <View style={styles.overviewGrid}>
            <View style={[styles.overviewCard, styles.overviewCardLarge]}>
              <View style={[styles.overviewIcon, { backgroundColor: 'rgba(78, 205, 196, 0.2)' }]}>
                <Ionicons name="book" size={28} color="#4ECDC4" />
              </View>
              <Text style={styles.overviewNumber}>{stats.totalWords}</Text>
              <Text style={styles.overviewLabel}>{i18n.t('stats.totalWords')}</Text>
            </View>

            <View style={[styles.overviewCard, styles.overviewCardLarge]}>
              <View style={[styles.overviewIcon, { backgroundColor: 'rgba(201, 162, 39, 0.2)' }]}>
                <Ionicons name="calendar" size={28} color={colors.brand.gold} />
              </View>
              <Text style={styles.overviewNumber}>{stats.weeklyWords}</Text>
              <Text style={styles.overviewLabel}>{i18n.t('home.weeklyWords')}</Text>
            </View>

            <View style={[styles.overviewCard, styles.overviewCardLarge]}>
              <View style={[styles.overviewIcon, { backgroundColor: 'rgba(255, 107, 107, 0.2)' }]}>
                <Ionicons name="flame" size={28} color="#FF6B6B" />
              </View>
              <Text style={styles.overviewNumber}>{stats.streak}</Text>
              <Text style={styles.overviewLabel}>{i18n.t('stats.currentStreak')}</Text>
            </View>
          </View>

          {/* Weekly Progress */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{i18n.t('stats.weeklyProgress')}</Text>
            <View style={styles.chartCard}>
              <View style={styles.chartContainer}>
                {/* Goal Line */}
                <View style={styles.goalLine}>
                  <View style={styles.goalLineDash} />
                  <Text style={styles.goalLineText}>{dailyGoal}</Text>
                </View>
                {weeklyData.map((day, index) => {
                  const barHeight = barAnims[index].interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 120],
                  });
                  const isGoalMet = day.words >= day.goal;
                  const isToday = index === new Date().getDay() - 1 || (new Date().getDay() === 0 && index === 6);

                  return (
                    <View key={day.day} style={styles.barColumn}>
                      <Text style={[styles.barValueTop, isGoalMet && styles.barValueTopGold]}>{day.words}</Text>
                      <View style={[styles.barWrapper, isToday && styles.barWrapperToday]}>
                        <View style={styles.barBackground} />
                        <Animated.View
                          style={[
                            styles.bar,
                            {
                              height: barHeight,
                              backgroundColor: isGoalMet ? colors.brand.gold : 'rgba(255, 255, 255, 0.3)',
                            },
                          ]}
                        />
                      </View>
                      <Text style={[styles.barLabel, isToday && styles.barLabelToday]}>{i18n.t(`stats.days.${day.day}`)}</Text>
                    </View>
                  );
                })}
              </View>
              <View style={styles.chartLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: colors.brand.gold }]} />
                  <Text style={styles.legendText}>{i18n.t('stats.goalMet')}</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: 'rgba(255, 255, 255, 0.3)' }]} />
                  <Text style={styles.legendText}>{i18n.t('stats.goalNotMet')}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Additional Stats */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{i18n.t('stats.moreStats')}</Text>
            <View style={styles.additionalStatsCard}>
              <View style={styles.additionalStatRow}>
                <View style={styles.additionalStatItem}>
                  <Ionicons name="trending-up-outline" size={20} color={colors.brand.gold} />
                  <View style={styles.additionalStatInfo}>
                    <Text style={styles.additionalStatValue}>{stats.weeklyAverage}</Text>
                    <Text style={styles.additionalStatLabel}>{i18n.t('stats.weeklyAverage')}</Text>
                  </View>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.additionalStatItem}>
                  <Ionicons name="time-outline" size={20} color={colors.brand.gold} />
                  <View style={styles.additionalStatInfo}>
                    <Text style={styles.additionalStatValue}>{stats.totalTime}h</Text>
                    <Text style={styles.additionalStatLabel}>{i18n.t('stats.totalTime')}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.additionalStatDividerH} />
              <View style={styles.additionalStatRow}>
                <View style={styles.additionalStatItem}>
                  <Ionicons name="hourglass-outline" size={20} color={colors.brand.gold} />
                  <View style={styles.additionalStatInfo}>
                    <Text style={styles.additionalStatValue}>{stats.weeklyTime}h</Text>
                    <Text style={styles.additionalStatLabel}>{i18n.t('stats.weeklyTime')}</Text>
                  </View>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.additionalStatItem}>
                  <Ionicons name="trophy-outline" size={20} color={colors.brand.gold} />
                  <View style={styles.additionalStatInfo}>
                    <Text style={styles.additionalStatValue}>{i18n.t(`explore.categoryNames.${stats.topCategory}`)}</Text>
                    <Text style={styles.additionalStatLabel}>{i18n.t('stats.topCategory')}</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Category Progress */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{i18n.t('stats.categoryProgress')}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryScrollContainer}
            >
              {categoryStats.map((category) => {
                const progress = category.total > 0 ? Math.round((category.words / category.total) * 100) : 0;
                return (
                  <View key={category.id} style={styles.categoryCard}>
                    <View style={[styles.categoryIconContainer, { backgroundColor: `${category.color}20` }]}>
                      <Ionicons name={category.icon as any} size={24} color={category.color} />
                    </View>
                    <Text style={styles.categoryName}>
                      {i18n.t(`topicSelect.topics.${category.id}`)}
                    </Text>
                    <View style={[styles.progressRing, { borderColor: category.color }]}>
                      <Text style={[styles.categoryPercent, { color: category.color }]}>{progress}%</Text>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>

        </Animated.View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} activeOpacity={0.7} onPress={() => router.push('/home')}>
          <Ionicons name="home-outline" size={24} color={colors.text.muted} />
          <Text style={styles.navLabel}>{i18n.t('home.nav.home')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} activeOpacity={0.7} onPress={() => router.push('/explore')}>
          <Ionicons name="search-outline" size={24} color={colors.text.muted} />
          <Text style={styles.navLabel}>{i18n.t('home.nav.explore')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} activeOpacity={0.7}>
          <Ionicons name="stats-chart" size={24} color={colors.brand.gold} />
          <Text style={[styles.navLabel, styles.navLabelActive]}>{i18n.t('home.nav.stats')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} activeOpacity={0.7} onPress={() => router.push('/settings')}>
          <Ionicons name="settings-outline" size={24} color={colors.text.muted} />
          <Text style={styles.navLabel}>{i18n.t('home.nav.settings')}</Text>
        </TouchableOpacity>
      </View>
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
    paddingBottom: 100,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  header: {
    paddingTop: layout.headerPaddingTop,
    paddingBottom: spacing.lg,
  },
  headerTitle: {
    fontFamily: fonts.heading,
    fontSize: fontSize.xxl,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontFamily: fonts.body,
    fontSize: fontSize.md,
    color: colors.text.secondary,
  },
  overviewGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  overviewCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.primary,
    alignItems: 'center',
  },
  overviewCardLarge: {
    paddingVertical: spacing.lg,
  },
  overviewIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  overviewNumber: {
    fontFamily: fonts.heading,
    fontSize: fontSize.xxl,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  overviewLabel: {
    fontFamily: fonts.body,
    fontSize: fontSize.xs,
    color: colors.text.muted,
    textAlign: 'center',
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  chartCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 180,
    marginBottom: spacing.md,
    position: 'relative',
  },
  goalLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 100,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  goalLineDash: {
    flex: 1,
    height: 1,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 39, 0.5)',
  },
  goalLineText: {
    fontFamily: fonts.medium,
    fontSize: 10,
    color: colors.brand.gold,
    marginLeft: spacing.xs,
    backgroundColor: 'rgba(11, 13, 16, 0.9)',
    paddingHorizontal: 4,
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
  },
  barValueTop: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.xs,
    color: colors.text.muted,
    marginBottom: spacing.xs,
  },
  barValueTopGold: {
    color: colors.brand.gold,
  },
  barWrapper: {
    height: 120,
    width: 28,
    justifyContent: 'flex-end',
    alignItems: 'center',
    position: 'relative',
    borderRadius: 14,
  },
  barWrapperToday: {
    borderWidth: 2,
    borderColor: colors.brand.gold,
    borderStyle: 'solid',
  },
  barBackground: {
    position: 'absolute',
    bottom: 0,
    width: 24,
    height: 116,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
  },
  bar: {
    width: 24,
    borderRadius: 12,
  },
  barLabel: {
    fontFamily: fonts.medium,
    fontSize: fontSize.xs,
    color: colors.text.muted,
    marginTop: spacing.sm,
    textTransform: 'uppercase',
  },
  barLabelToday: {
    color: colors.brand.gold,
    fontFamily: fonts.semiBold,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.primary,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontFamily: fonts.body,
    fontSize: fontSize.xs,
    color: colors.text.muted,
  },
  additionalStatsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  additionalStatRow: {
    flexDirection: 'row',
  },
  additionalStatItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  additionalStatInfo: {
    flex: 1,
  },
  additionalStatValue: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
    color: colors.text.primary,
  },
  additionalStatLabel: {
    fontFamily: fonts.body,
    fontSize: fontSize.xs,
    color: colors.text.muted,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border.primary,
    marginHorizontal: spacing.md,
  },
  additionalStatDividerH: {
    height: 1,
    backgroundColor: colors.border.primary,
    marginVertical: spacing.md,
  },
  categoryScrollContainer: {
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  categoryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.primary,
    alignItems: 'center',
    width: 140,
    marginRight: spacing.md,
  },
  categoryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  categoryName: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  progressRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryPercent: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: 'rgba(11, 13, 16, 0.95)',
    borderTopWidth: 1,
    borderTopColor: colors.border.primary,
    paddingVertical: spacing.sm,
    paddingBottom: 30,
    paddingHorizontal: spacing.lg,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  navLabel: {
    fontFamily: fonts.medium,
    fontSize: fontSize.xs,
    color: colors.text.muted,
    marginTop: spacing.xs,
  },
  navLabelActive: {
    color: colors.brand.gold,
  },
});
