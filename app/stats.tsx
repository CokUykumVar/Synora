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
import i18n from '../src/i18n';
import { colors, fontSize, spacing, borderRadius, fonts } from '../src/constants/theme';

const { width } = Dimensions.get('window');

const WEEKLY_DATA = [
  { day: 'mon', words: 12, goal: 10 },
  { day: 'tue', words: 8, goal: 10 },
  { day: 'wed', words: 15, goal: 10 },
  { day: 'thu', words: 10, goal: 10 },
  { day: 'fri', words: 6, goal: 10 },
  { day: 'sat', words: 14, goal: 10 },
  { day: 'sun', words: 9, goal: 10 },
];

const CATEGORY_STATS = [
  { id: 'travel', words: 45, total: 150, color: '#4ECDC4' },
  { id: 'business', words: 32, total: 200, color: '#FF6B6B' },
  { id: 'technology', words: 28, total: 180, color: '#45B7D1' },
  { id: 'food', words: 51, total: 120, color: '#96CEB4' },
];

const ACHIEVEMENTS = [
  { id: 'first_word', icon: 'star', unlocked: true },
  { id: 'week_streak', icon: 'flame', unlocked: true },
  { id: 'hundred_words', icon: 'trophy', unlocked: true },
  { id: 'perfect_day', icon: 'checkmark-circle', unlocked: false },
  { id: 'month_streak', icon: 'medal', unlocked: false },
  { id: 'five_hundred', icon: 'ribbon', unlocked: false },
];

export default function StatsScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const barAnims = useRef(WEEKLY_DATA.map(() => new Animated.Value(0))).current;

  const [stats] = useState({
    totalWords: 156,
    streak: 7,
    accuracy: 85,
    todayWords: 9,
    weeklyAverage: 10.6,
    totalTime: 12.5,
    bestStreak: 14,
    perfectDays: 4,
  });

  const maxWords = Math.max(...WEEKLY_DATA.map(d => d.words));

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

    // Animate bars sequentially
    const barAnimations = barAnims.map((anim, index) =>
      Animated.timing(anim, {
        toValue: WEEKLY_DATA[index].words / maxWords,
        duration: 600,
        delay: index * 100,
        useNativeDriver: false,
      })
    );
    Animated.stagger(50, barAnimations).start();
  }, []);

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
            <View style={styles.overviewCard}>
              <View style={[styles.overviewIcon, { backgroundColor: 'rgba(78, 205, 196, 0.2)' }]}>
                <Ionicons name="book" size={24} color="#4ECDC4" />
              </View>
              <Text style={styles.overviewNumber}>{stats.totalWords}</Text>
              <Text style={styles.overviewLabel}>{i18n.t('stats.totalWords')}</Text>
            </View>

            <View style={styles.overviewCard}>
              <View style={[styles.overviewIcon, { backgroundColor: 'rgba(255, 107, 107, 0.2)' }]}>
                <Ionicons name="flame" size={24} color="#FF6B6B" />
              </View>
              <Text style={styles.overviewNumber}>{stats.streak}</Text>
              <Text style={styles.overviewLabel}>{i18n.t('stats.currentStreak')}</Text>
            </View>

            <View style={styles.overviewCard}>
              <View style={[styles.overviewIcon, { backgroundColor: 'rgba(69, 183, 209, 0.2)' }]}>
                <Ionicons name="checkmark-done" size={24} color="#45B7D1" />
              </View>
              <Text style={styles.overviewNumber}>{stats.accuracy}%</Text>
              <Text style={styles.overviewLabel}>{i18n.t('stats.accuracy')}</Text>
            </View>

            <View style={styles.overviewCard}>
              <View style={[styles.overviewIcon, { backgroundColor: 'rgba(201, 162, 39, 0.2)' }]}>
                <Ionicons name="today" size={24} color={colors.brand.gold} />
              </View>
              <Text style={styles.overviewNumber}>{stats.todayWords}</Text>
              <Text style={styles.overviewLabel}>{i18n.t('stats.todayWords')}</Text>
            </View>
          </View>

          {/* Weekly Progress */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{i18n.t('stats.weeklyProgress')}</Text>
            <View style={styles.chartCard}>
              <View style={styles.chartContainer}>
                {WEEKLY_DATA.map((day, index) => {
                  const barHeight = barAnims[index].interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 120],
                  });
                  const isGoalMet = day.words >= day.goal;

                  return (
                    <View key={day.day} style={styles.barColumn}>
                      <View style={styles.barWrapper}>
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
                        {isGoalMet && (
                          <View style={styles.goalIndicator}>
                            <Ionicons name="checkmark" size={12} color={colors.background.primary} />
                          </View>
                        )}
                      </View>
                      <Text style={styles.barLabel}>{i18n.t(`stats.days.${day.day}`)}</Text>
                      <Text style={styles.barValue}>{day.words}</Text>
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
                  <Ionicons name="trophy-outline" size={20} color={colors.brand.gold} />
                  <View style={styles.additionalStatInfo}>
                    <Text style={styles.additionalStatValue}>{stats.bestStreak}</Text>
                    <Text style={styles.additionalStatLabel}>{i18n.t('stats.bestStreak')}</Text>
                  </View>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.additionalStatItem}>
                  <Ionicons name="star-outline" size={20} color={colors.brand.gold} />
                  <View style={styles.additionalStatInfo}>
                    <Text style={styles.additionalStatValue}>{stats.perfectDays}</Text>
                    <Text style={styles.additionalStatLabel}>{i18n.t('stats.perfectDays')}</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Category Progress */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{i18n.t('stats.categoryProgress')}</Text>
            {CATEGORY_STATS.map((category) => {
              const progress = (category.words / category.total) * 100;
              return (
                <View key={category.id} style={styles.categoryRow}>
                  <View style={styles.categoryInfo}>
                    <Text style={styles.categoryName}>
                      {i18n.t(`topicSelect.topics.${category.id}`)}
                    </Text>
                    <Text style={styles.categoryCount}>
                      {category.words}/{category.total} {i18n.t('stats.words')}
                    </Text>
                  </View>
                  <View style={styles.categoryProgressContainer}>
                    <View style={styles.categoryProgressBg}>
                      <View
                        style={[
                          styles.categoryProgress,
                          { width: `${progress}%`, backgroundColor: category.color },
                        ]}
                      />
                    </View>
                    <Text style={[styles.categoryPercent, { color: category.color }]}>
                      {Math.round(progress)}%
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Achievements */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{i18n.t('stats.achievements')}</Text>
            <View style={styles.achievementsGrid}>
              {ACHIEVEMENTS.map((achievement) => (
                <View
                  key={achievement.id}
                  style={[
                    styles.achievementItem,
                    !achievement.unlocked && styles.achievementLocked,
                  ]}
                >
                  <View
                    style={[
                      styles.achievementIcon,
                      achievement.unlocked
                        ? styles.achievementIconUnlocked
                        : styles.achievementIconLocked,
                    ]}
                  >
                    <Ionicons
                      name={achievement.icon as any}
                      size={24}
                      color={achievement.unlocked ? colors.brand.gold : colors.text.muted}
                    />
                  </View>
                  <Text
                    style={[
                      styles.achievementName,
                      !achievement.unlocked && styles.achievementNameLocked,
                    ]}
                  >
                    {i18n.t(`stats.achievementNames.${achievement.id}`)}
                  </Text>
                </View>
              ))}
            </View>
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
    paddingTop: 60,
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
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  overviewCard: {
    width: (width - spacing.lg * 2 - spacing.md) / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.primary,
    alignItems: 'center',
  },
  overviewIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  overviewNumber: {
    fontFamily: fonts.heading,
    fontSize: fontSize.xl,
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
    height: 160,
    marginBottom: spacing.md,
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
  },
  barWrapper: {
    height: 120,
    width: 24,
    justifyContent: 'flex-end',
    alignItems: 'center',
    position: 'relative',
  },
  barBackground: {
    position: 'absolute',
    bottom: 0,
    width: 24,
    height: 120,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
  },
  bar: {
    width: 24,
    borderRadius: 12,
  },
  goalIndicator: {
    position: 'absolute',
    top: -8,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.brand.gold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  barLabel: {
    fontFamily: fonts.medium,
    fontSize: fontSize.xs,
    color: colors.text.muted,
    marginTop: spacing.sm,
    textTransform: 'uppercase',
  },
  barValue: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.xs,
    color: colors.text.secondary,
    marginTop: 2,
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
  categoryRow: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  categoryInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  categoryName: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text.primary,
  },
  categoryCount: {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    color: colors.text.muted,
  },
  categoryProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  categoryProgressBg: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  categoryProgress: {
    height: '100%',
    borderRadius: 4,
  },
  categoryPercent: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.sm,
    width: 45,
    textAlign: 'right',
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  achievementItem: {
    width: (width - spacing.lg * 2 - spacing.md * 2) / 3,
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  achievementLocked: {
    opacity: 0.5,
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  achievementIconUnlocked: {
    backgroundColor: 'rgba(201, 162, 39, 0.2)',
  },
  achievementIconLocked: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  achievementName: {
    fontFamily: fonts.medium,
    fontSize: fontSize.xs,
    color: colors.text.primary,
    textAlign: 'center',
  },
  achievementNameLocked: {
    color: colors.text.muted,
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
