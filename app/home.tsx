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
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import i18n from '../src/i18n';
import { colors, fontSize, spacing, borderRadius, fonts } from '../src/constants/theme';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const streakPulse = useRef(new Animated.Value(1)).current;

  // Mock data - later this will come from user state
  const [userData] = useState({
    name: 'User',
    streak: 7,
    todayWords: 3,
    dailyGoal: 10,
    totalWords: 156,
    level: 'intermediate',
  });

  const progressPercent = (userData.todayWords / userData.dailyGoal) * 100;

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

    // Animate progress bar
    Animated.timing(progressAnim, {
      toValue: progressPercent,
      duration: 1000,
      delay: 300,
      useNativeDriver: false,
    }).start();

    // Streak pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(streakPulse, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(streakPulse, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

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
            <View style={styles.headerLeft}>
              <Text style={styles.greeting}>{i18n.t('home.greeting')}</Text>
              <Text style={styles.userName}>{userData.name}</Text>
            </View>
            <TouchableOpacity style={styles.profileButton} activeOpacity={0.7} onPress={() => router.push('/profile')}>
              <Ionicons name="person-outline" size={22} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          {/* Streak Card */}
          <Animated.View style={[styles.streakCard, { transform: [{ scale: streakPulse }] }]}>
            <LinearGradient
              colors={['rgba(201, 162, 39, 0.2)', 'rgba(201, 162, 39, 0.05)']}
              style={styles.streakGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.streakContent}>
                <View style={styles.streakIconContainer}>
                  <Ionicons name="flame" size={32} color={colors.brand.gold} />
                </View>
                <View style={styles.streakInfo}>
                  <Text style={styles.streakNumber}>{userData.streak}</Text>
                  <Text style={styles.streakLabel}>{i18n.t('home.streak')}</Text>
                </View>
              </View>
              <Text style={styles.streakMessage}>{i18n.t('home.streakMessage')}</Text>
            </LinearGradient>
          </Animated.View>

          {/* Daily Progress Card */}
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>{i18n.t('home.todayProgress')}</Text>
              <Text style={styles.progressCount}>
                {userData.todayWords}/{userData.dailyGoal} {i18n.t('home.words')}
              </Text>
            </View>
            <View style={styles.progressBarContainer}>
              <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
            </View>
            <Text style={styles.progressHint}>
              {userData.dailyGoal - userData.todayWords > 0
                ? i18n.t('home.wordsLeft', { count: userData.dailyGoal - userData.todayWords })
                : i18n.t('home.goalComplete')}
            </Text>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.mainActionButton} activeOpacity={0.8} onPress={() => router.push('/learn')}>
              <LinearGradient
                colors={[colors.brand.gold, colors.brand.goldSoft]}
                style={styles.mainActionGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="play" size={28} color={colors.background.primary} />
                <Text style={styles.mainActionText}>{i18n.t('home.startLearning')}</Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.secondaryActions}>
              <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.7} onPress={() => router.push('/learn')}>
                <View style={styles.secondaryIconContainer}>
                  <Ionicons name="refresh-outline" size={24} color={colors.brand.gold} />
                </View>
                <Text style={styles.secondaryButtonText}>{i18n.t('home.review')}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.7} onPress={() => router.push('/learn')}>
                <View style={styles.secondaryIconContainer}>
                  <Ionicons name="flash-outline" size={24} color={colors.brand.gold} />
                </View>
                <Text style={styles.secondaryButtonText}>{i18n.t('home.quickPractice')}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Statistics Section */}
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>{i18n.t('home.statistics')}</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="book-outline" size={22} color={colors.brand.gold} />
                </View>
                <Text style={styles.statNumber}>{userData.totalWords}</Text>
                <Text style={styles.statLabel}>{i18n.t('home.totalWords')}</Text>
              </View>

              <View style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="trending-up-outline" size={22} color={colors.brand.gold} />
                </View>
                <Text style={styles.statNumber}>{i18n.t(`home.levels.${userData.level}`)}</Text>
                <Text style={styles.statLabel}>{i18n.t('home.level')}</Text>
              </View>

              <View style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="calendar-outline" size={22} color={colors.brand.gold} />
                </View>
                <Text style={styles.statNumber}>{userData.streak}</Text>
                <Text style={styles.statLabel}>{i18n.t('home.daysActive')}</Text>
              </View>

              <View style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="star-outline" size={22} color={colors.brand.gold} />
                </View>
                <Text style={styles.statNumber}>85%</Text>
                <Text style={styles.statLabel}>{i18n.t('home.accuracy')}</Text>
              </View>
            </View>
          </View>

          {/* Continue Learning Section */}
          <View style={styles.continueSection}>
            <Text style={styles.sectionTitle}>{i18n.t('home.continueLearning')}</Text>
            <TouchableOpacity style={styles.lessonCard} activeOpacity={0.7} onPress={() => router.push('/learn')}>
              <View style={styles.lessonIcon}>
                <Ionicons name="airplane-outline" size={24} color={colors.brand.gold} />
              </View>
              <View style={styles.lessonInfo}>
                <Text style={styles.lessonTitle}>{i18n.t('home.lastTopic')}</Text>
                <Text style={styles.lessonProgress}>12/20 {i18n.t('home.words')}</Text>
              </View>
              <View style={styles.lessonArrow}>
                <Ionicons name="chevron-forward" size={20} color={colors.text.muted} />
              </View>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} activeOpacity={0.7}>
          <Ionicons name="home" size={24} color={colors.brand.gold} />
          <Text style={[styles.navLabel, styles.navLabelActive]}>{i18n.t('home.nav.home')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} activeOpacity={0.7} onPress={() => router.push('/explore')}>
          <Ionicons name="search-outline" size={24} color={colors.text.muted} />
          <Text style={styles.navLabel}>{i18n.t('home.nav.explore')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} activeOpacity={0.7} onPress={() => router.push('/stats')}>
          <Ionicons name="stats-chart-outline" size={24} color={colors.text.muted} />
          <Text style={styles.navLabel}>{i18n.t('home.nav.stats')}</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: spacing.lg,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontFamily: fonts.body,
    fontSize: fontSize.md,
    color: colors.text.secondary,
  },
  userName: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.xl,
    color: colors.text.primary,
    marginTop: spacing.xs,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  streakCard: {
    marginBottom: spacing.lg,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  streakGradient: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 39, 0.3)',
  },
  streakContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  streakIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(201, 162, 39, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  streakInfo: {
    flex: 1,
  },
  streakNumber: {
    fontFamily: fonts.heading,
    fontSize: 36,
    color: colors.brand.gold,
  },
  streakLabel: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  streakMessage: {
    fontFamily: fonts.italic,
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
  progressCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  progressTitle: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: colors.text.primary,
  },
  progressCount: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: colors.brand.gold,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.brand.gold,
    borderRadius: 4,
  },
  progressHint: {
    fontFamily: fonts.body,
    fontSize: fontSize.xs,
    color: colors.text.muted,
  },
  quickActions: {
    marginBottom: spacing.xl,
  },
  mainActionButton: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  mainActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  mainActionText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
    color: colors.background.primary,
    letterSpacing: 0.5,
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.primary,
    gap: spacing.sm,
  },
  secondaryIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(201, 162, 39, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: colors.text.primary,
  },
  statsSection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  statCard: {
    width: (width - spacing.lg * 2 - spacing.md) / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.primary,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(201, 162, 39, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statNumber: {
    fontFamily: fonts.heading,
    fontSize: fontSize.xl,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontFamily: fonts.body,
    fontSize: fontSize.xs,
    color: colors.text.muted,
    textAlign: 'center',
  },
  continueSection: {
    marginBottom: spacing.lg,
  },
  lessonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  lessonIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(201, 162, 39, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  lessonInfo: {
    flex: 1,
  },
  lessonTitle: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  lessonProgress: {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    color: colors.text.muted,
  },
  lessonArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
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
