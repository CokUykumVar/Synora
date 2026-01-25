import { useEffect, useRef, useState } from 'react';
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
import i18n from '../src/i18n';
import { colors, fontSize, spacing, borderRadius, fonts } from '../src/constants/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: 'User',
    email: 'user@example.com',
    joinDate: '2024-01-15',
    nativeLanguage: 'Turkish',
    learningLanguage: 'English',
    level: 'intermediate',
    dailyGoal: 10,
  });

  const [editedName, setEditedName] = useState(profile.name);

  const [stats] = useState({
    totalWords: 156,
    daysActive: 23,
    currentStreak: 7,
    bestStreak: 14,
    totalTime: 12.5,
    accuracy: 85,
  });

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
    setProfile(prev => ({ ...prev, name: editedName.trim() }));
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedName(profile.name);
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
                    {profile.name.charAt(0).toUpperCase()}
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
                <Text style={styles.profileName}>{profile.name}</Text>
              )}
              <Text style={styles.profileEmail}>{profile.email}</Text>
              <View style={styles.memberSince}>
                <Ionicons name="calendar-outline" size={14} color={colors.text.muted} />
                <Text style={styles.memberSinceText}>
                  {i18n.t('profile.memberSince')} {formatDate(profile.joinDate)}
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
                  <Text style={styles.infoValue}>{profile.nativeLanguage}</Text>
                </View>
                <View style={styles.infoDivider} />
                <View style={styles.infoRow}>
                  <View style={styles.infoLeft}>
                    <Ionicons name="school-outline" size={20} color={colors.brand.gold} />
                    <Text style={styles.infoLabel}>{i18n.t('profile.learningLanguage')}</Text>
                  </View>
                  <Text style={styles.infoValue}>{profile.learningLanguage}</Text>
                </View>
                <View style={styles.infoDivider} />
                <View style={styles.infoRow}>
                  <View style={styles.infoLeft}>
                    <Ionicons name="bar-chart-outline" size={20} color={colors.brand.gold} />
                    <Text style={styles.infoLabel}>{i18n.t('profile.level')}</Text>
                  </View>
                  <Text style={styles.infoValue}>
                    {i18n.t(`home.levels.${profile.level}`)}
                  </Text>
                </View>
                <View style={styles.infoDivider} />
                <View style={styles.infoRow}>
                  <View style={styles.infoLeft}>
                    <Ionicons name="flag-outline" size={20} color={colors.brand.gold} />
                    <Text style={styles.infoLabel}>{i18n.t('profile.dailyGoal')}</Text>
                  </View>
                  <Text style={styles.infoValue}>
                    {profile.dailyGoal} {i18n.t('profile.wordsPerDay')}
                  </Text>
                </View>
              </View>
            </View>

            {/* Achievements Preview */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{i18n.t('profile.achievements')}</Text>
                <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/stats')}>
                  <Text style={styles.seeAllText}>{i18n.t('profile.seeAll')}</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.achievementsRow}>
                {[
                  { icon: 'star', unlocked: true },
                  { icon: 'flame', unlocked: true },
                  { icon: 'trophy', unlocked: true },
                  { icon: 'medal', unlocked: false },
                  { icon: 'ribbon', unlocked: false },
                ].map((achievement, index) => (
                  <View
                    key={index}
                    style={[
                      styles.achievementBadge,
                      !achievement.unlocked && styles.achievementLocked,
                    ]}
                  >
                    <Ionicons
                      name={achievement.icon as any}
                      size={24}
                      color={achievement.unlocked ? colors.brand.gold : colors.text.muted}
                    />
                  </View>
                ))}
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
    paddingTop: 60,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  seeAllText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: colors.brand.gold,
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
  achievementsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  achievementBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.background.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.brand.gold,
  },
  achievementLocked: {
    borderColor: colors.border.primary,
    opacity: 0.5,
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
