import { useEffect, useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Modal,
  Linking,
  Share,
  Platform,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import i18n from '../src/i18n';
import { useLanguage } from '../src/context/LanguageContext';
import { useUser } from '../src/context/UserContext';
import { colors, fontSize, spacing, borderRadius, fonts, layout } from '../src/constants/theme';
import { LANGUAGES, getLanguageName, getLanguageFlag } from '../src/constants/languages';

const DAILY_GOALS = [
  { value: 5, label: 'Rahat', labelEn: 'Casual' },
  { value: 10, label: 'Düzenli', labelEn: 'Regular' },
  { value: 15, label: 'Ciddi', labelEn: 'Serious' },
  { value: 20, label: 'Yoğun', labelEn: 'Intense' },
];

const LEVELS = [
  { id: 'beginner', labelTr: 'Başlangıç', labelEn: 'Beginner' },
  { id: 'elementary', labelTr: 'Temel', labelEn: 'Elementary' },
  { id: 'intermediate', labelTr: 'Orta', labelEn: 'Intermediate' },
  { id: 'advanced', labelTr: 'İleri', labelEn: 'Advanced' },
];

const REMINDER_TIMES = [
  { id: 'morning', time: '08:00', labelTr: 'Sabah', labelEn: 'Morning' },
  { id: 'noon', time: '12:00', labelTr: 'Öğle', labelEn: 'Noon' },
  { id: 'afternoon', time: '15:00', labelTr: 'İkindi', labelEn: 'Afternoon' },
  { id: 'evening', time: '18:00', labelTr: 'Akşam', labelEn: 'Evening' },
  { id: 'night', time: '21:00', labelTr: 'Gece', labelEn: 'Night' },
];

const APP_VERSION = '1.0.0';

export default function SettingsScreen() {
  const router = useRouter();
  const { locale, setLocale } = useLanguage();
  const {
    preferences,
    setNativeLanguage: saveNativeLanguage,
    setLearningLanguage: saveLearningLanguage,
    setLevel: saveLevel,
    setDailyGoal: saveDailyGoal,
    setReminder: saveReminder,
  } = useUser();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const [notificationSettings, setNotificationSettings] = useState({
    enabled: preferences.reminderEnabled || false,
    reminderTime: preferences.reminderTime || 'morning',
  });

  const [learningSettings, setLearningSettings] = useState({
    nativeLanguage: preferences.nativeLanguage?.code || 'tr',
    learnLanguage: preferences.learningLanguage?.code || 'en',
    dailyGoal: preferences.dailyGoal || 10,
    level: preferences.level || 'intermediate',
  });

  const [userProfile] = useState({
    name: 'User',
    email: 'user@example.com',
  });

  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'native' | 'learn' | 'goal' | 'level' | 'reminder' | null>(null);
  const [contactModalVisible, setContactModalVisible] = useState(false);
  const [contactTopic, setContactTopic] = useState('general');
  const [contactMessage, setContactMessage] = useState('');

  // Compute display values directly from preferences (always up-to-date)
  const displaySettings = useMemo(() => ({
    nativeLanguage: preferences.nativeLanguage?.code || 'tr',
    learnLanguage: preferences.learningLanguage?.code || 'en',
    dailyGoal: preferences.dailyGoal || 10,
    level: preferences.level || 'intermediate',
    reminderEnabled: preferences.reminderEnabled || false,
    reminderTime: preferences.reminderTime || 'morning',
  }), [
    preferences.nativeLanguage?.code,
    preferences.learningLanguage?.code,
    preferences.dailyGoal,
    preferences.level,
    preferences.reminderEnabled,
    preferences.reminderTime,
  ]);

  // Sync local state with preferences when they change
  useEffect(() => {
    setLearningSettings({
      nativeLanguage: displaySettings.nativeLanguage,
      learnLanguage: displaySettings.learnLanguage,
      dailyGoal: displaySettings.dailyGoal,
      level: displaySettings.level,
    });

    setNotificationSettings({
      enabled: displaySettings.reminderEnabled,
      reminderTime: displaySettings.reminderTime,
    });
  }, [displaySettings]);

  // Animation on mount
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

  const openModal = (type: 'native' | 'learn' | 'goal' | 'level' | 'reminder') => {
    setModalType(type);
    setModalVisible(true);
  };

  const handleLanguageSelect = async (code: string) => {
    const selectedLang = LANGUAGES.find(l => l.code === code);
    if (!selectedLang) return;

    if (modalType === 'native') {
      setLearningSettings(prev => ({ ...prev, nativeLanguage: code }));
      // Update UserContext and app language
      await saveNativeLanguage(selectedLang);
      await setLocale(code);
    } else if (modalType === 'learn') {
      setLearningSettings(prev => ({ ...prev, learnLanguage: code }));
      // Update UserContext
      await saveLearningLanguage(selectedLang);
    }
    setModalVisible(false);
  };

  const handleGoalSelect = async (value: number) => {
    setLearningSettings(prev => ({ ...prev, dailyGoal: value }));
    await saveDailyGoal(value);
    setModalVisible(false);
  };

  const handleLevelSelect = async (id: string) => {
    setLearningSettings(prev => ({ ...prev, level: id }));
    await saveLevel(id);
    setModalVisible(false);
  };

  const handleReminderSelect = async (id: string) => {
    setNotificationSettings(prev => ({ ...prev, reminderTime: id }));
    await saveReminder(displaySettings.reminderEnabled, id);
    setModalVisible(false);
  };

  const toggleNotifications = async () => {
    const newValue = !displaySettings.reminderEnabled;
    setNotificationSettings(prev => ({ ...prev, enabled: newValue }));
    await saveReminder(newValue, displaySettings.reminderTime);
  };

  const getReminderTimeDisplay = () => {
    const reminder = REMINDER_TIMES.find(r => r.id === displaySettings.reminderTime);
    return reminder ? `${reminder.time} - ${reminder.labelTr}` : '08:00';
  };

  const handleContactUs = () => {
    setContactModalVisible(true);
  };

  const sendContactEmail = () => {
    if (!contactMessage.trim()) {
      Alert.alert('Uyarı', 'Lütfen mesajınızı yazın.');
      return;
    }

    const email = 'support@synora.app';
    const topicLabels: { [key: string]: string } = {
      general: 'Genel Destek',
      bug: 'Hata Bildirimi',
      suggestion: 'Öneri/İstek',
    };
    const subject = `Synora - ${topicLabels[contactTopic]}`;

    const deviceInfo = Platform.select({
      ios: `iOS ${Platform.Version}`,
      android: `Android ${Platform.Version}`,
    }) || 'Bilinmiyor';

    const body = `${contactMessage}

-------------------
Cihaz Bilgileri
-------------------
Platform: ${Platform.OS === 'ios' ? 'iPhone/iPad' : 'Android'}
OS Versiyon: ${deviceInfo}
Uygulama Versiyon: v${APP_VERSION}
`;

    const url = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    Linking.openURL(url).catch(() => {
      Alert.alert('Hata', 'E-posta uygulaması açılamadı.');
    });

    setContactModalVisible(false);
    setContactMessage('');
    setContactTopic('general');
  };

  const handleRateApp = () => {
    const iosAppId = 'YOUR_IOS_APP_ID'; // App Store ID'nizi buraya ekleyin
    const androidPackage = 'com.synora.app'; // Play Store paket adınızı buraya ekleyin

    const url = Platform.select({
      ios: `itms-apps://itunes.apple.com/app/id${iosAppId}?action=write-review`,
      android: `market://details?id=${androidPackage}`,
    });

    if (url) {
      Linking.openURL(url).catch(() => {
        // Fallback to web URL
        const webUrl = Platform.select({
          ios: `https://apps.apple.com/app/id${iosAppId}`,
          android: `https://play.google.com/store/apps/details?id=${androidPackage}`,
        });
        if (webUrl) Linking.openURL(webUrl);
      });
    }
  };

  const handleShareApp = async () => {
    try {
      await Share.share({
        message: 'Synora ile kelime öğrenmeye başla! 📚\n\nİndirmek için: https://synora.app',
        title: 'Synora - Kelime Öğrenme Uygulaması',
      });
    } catch (error) {
      console.log('Share error:', error);
    }
  };

  const getLevelName = (id: string) => {
    const level = LEVELS.find(l => l.id === id);
    return level ? level.labelTr : id;
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
                'globe-outline',
                i18n.t('settings.appLanguage'),
                `${getLanguageFlag(displaySettings.nativeLanguage)} ${getLanguageName(displaySettings.nativeLanguage)}`,
                () => openModal('native')
              )}
              <View style={styles.divider} />
              {renderSettingItem(
                'school-outline',
                i18n.t('settings.learningLanguage'),
                `${getLanguageFlag(displaySettings.learnLanguage)} ${getLanguageName(displaySettings.learnLanguage)}`,
                () => openModal('learn')
              )}
              <View style={styles.divider} />
              {renderSettingItem(
                'trophy-outline',
                i18n.t('settings.dailyGoal'),
                `${displaySettings.dailyGoal} ${i18n.t('settings.wordsPerDay')}`,
                () => openModal('goal')
              )}
              <View style={styles.divider} />
              {renderSettingItem(
                'bar-chart-outline',
                i18n.t('settings.level'),
                getLevelName(displaySettings.level),
                () => openModal('level')
              )}
            </View>
          </View>

          {/* Notifications */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{i18n.t('settings.notifications')}</Text>
            <View style={styles.sectionCard}>
              <View style={styles.settingItem}>
                <View style={styles.settingIcon}>
                  <Ionicons name="notifications-outline" size={22} color={colors.brand.gold} />
                </View>
                <View style={styles.settingContent}>
                  <Text style={styles.settingTitle}>{i18n.t('settings.pushNotifications')}</Text>
                </View>
                <Switch
                  value={displaySettings.reminderEnabled}
                  onValueChange={toggleNotifications}
                  trackColor={{ false: colors.background.tertiary, true: colors.brand.gold }}
                  thumbColor={colors.text.primary}
                  ios_backgroundColor={colors.background.tertiary}
                />
              </View>
              {displaySettings.reminderEnabled && (
                <>
                  <View style={styles.divider} />
                  {renderSettingItem(
                    'time-outline',
                    i18n.t('settings.reminderTime'),
                    getReminderTimeDisplay(),
                    () => openModal('reminder')
                  )}
                </>
              )}
            </View>
          </View>

          {/* Support */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{i18n.t('settings.support')}</Text>
            <View style={styles.sectionCard}>
              {renderSettingItem(
                'mail-outline',
                i18n.t('settings.contactUs'),
                'support@synora.app',
                handleContactUs
              )}
              <View style={styles.divider} />
              {renderSettingItem(
                'star-outline',
                i18n.t('settings.rateApp'),
                undefined,
                handleRateApp
              )}
              <View style={styles.divider} />
              {renderSettingItem(
                'share-social-outline',
                i18n.t('settings.shareApp'),
                undefined,
                handleShareApp
              )}
            </View>
          </View>

          {/* Account Actions */}
          <View style={[styles.section, { marginTop: spacing.lg }]}>
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

                  </Animated.View>
      </ScrollView>

      {/* Selection Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {modalType === 'native' && i18n.t('settings.appLanguage')}
                {modalType === 'learn' && i18n.t('settings.learningLanguage')}
                {modalType === 'goal' && i18n.t('settings.dailyGoal')}
                {modalType === 'level' && i18n.t('settings.level')}
                {modalType === 'reminder' && i18n.t('settings.reminderTime')}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {(modalType === 'native' || modalType === 'learn') && (
                LANGUAGES.map((lang) => (
                  <TouchableOpacity
                    key={lang.code}
                    style={[
                      styles.modalOption,
                      ((modalType === 'native' && displaySettings.nativeLanguage === lang.code) ||
                       (modalType === 'learn' && displaySettings.learnLanguage === lang.code)) && styles.modalOptionActive
                    ]}
                    onPress={() => handleLanguageSelect(lang.code)}
                  >
                    <Text style={styles.modalOptionFlag}>{lang.flag}</Text>
                    <Text style={styles.modalOptionText}>{lang.name}</Text>
                    {((modalType === 'native' && displaySettings.nativeLanguage === lang.code) ||
                      (modalType === 'learn' && displaySettings.learnLanguage === lang.code)) && (
                      <Ionicons name="checkmark" size={22} color={colors.brand.gold} />
                    )}
                  </TouchableOpacity>
                ))
              )}

              {modalType === 'goal' && (
                DAILY_GOALS.map((goal) => (
                  <TouchableOpacity
                    key={goal.value}
                    style={[
                      styles.modalOption,
                      displaySettings.dailyGoal === goal.value && styles.modalOptionActive
                    ]}
                    onPress={() => handleGoalSelect(goal.value)}
                  >
                    <View style={styles.goalInfo}>
                      <Text style={styles.modalOptionText}>{goal.value} {i18n.t('settings.wordsPerDay')}</Text>
                      <Text style={styles.goalLabel}>{goal.label}</Text>
                    </View>
                    {displaySettings.dailyGoal === goal.value && (
                      <Ionicons name="checkmark" size={22} color={colors.brand.gold} />
                    )}
                  </TouchableOpacity>
                ))
              )}

              {modalType === 'level' && (
                LEVELS.map((level) => (
                  <TouchableOpacity
                    key={level.id}
                    style={[
                      styles.modalOption,
                      displaySettings.level === level.id && styles.modalOptionActive
                    ]}
                    onPress={() => handleLevelSelect(level.id)}
                  >
                    <Text style={styles.modalOptionText}>{level.labelTr}</Text>
                    {displaySettings.level === level.id && (
                      <Ionicons name="checkmark" size={22} color={colors.brand.gold} />
                    )}
                  </TouchableOpacity>
                ))
              )}

              {modalType === 'reminder' && (
                REMINDER_TIMES.map((reminder) => (
                  <TouchableOpacity
                    key={reminder.id}
                    style={[
                      styles.modalOption,
                      displaySettings.reminderTime === reminder.id && styles.modalOptionActive
                    ]}
                    onPress={() => handleReminderSelect(reminder.id)}
                  >
                    <View style={styles.reminderInfo}>
                      <Text style={styles.modalOptionText}>{reminder.time}</Text>
                      <Text style={styles.reminderLabel}>{reminder.labelTr}</Text>
                    </View>
                    {displaySettings.reminderTime === reminder.id && (
                      <Ionicons name="checkmark" size={22} color={colors.brand.gold} />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Contact Modal */}
      <Modal
        visible={contactModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setContactModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setContactModalVisible(false)}
          />
          <View style={styles.contactModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{i18n.t('settings.contactUs')}</Text>
              <TouchableOpacity onPress={() => setContactModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.contactModalScroll}
              keyboardShouldPersistTaps="handled"
            >
              {/* Topic Selection */}
              <Text style={styles.contactLabel}>Konu</Text>
              <View style={styles.topicContainer}>
                {[
                  { id: 'general', label: 'Genel Destek', icon: 'help-circle-outline' },
                  { id: 'bug', label: 'Hata Bildirimi', icon: 'bug-outline' },
                  { id: 'suggestion', label: 'Öneri/İstek', icon: 'bulb-outline' },
                ].map((topic) => (
                  <TouchableOpacity
                    key={topic.id}
                    style={[
                      styles.topicButton,
                      contactTopic === topic.id && styles.topicButtonActive,
                    ]}
                    onPress={() => setContactTopic(topic.id)}
                  >
                    <Ionicons
                      name={topic.icon as any}
                      size={20}
                      color={contactTopic === topic.id ? colors.brand.gold : colors.text.muted}
                    />
                    <Text
                      style={[
                        styles.topicButtonText,
                        contactTopic === topic.id && styles.topicButtonTextActive,
                      ]}
                    >
                      {topic.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Message Input */}
              <Text style={styles.contactLabel}>Mesajınız</Text>
              <TextInput
                style={styles.messageInput}
                placeholder="Mesajınızı buraya yazın..."
                placeholderTextColor={colors.text.muted}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                value={contactMessage}
                onChangeText={setContactMessage}
              />

              {/* Send Button */}
              <TouchableOpacity style={styles.sendButton} onPress={sendContactEmail}>
                <Ionicons name="send" size={20} color={colors.background.primary} />
                <Text style={styles.sendButtonText}>Gönder</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

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
    paddingTop: layout.headerPaddingTop,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: colors.background.secondary,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.primary,
  },
  modalTitle: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
    color: colors.text.primary,
  },
  modalScroll: {
    padding: spacing.md,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  modalOptionActive: {
    backgroundColor: 'rgba(201, 162, 39, 0.15)',
    borderWidth: 1,
    borderColor: colors.brand.gold,
  },
  modalOptionFlag: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  modalOptionText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text.primary,
  },
  goalInfo: {
    flex: 1,
  },
  goalLabel: {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    color: colors.text.muted,
    marginTop: 2,
  },
  reminderInfo: {
    flex: 1,
  },
  reminderLabel: {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    color: colors.text.muted,
    marginTop: 2,
  },
  contactModalContent: {
    backgroundColor: colors.background.secondary,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '85%',
  },
  contactModalScroll: {
    padding: spacing.lg,
  },
  contactLabel: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  topicContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  topicButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: colors.border.primary,
    gap: spacing.xs,
  },
  topicButtonActive: {
    backgroundColor: 'rgba(201, 162, 39, 0.15)',
    borderColor: colors.brand.gold,
  },
  topicButtonText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.xs,
    color: colors.text.muted,
    textAlign: 'center',
  },
  topicButtonTextActive: {
    color: colors.brand.gold,
  },
  messageInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.primary,
    padding: spacing.md,
    fontFamily: fonts.body,
    fontSize: fontSize.md,
    color: colors.text.primary,
    minHeight: 150,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand.gold,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  sendButtonText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: colors.background.primary,
  },
});
