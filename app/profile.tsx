import { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../src/i18n';
import { useLanguage } from '../src/context/LanguageContext';
import { useUser } from '../src/context/UserContext';
import { colors, fontSize, spacing, borderRadius, fonts, layout } from '../src/constants/theme';

const ALL_CATEGORY_IDS = [
  'travel', 'food', 'business', 'technology', 'health', 'sports',
  'music', 'entertainment', 'nature', 'shopping', 'family', 'education',
  'verbs', 'adjectives', 'emotions'
];

export default function ProfileScreen() {
  const router = useRouter();
  const { locale } = useLanguage(); // For re-render on language change
  const { preferences } = useUser(); // Get user preferences from onboarding
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const [isEditing, setIsEditing] = useState(false);
  const [userName, setUserName] = useState('User');
  const [userEmail] = useState('user@example.com');
  const [joinDate] = useState('2024-01-15');

  const [editedName, setEditedName] = useState(userName);

  // Get language info from preferences
  const nativeLanguage = preferences.nativeLanguage?.name || i18n.t('home.guest');
  const learningLanguage = preferences.learningLanguage?.name || 'English';
  const learningLang = preferences.learningLanguage?.code || 'en';
  const level = preferences.level || 'intermediate';
  const dailyGoal = preferences.dailyGoal || 10;

  const [stats, setStats] = useState({
    totalWords: 0,
    daysActive: 0,
    currentStreak: 0,
    bestStreak: 0,
    totalTime: 0,
    accuracy: 0,
  });

  // Load stats from AsyncStorage (language-specific)
  const loadStats = useCallback(async () => {
    try {
      // Load total learned words across all categories for this language
      let totalLearned = 0;
      for (const catId of ALL_CATEGORY_IDS) {
        const key = `learned_${learningLang}_${catId}`;
        try {
          const saved = await AsyncStorage.getItem(key);
          if (saved) {
            const learnedIds = JSON.parse(saved) as string[];
            totalLearned += learnedIds.length;
          }
        } catch {}
      }

      // Load streak (language-specific)
      const streakKey = `streak_${learningLang}`;
      let currentStreak = 0;
      try {
        const savedStreak = await AsyncStorage.getItem(streakKey);
        if (savedStreak) currentStreak = parseInt(savedStreak, 10) || 0;
      } catch {}

      // Load best streak (language-specific)
      const bestStreakKey = `best_streak_${learningLang}`;
      let bestStreak = currentStreak;
      try {
        const savedBest = await AsyncStorage.getItem(bestStreakKey);
        if (savedBest) bestStreak = Math.max(parseInt(savedBest, 10) || 0, currentStreak);
      } catch {}
      // Update best streak if current is higher
      if (currentStreak > bestStreak) {
        bestStreak = currentStreak;
        await AsyncStorage.setItem(bestStreakKey, String(bestStreak));
      }

      // Load total time (language-specific)
      const timeKey = `total_time_${learningLang}`;
      let totalTime = 0;
      try {
        const savedTime = await AsyncStorage.getItem(timeKey);
        if (savedTime) totalTime = parseFloat(savedTime) || 0;
      } catch {}

      setStats({
        totalWords: totalLearned,
        daysActive: currentStreak > 0 ? currentStreak : 0,
        currentStreak,
        bestStreak,
        totalTime,
        accuracy: 85, // Placeholder - would need to track correct/incorrect answers
      });
    } catch (error) {
      console.log('Error loading profile stats:', error);
    }
  }, [learningLang]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

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

  const handleSave = () => {
    if (editedName.trim().length < 2) {
      Alert.alert(i18n.t('profile.error'), i18n.t('profile.nameError'));
      return;
    }
    setUserName(editedName.trim());
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedName(userName);
    setIsEditing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(i18n.locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const StatItem = ({ icon, value, label }: { icon: string; value: string | number; label: string }) => (
    <View style={styles.statItem}>
      <View style={styles.statIconContainer}>
        <Ionicons name={icon as any} size={20} color={colors.brand.gold} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  return (
    <LinearGradient
      colors={[colors.background.primary, colors.background.secondary]}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
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
              <Text style={styles.headerTitle}>{i18n.t('profile.title')}</Text>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => isEditing ? handleSave() : setIsEditing(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.editButtonText}>
                  {isEditing ? i18n.t('profile.save') : i18n.t('profile.edit')}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Avatar Section */}
            <View style={styles.avatarSection}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {userName.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <TouchableOpacity style={styles.cameraButton} activeOpacity={0.7}>
                  <Ionicons name="camera" size={16} color={colors.background.primary} />
                </TouchableOpacity>
              </View>

              {isEditing ? (
                <View style={styles.nameInputContainer}>
                  <TextInput
                    style={styles.nameInput}
                    value={editedName}
                    onChangeText={setEditedName}
                    placeholder={i18n.t('profile.namePlaceholder')}
                    placeholderTextColor={colors.text.muted}
                    autoFocus
                  />
                  <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
                    <Ionicons name="close-circle" size={24} color={colors.text.muted} />
                  </TouchableOpacity>
                </View>
              ) : (
                <Text style={styles.profileName}>{userName}</Text>
              )}
              <Text style={styles.profileEmail}>{userEmail}</Text>
              <View style={styles.memberSince}>
                <Ionicons name="calendar-outline" size={14} color={colors.text.muted} />
                <Text style={styles.memberSinceText}>
                  {i18n.t('profile.memberSince')} {formatDate(joinDate)}
                </Text>
              </View>
            </View>

            {/* Stats Overview */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{i18n.t('profile.statistics')}</Text>
              <View style={styles.statsGrid}>
                <StatItem
                  icon="book-outline"
                  value={stats.totalWords}
                  label={i18n.t('profile.wordsLearned')}
                />
                <StatItem
                  icon="flame-outline"
                  value={stats.currentStreak}
                  label={i18n.t('profile.currentStreak')}
                />
                <StatItem
                  icon="trophy-outline"
                  value={stats.bestStreak}
                  label={i18n.t('profile.bestStreak')}
                />
                <StatItem
                  icon="checkmark-circle-outline"
                  value={`${stats.accuracy}%`}
                  label={i18n.t('profile.accuracy')}
                />
                <StatItem
                  icon="time-outline"
                  value={`${stats.totalTime}h`}
                  label={i18n.t('profile.totalTime')}
                />
                <StatItem
                  icon="calendar-outline"
                  value={stats.daysActive}
                  label={i18n.t('profile.daysActive')}
                />
              </View>
            </View>

            {/* Learning Info */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{i18n.t('profile.learningInfo')}</Text>
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <View style={styles.infoLeft}>
                    <Ionicons name="globe-outline" size={20} color={colors.brand.gold} />
                    <Text style={styles.infoLabel}>{i18n.t('profile.nativeLanguage')}</Text>
                  </View>
                  <Text style={styles.infoValue}>{nativeLanguage}</Text>
                </View>
                <View style={styles.infoDivider} />
                <View style={styles.infoRow}>
                  <View style={styles.infoLeft}>
                    <Ionicons name="school-outline" size={20} color={colors.brand.gold} />
                    <Text style={styles.infoLabel}>{i18n.t('profile.learningLanguage')}</Text>
                  </View>
                  <Text style={styles.infoValue}>{learningLanguage}</Text>
                </View>
                <View style={styles.infoDivider} />
                <View style={styles.infoRow}>
                  <View style={styles.infoLeft}>
                    <Ionicons name="bar-chart-outline" size={20} color={colors.brand.gold} />
                    <Text style={styles.infoLabel}>{i18n.t('profile.level')}</Text>
                  </View>
                  <Text style={styles.infoValue}>
                    {i18n.t(`home.levels.${level}`)}
                  </Text>
                </View>
                <View style={styles.infoDivider} />
                <View style={styles.infoRow}>
                  <View style={styles.infoLeft}>
                    <Ionicons name="flag-outline" size={20} color={colors.brand.gold} />
                    <Text style={styles.infoLabel}>{i18n.t('profile.dailyGoal')}</Text>
                  </View>
                  <Text style={styles.infoValue}>
                    {dailyGoal} {i18n.t('profile.wordsPerDay')}
                  </Text>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionSection}>
              <TouchableOpacity
                style={styles.actionButton}
                activeOpacity={0.7}
                onPress={() => router.push('/settings')}
              >
                <Ionicons name="settings-outline" size={20} color={colors.text.primary} />
                <Text style={styles.actionButtonText}>{i18n.t('profile.settings')}</Text>
                <Ionicons name="chevron-forward" size={20} color={colors.text.muted} />
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  headerTitle: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
    color: colors.text.primary,
  },
  editButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  editButtonText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: colors.brand.gold,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.brand.gold,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.background.card,
  },
  avatarText: {
    fontFamily: fonts.bold,
    fontSize: fontSize.display,
    color: colors.background.primary,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.brand.gold,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.background.primary,
  },
  nameInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.brand.gold,
  },
  nameInput: {
    flex: 1,
    fontFamily: fonts.semiBold,
    fontSize: fontSize.xl,
    color: colors.text.primary,
    paddingVertical: spacing.sm,
    textAlign: 'center',
  },
  cancelButton: {
    padding: spacing.xs,
  },
  profileName: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.xl,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  profileEmail: {
    fontFamily: fonts.body,
    fontSize: fontSize.md,
    color: colors.text.muted,
    marginBottom: spacing.sm,
  },
  memberSince: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  memberSinceText: {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    color: colors.text.muted,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statItem: {
    width: '31%',
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(201, 162, 39, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statValue: {
    fontFamily: fonts.bold,
    fontSize: fontSize.lg,
    color: colors.text.primary,
    marginBottom: 2,
  },
  statLabel: {
    fontFamily: fonts.body,
    fontSize: fontSize.xs,
    color: colors.text.muted,
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.primary,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  infoLabel: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text.secondary,
  },
  infoValue: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: colors.text.primary,
  },
  infoDivider: {
    height: 1,
    backgroundColor: colors.border.primary,
    marginLeft: 44,
  },
  actionSection: {
    marginTop: spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.primary,
    gap: spacing.sm,
  },
  actionButtonText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text.primary,
  },
});
