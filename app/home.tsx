import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../src/i18n';
import { useLanguage } from '../src/context/LanguageContext';
import { useUser } from '../src/context/UserContext';
import { colors, fontSize, spacing, borderRadius, fonts, layout } from '../src/constants/theme';

const ALL_CATEGORY_IDS = [
  'everyday_objects', 'food_drink', 'people_roles', 'actions',
  'adjectives', 'emotions', 'nature_animals', 'travel', 'sports_hobbies'
];

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const { locale } = useLanguage(); // For re-render on language change
  const { preferences } = useUser(); // Get user preferences
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const streakPulse = useRef(new Animated.Value(1)).current;

  // Get language code from user preferences
  const learningLang = preferences.learningLanguage?.code || 'en';

  // State for language-specific stats
  const [userData, setUserData] = useState({
    name: i18n.t('home.guest'),
    streak: 0,
    todayWords: 0,
    dailyGoal: preferences.dailyGoal || 10,
    learnedWords: 0,
    weeklyWords: 0,
    knownWords: 0,
    level: preferences.level || 'intermediate',
  });

  // Load stats from AsyncStorage (language-specific)
  const loadStats = useCallback(async () => {
    try {
      // Load total learned words across all categories for this language
      let totalLearned = 0;
      let totalKnown = 0;
      for (const catId of ALL_CATEGORY_IDS) {
        const key = `learned_${learningLang}_${catId}`;
        try {
          const saved = await AsyncStorage.getItem(key);
          if (saved) {
            const learnedIds = JSON.parse(saved) as string[];
            totalLearned += learnedIds.length;
          }
        } catch {}

        // Load known words (marked with "I know this")
        const knownKey = `known_words_${learningLang}_${catId}`;
        try {
          const savedKnown = await AsyncStorage.getItem(knownKey);
          if (savedKnown) {
            const knownIds = JSON.parse(savedKnown) as string[];
            totalKnown += knownIds.length;
          }
        } catch {}
      }

      // Load streak (language-specific)
      const streakKey = `streak_${learningLang}`;
      let streak = 0;
      try {
        const savedStreak = await AsyncStorage.getItem(streakKey);
        if (savedStreak) {
          streak = parseInt(savedStreak, 10) || 0;
        }
      } catch {}

      // Load today's progress (language-specific)
      const today = new Date().toISOString().split('T')[0];
      const todayKey = `today_words_${learningLang}_${today}`;
      let todayWords = 0;
      try {
        const savedToday = await AsyncStorage.getItem(todayKey);
        if (savedToday) {
          todayWords = parseInt(savedToday, 10) || 0;
        }
      } catch {}

      // Load weekly progress (language-specific)
      const weeklyKey = `weekly_progress_${learningLang}`;
      let weeklyWords = 0;
      try {
        const savedWeekly = await AsyncStorage.getItem(weeklyKey);
        if (savedWeekly) {
          const parsed = JSON.parse(savedWeekly);
          weeklyWords = parsed.reduce((sum: number, day: any) => sum + (day.words || 0), 0);
        }
      } catch {}

      setUserData({
        name: i18n.t('home.guest'),
        streak,
        todayWords,
        dailyGoal: preferences.dailyGoal || 10,
        learnedWords: totalLearned,
        weeklyWords,
        knownWords: totalKnown,
        level: preferences.level || 'intermediate',
      });
    } catch (error) {
      console.log('Error loading home stats:', error);
    }
  }, [learningLang, preferences.dailyGoal, preferences.level, locale]);

  // Load stats when language changes
  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const progressPercent = userData.dailyGoal > 0 ? (userData.todayWords / userData.dailyGoal) * 100 : 0;

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

  // Animate progress bar when data changes
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progressPercent,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [progressPercent]);

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
      <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
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
                  <Ionicons name="flame" size={24} color={colors.brand.gold} />
                </View>
                <View style={styles.streakInfo}>
                  <Text style={styles.streakNumber}>{userData.streak}</Text>
                  <Text style={styles.streakLabel}>{i18n.t('home.streak')}</Text>
                </View>
              </View>
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

            <TouchableOpacity
              style={[styles.reviewButton, userData.learnedWords === 0 && styles.reviewButtonDisabled]}
              activeOpacity={0.7}
              onPress={() => userData.learnedWords > 0 && router.push('/learn?review=true')}
              disabled={userData.learnedWords === 0}
            >
              <View style={[styles.secondaryIconContainer, userData.learnedWords === 0 && styles.secondaryIconContainerDisabled]}>
                <Ionicons name="refresh-outline" size={24} color={userData.learnedWords === 0 ? colors.text.muted : colors.brand.gold} />
              </View>
              <Text style={[styles.secondaryButtonText, userData.learnedWords === 0 && styles.secondaryButtonTextDisabled]}>
                {i18n.t('home.review')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Statistics Section */}
          <View style={styles.statsSection}>
            <View style={styles.statsCard}>
              <View style={styles.statItem}>
                <View style={styles.progressRing}>
                  <View style={styles.progressRingInner}>
                    <Text style={styles.ringNumber}>{userData.learnedWords}</Text>
                  </View>
                </View>
                <Text style={styles.ringLabel}>{i18n.t('home.learnedWords')}</Text>
              </View>

              <View style={styles.statItem}>
                <View style={[styles.progressRing, styles.progressRingKnown]}>
                  <View style={[styles.progressRingInner, styles.progressRingInnerKnown]}>
                    <Text style={styles.ringNumber}>{userData.knownWords}</Text>
                  </View>
                </View>
                <Text style={styles.ringLabel}>{i18n.t('home.knownWords')}</Text>
              </View>

              <View style={styles.statItem}>
                <View style={styles.progressRing}>
                  <View style={styles.progressRingInner}>
                    <Text style={styles.ringNumber}>{userData.weeklyWords}</Text>
                  </View>
                </View>
                <Text style={styles.ringLabel}>{i18n.t('home.weeklyWords')}</Text>
              </View>
            </View>
          </View>

          </ScrollView>
        </Animated.View>

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
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 100, // Space for bottom navigation
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: layout.headerPaddingTop,
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
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  streakGradient: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 39, 0.3)',
  },
  streakContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(201, 162, 39, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  streakInfo: {
    flex: 1,
  },
  streakNumber: {
    fontFamily: fonts.heading,
    fontSize: 28,
    color: colors.brand.gold,
    lineHeight: 32,
  },
  streakLabel: {
    fontFamily: fonts.medium,
    fontSize: fontSize.xs,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
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
  reviewButton: {
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
  reviewButtonDisabled: {
    opacity: 0.5,
  },
  secondaryIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(201, 162, 39, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryIconContainerDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  secondaryButtonText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: colors.text.primary,
  },
  secondaryButtonTextDisabled: {
    color: colors.text.muted,
  },
  statsSection: {
    marginBottom: spacing.lg,
  },
  statsCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  statItem: {
    alignItems: 'center',
  },
  progressRing: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 4,
    borderColor: colors.brand.gold,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  progressRingAccuracy: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 4,
    borderColor: colors.brand.gold,
    borderLeftColor: 'rgba(201, 162, 39, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  progressRingInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(201, 162, 39, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressRingKnown: {
    borderColor: '#4ECDC4',
  },
  progressRingInnerKnown: {
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
  },
  ringNumber: {
    fontFamily: fonts.heading,
    fontSize: fontSize.lg,
    color: colors.text.primary,
  },
  ringLabel: {
    fontFamily: fonts.body,
    fontSize: fontSize.xs,
    color: colors.text.muted,
    textAlign: 'center',
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
