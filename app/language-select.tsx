import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  FlatList,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import i18n from '../src/i18n';
import { colors, fontSize, spacing, borderRadius, fonts } from '../src/constants/theme';
import { useUser } from '../src/context/UserContext';

const LANGUAGES = [
  { code: 'ar', name: 'العربية', nameEn: 'Arabic', flag: '🇸🇦' },
  { code: 'az', name: 'Azərbaycan', nameEn: 'Azerbaijani', flag: '🇦🇿' },
  { code: 'hr', name: 'Hrvatski', nameEn: 'Croatian', flag: '🇭🇷' },
  { code: 'cs', name: 'Čeština', nameEn: 'Czech', flag: '🇨🇿' },
  { code: 'da', name: 'Dansk', nameEn: 'Danish', flag: '🇩🇰' },
  { code: 'nl', name: 'Nederlands', nameEn: 'Dutch', flag: '🇳🇱' },
  { code: 'en', name: 'English', nameEn: 'English', flag: '🇬🇧' },
  { code: 'fi', name: 'Suomi', nameEn: 'Finnish', flag: '🇫🇮' },
  { code: 'fr', name: 'Français', nameEn: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', nameEn: 'German', flag: '🇩🇪' },
  { code: 'el', name: 'Ελληνικά', nameEn: 'Greek', flag: '🇬🇷' },
  { code: 'hi', name: 'हिन्दी', nameEn: 'Hindi', flag: '🇮🇳' },
  { code: 'id', name: 'Indonesia', nameEn: 'Indonesian', flag: '🇮🇩' },
  { code: 'it', name: 'Italiano', nameEn: 'Italian', flag: '🇮🇹' },
  { code: 'ja', name: '日本語', nameEn: 'Japanese', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', nameEn: 'Korean', flag: '🇰🇷' },
  { code: 'no', name: 'Norsk', nameEn: 'Norwegian', flag: '🇳🇴' },
  { code: 'pl', name: 'Polski', nameEn: 'Polish', flag: '🇵🇱' },
  { code: 'pt', name: 'Português', nameEn: 'Portuguese', flag: '🇵🇹' },
  { code: 'ro', name: 'Română', nameEn: 'Romanian', flag: '🇷🇴' },
  { code: 'ru', name: 'Русский', nameEn: 'Russian', flag: '🇷🇺' },
  { code: 'zh', name: '简体中文', nameEn: 'Simplified Chinese', flag: '🇨🇳' },
  { code: 'es', name: 'Español', nameEn: 'Spanish', flag: '🇪🇸' },
  { code: 'sv', name: 'Svenska', nameEn: 'Swedish', flag: '🇸🇪' },
  { code: 'th', name: 'ไทย', nameEn: 'Thai', flag: '🇹🇭' },
  { code: 'tr', name: 'Türkçe', nameEn: 'Turkish', flag: '🇹🇷' },
  { code: 'uk', name: 'Українська', nameEn: 'Ukrainian', flag: '🇺🇦' },
  { code: 'ur', name: 'اردو', nameEn: 'Urdu', flag: '🇵🇰' },
  { code: 'vi', name: 'Tiếng Việt', nameEn: 'Vietnamese', flag: '🇻🇳' },
];

type LanguageType = typeof LANGUAGES[0];
type SelectionType = 'native' | 'learn';

export default function LanguageSelectScreen() {
  const router = useRouter();
  const { setNativeLanguage: saveNativeLanguage, setLearningLanguage: saveLearningLanguage } = useUser();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const [nativeLanguage, setNativeLanguage] = useState<LanguageType | null>(null);
  const [learnLanguage, setLearnLanguage] = useState<LanguageType | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectionType, setSelectionType] = useState<SelectionType>('native');
  const [, setLocaleUpdate] = useState(0); // Force re-render on locale change

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const openLanguageModal = (type: SelectionType) => {
    setSelectionType(type);
    setModalVisible(true);
  };

  const selectLanguage = (language: LanguageType) => {
    if (selectionType === 'native') {
      setNativeLanguage(language);
      // Uygulama dilini seçilen anadile göre değiştir
      i18n.locale = language.code;
      setLocaleUpdate(prev => prev + 1); // Force re-render
    } else {
      setLearnLanguage(language);
    }
    setModalVisible(false);
  };

  const handleContinue = async () => {
    if (nativeLanguage && learnLanguage) {
      await saveNativeLanguage(nativeLanguage);
      await saveLearningLanguage(learnLanguage);
    }
    router.push('/level-select');
  };

  const canContinue = nativeLanguage && learnLanguage && nativeLanguage.code !== learnLanguage.code;

  const renderLanguageItem = ({ item }: { item: LanguageType }) => {
    const isSelected =
      (selectionType === 'native' && nativeLanguage?.code === item.code) ||
      (selectionType === 'learn' && learnLanguage?.code === item.code);

    const isDisabled =
      (selectionType === 'learn' && nativeLanguage?.code === item.code) ||
      (selectionType === 'native' && learnLanguage?.code === item.code);

    return (
      <TouchableOpacity
        style={[
          styles.languageItem,
          isSelected && styles.languageItemSelected,
          isDisabled && styles.languageItemDisabled,
        ]}
        onPress={() => !isDisabled && selectLanguage(item)}
        activeOpacity={0.7}
        disabled={isDisabled}
      >
        <View style={[styles.flagContainer, isSelected && styles.flagContainerSelected]}>
          <Text style={styles.flag}>{item.flag}</Text>
        </View>
        <View style={styles.languageInfo}>
          <Text style={[styles.languageName, isDisabled && styles.languageNameDisabled]}>
            {item.name}
          </Text>
          <Text style={[styles.languageNameEn, isDisabled && styles.languageNameDisabled]}>
            {item.nameEn}
          </Text>
        </View>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={24} color={colors.brand.gold} />
        )}
      </TouchableOpacity>
    );
  };

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
        <View style={styles.header}>
          <Text style={styles.logo}>SYNORA</Text>
        </View>

        <View style={styles.mainContent}>
          <Text style={styles.title}>{i18n.t('languageSelect.title')}</Text>
          <Text style={styles.subtitle}>{i18n.t('languageSelect.subtitle')}</Text>

          <View style={styles.selectionsContainer}>
            <TouchableOpacity
              style={[styles.selectionBox, nativeLanguage && styles.selectionBoxSelected]}
              onPress={() => openLanguageModal('native')}
              activeOpacity={0.7}
            >
              <Text style={styles.selectionLabel}>{i18n.t('languageSelect.nativeLanguage')}</Text>
              <View style={styles.selectionValue}>
                {nativeLanguage && (
                  <View style={styles.selectedFlagContainer}>
                    <Text style={styles.selectedFlag}>{nativeLanguage.flag}</Text>
                  </View>
                )}
                <Text style={[styles.selectionText, !nativeLanguage && styles.selectionPlaceholder]}>
                  {nativeLanguage ? nativeLanguage.name : i18n.t('languageSelect.select')}
                </Text>
                <Ionicons name="chevron-down" size={20} color={colors.text.secondary} />
              </View>
            </TouchableOpacity>

            <View style={styles.arrowContainer}>
              <Ionicons name="arrow-down" size={24} color={colors.brand.gold} />
            </View>

            <TouchableOpacity
              style={[styles.selectionBox, learnLanguage && styles.selectionBoxSelected]}
              onPress={() => openLanguageModal('learn')}
              activeOpacity={0.7}
            >
              <Text style={styles.selectionLabel}>{i18n.t('languageSelect.learnLanguage')}</Text>
              <View style={styles.selectionValue}>
                {learnLanguage && (
                  <View style={styles.selectedFlagContainer}>
                    <Text style={styles.selectedFlag}>{learnLanguage.flag}</Text>
                  </View>
                )}
                <Text style={[styles.selectionText, !learnLanguage && styles.selectionPlaceholder]}>
                  {learnLanguage ? learnLanguage.name : i18n.t('languageSelect.select')}
                </Text>
                <Ionicons name="chevron-down" size={20} color={colors.text.secondary} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.continueButton, !canContinue && styles.continueButtonDisabled]}
            onPress={handleContinue}
            activeOpacity={0.7}
            disabled={!canContinue}
          >
            <Text style={[styles.continueButtonText, !canContinue && styles.continueButtonTextDisabled]}>
              {i18n.t('languageSelect.continue')}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectionType === 'native'
                  ? i18n.t('languageSelect.selectNative')
                  : i18n.t('languageSelect.selectLearn')}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={LANGUAGES}
              renderItem={renderLanguageItem}
              keyExtractor={(item) => item.code}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.languageList}
            />
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  header: {
    alignItems: 'center',
    paddingTop: 80,
  },
  logo: {
    fontFamily: fonts.logo,
    fontSize: 36,
    color: colors.brand.gold,
    letterSpacing: 4,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 40,
  },
  title: {
    fontFamily: fonts.italicMedium,
    fontSize: 26,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
    letterSpacing: 2,
    fontStyle: 'italic',
  },
  subtitle: {
    fontFamily: fonts.italic,
    fontSize: fontSize.md,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xxl,
    letterSpacing: 1,
    fontStyle: 'italic',
  },
  selectionsContainer: {
    gap: spacing.sm,
  },
  selectionBox: {
    borderWidth: 1,
    borderColor: colors.border.primary,
    borderRadius: borderRadius.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: spacing.lg,
  },
  selectionBoxSelected: {
    borderColor: colors.brand.gold,
    backgroundColor: 'rgba(201, 162, 39, 0.08)',
  },
  selectionLabel: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: colors.text.muted,
    marginBottom: spacing.xs,
  },
  selectionValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  selectedFlagContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: colors.brand.gold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedFlag: {
    fontSize: 18,
  },
  selectionText: {
    flex: 1,
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
    color: colors.text.primary,
  },
  selectionPlaceholder: {
    color: colors.text.muted,
    fontFamily: fonts.body,
  },
  arrowContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  footer: {
    paddingBottom: 60,
  },
  continueButton: {
    width: '100%',
    paddingVertical: spacing.md + 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.xl,
    borderWidth: 1.5,
    borderColor: colors.brand.gold,
    backgroundColor: 'rgba(201, 162, 39, 0.15)',
  },
  continueButtonDisabled: {
    borderColor: colors.border.primary,
    backgroundColor: 'transparent',
  },
  continueButtonText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.brand.goldLight,
    letterSpacing: 1,
  },
  continueButtonTextDisabled: {
    color: colors.text.muted,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.primary,
  },
  modalTitle: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
    color: colors.text.primary,
  },
  closeButton: {
    padding: spacing.xs,
  },
  languageList: {
    padding: spacing.md,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xs,
    gap: spacing.md,
  },
  languageItemSelected: {
    backgroundColor: 'rgba(201, 162, 39, 0.15)',
    borderWidth: 1,
    borderColor: colors.brand.gold,
  },
  languageItemDisabled: {
    opacity: 0.4,
  },
  flagContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: colors.border.primary,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  flagContainerSelected: {
    borderColor: colors.brand.gold,
    backgroundColor: 'rgba(201, 162, 39, 0.1)',
  },
  flag: {
    fontSize: 24,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text.primary,
    marginBottom: 2,
  },
  languageNameEn: {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  languageNameDisabled: {
    color: colors.text.muted,
  },
});
