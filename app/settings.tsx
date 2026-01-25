import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import i18n from '../src/i18n';
import { colors, fontSize, spacing, borderRadius, fonts } from '../src/constants/theme';

export default function SettingsScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const [settings, setSettings] = useState({
    notifications: true,
    sound: true,
    vibration: true,
    darkMode: true,
    autoPlay: false,
  });

  const [userProfile] = useState({
    name: 'User',
    email: 'user@example.com',
    avatar: null,
    language: 'English',
    learnLanguage: 'Spanish',
    dailyGoal: 10,
    level: 'intermediate',
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

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleLogout = () => {
    Alert.alert(
      i18n.t('settings.logoutTitle'),
      i18n.t('settings.logoutMessage'),
      [
        { text: i18n.t('settings.cancel'), style: 'cancel' },
        { text: i18n.t('settings.logout'), style: 'destructive', onPress: () => router.replace('/onboarding') },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      i18n.t('settings.deleteTitle'),
      i18n.t('settings.deleteMessage'),
      [
        { text: i18n.t('settings.cancel'), style: 'cancel' },
        { text: i18n.t('settings.delete'), style: 'destructive', onPress: () => {} },
      ]
    );
  };

  const renderSettingItem = (
    icon: string,
    title: string,
    subtitle?: string,
    onPress?: () => void,
    rightElement?: React.ReactNode
  ) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.settingIcon}>
        <Ionicons name={icon as any} size={22} color={colors.brand.gold} />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {rightElement || (onPress && (
        <Ionicons name="chevron-forward" size={20} color={colors.text.muted} />
      ))}
    </TouchableOpacity>
  );

  const renderToggleItem = (
    icon: string,
    title: string,
    key: keyof typeof settings
  ) => (
    <View style={styles.settingItem}>
      <View style={styles.settingIcon}>
        <Ionicons name={icon as any} size={22} color={colors.brand.gold} />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
      </View>
      <Switch
        value={settings[key]}
        onValueChange={() => toggleSetting(key)}
        trackColor={{ false: colors.background.tertiary, true: colors.brand.gold }}
        thumbColor={colors.text.primary}
        ios_backgroundColor={colors.background.tertiary}
      />
    </View>
  );

  return (
    <LinearGradient
      colors={[colors.background.primary, colors.background.secondary]}
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
            <Text style={styles.headerTitle}>{i18n.t('settings.title')}</Text>
          </View>

          {/* Profile Section */}
          <View style={styles.section}>
            <TouchableOpacity style={styles.profileCard} activeOpacity={0.7} onPress={() => router.push('/profile')}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {userProfile.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{userProfile.name}</Text>
                <Text style={styles.profileEmail}>{userProfile.email}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.text.muted} />
            </TouchableOpacity>
          </View>

          {/* Learning Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{i18n.t('settings.learning')}</Text>
            <View style={styles.sectionCard}>
              {renderSettingItem(
                'language-outline',
                i18n.t('settings.appLanguage'),
                userProfile.language,
                () => {}
              )}
              <View style={styles.divider} />
              {renderSettingItem(
                'school-outline',
                i18n.t('settings.learningLanguage'),
                userProfile.learnLanguage,
                () => {}
              )}
              <View style={styles.divider} />
              {renderSettingItem(
                'trophy-outline',
                i18n.t('settings.dailyGoal'),
                `${userProfile.dailyGoal} ${i18n.t('settings.wordsPerDay')}`,
                () => {}
              )}
              <View style={styles.divider} />
              {renderSettingItem(
                'bar-chart-outline',
                i18n.t('settings.level'),
                i18n.t(`home.levels.${userProfile.level}`),
                () => {}
              )}
            </View>
          </View>

          {/* Notifications */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{i18n.t('settings.notifications')}</Text>
            <View style={styles.sectionCard}>
              {renderToggleItem('notifications-outline', i18n.t('settings.pushNotifications'), 'notifications')}
              <View style={styles.divider} />
              {renderSettingItem(
                'time-outline',
                i18n.t('settings.reminderTime'),
                '09:00',
                () => {}
              )}
            </View>
          </View>

          {/* App Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{i18n.t('settings.appSettings')}</Text>
            <View style={styles.sectionCard}>
              {renderToggleItem('volume-high-outline', i18n.t('settings.sound'), 'sound')}
              <View style={styles.divider} />
              {renderToggleItem('phone-portrait-outline', i18n.t('settings.vibration'), 'vibration')}
              <View style={styles.divider} />
              {renderToggleItem('play-circle-outline', i18n.t('settings.autoPlay'), 'autoPlay')}
              <View style={styles.divider} />
              {renderToggleItem('moon-outline', i18n.t('settings.darkMode'), 'darkMode')}
            </View>
          </View>

          {/* Support */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{i18n.t('settings.support')}</Text>
            <View style={styles.sectionCard}>
              {renderSettingItem(
                'help-circle-outline',
                i18n.t('settings.helpCenter'),
                undefined,
                () => {}
              )}
              <View style={styles.divider} />
              {renderSettingItem(
                'chatbubble-outline',
                i18n.t('settings.contactUs'),
                undefined,
                () => {}
              )}
              <View style={styles.divider} />
              {renderSettingItem(
                'star-outline',
                i18n.t('settings.rateApp'),
                undefined,
                () => {}
              )}
              <View style={styles.divider} />
              {renderSettingItem(
                'share-outline',
                i18n.t('settings.shareApp'),
                undefined,
                () => {}
              )}
            </View>
          </View>

          {/* Legal */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{i18n.t('settings.legal')}</Text>
            <View style={styles.sectionCard}>
              {renderSettingItem(
                'document-text-outline',
                i18n.t('settings.privacyPolicy'),
                undefined,
                () => {}
              )}
              <View style={styles.divider} />
              {renderSettingItem(
                'reader-outline',
                i18n.t('settings.termsOfService'),
                undefined,
                () => {}
              )}
            </View>
          </View>

          {/* Account Actions */}
          <View style={styles.section}>
            <View style={styles.sectionCard}>
              <TouchableOpacity style={styles.settingItem} onPress={handleLogout}>
                <View style={styles.settingIcon}>
                  <Ionicons name="log-out-outline" size={22} color={colors.status.warning} />
                </View>
                <View style={styles.settingContent}>
                  <Text style={[styles.settingTitle, { color: colors.status.warning }]}>
                    {i18n.t('settings.logout')}
                  </Text>
                </View>
              </TouchableOpacity>
              <View style={styles.divider} />
              <TouchableOpacity style={styles.settingItem} onPress={handleDeleteAccount}>
                <View style={styles.settingIcon}>
                  <Ionicons name="trash-outline" size={22} color={colors.status.error} />
                </View>
                <View style={styles.settingContent}>
                  <Text style={[styles.settingTitle, { color: colors.status.error }]}>
                    {i18n.t('settings.deleteAccount')}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* App Version */}
          <View style={styles.versionContainer}>
            <Text style={styles.versionText}>Synora v1.0.0</Text>
            <Text style={styles.copyrightText}>{i18n.t('settings.madeWith')}</Text>
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
        <TouchableOpacity style={styles.navItem} activeOpacity={0.7} onPress={() => router.push('/stats')}>
          <Ionicons name="stats-chart-outline" size={24} color={colors.text.muted} />
          <Text style={styles.navLabel}>{i18n.t('home.nav.stats')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} activeOpacity={0.7}>
          <Ionicons name="settings" size={24} color={colors.brand.gold} />
          <Text style={[styles.navLabel, styles.navLabelActive]}>{i18n.t('home.nav.settings')}</Text>
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
    fontFamily: fonts.semiBold,
    fontSize: fontSize.xxl,
    color: colors.text.primary,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.sm,
    color: colors.text.muted,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionCard: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.primary,
    padding: spacing.md,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.brand.gold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontFamily: fonts.bold,
    fontSize: fontSize.xl,
    color: colors.background.primary,
  },
  profileInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  profileName: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
    color: colors.text.primary,
  },
  profileEmail: {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    color: colors.text.muted,
    marginTop: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(201, 162, 39, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  settingTitle: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text.primary,
  },
  settingSubtitle: {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    color: colors.text.muted,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.primary,
    marginLeft: 60,
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  versionText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: colors.text.muted,
  },
  copyrightText: {
    fontFamily: fonts.body,
    fontSize: fontSize.xs,
    color: colors.text.muted,
    marginTop: spacing.xs,
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
