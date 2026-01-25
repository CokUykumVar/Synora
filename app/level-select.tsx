import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import i18n from '../src/i18n';
import { colors, fontSize, spacing, borderRadius, fonts } from '../src/constants/theme';

const LEVELS = [
  { id: 'beginner', icon: 'leaf-outline' },
  { id: 'elementary', icon: 'flower-outline' },
  { id: 'intermediate', icon: 'trending-up-outline' },
  { id: 'advanced', icon: 'rocket-outline' },
] as const;

type LevelType = typeof LEVELS[number];

export default function LevelSelectScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const [selectedLevel, setSelectedLevel] = useState<LevelType | null>(null);

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

  const handleContinue = () => {
    // TODO: Save level preference
    router.push('/daily-goal');
  };

  const handleBack = () => {
    router.back();
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
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.logo}>SYNORA</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.mainContent}>
          <Text style={styles.title}>{i18n.t('levelSelect.title')}</Text>
          <Text style={styles.subtitle}>{i18n.t('levelSelect.subtitle')}</Text>

          <View style={styles.levelsContainer}>
            {LEVELS.map((level) => {
              const isSelected = selectedLevel?.id === level.id;
              return (
                <TouchableOpacity
                  key={level.id}
                  style={[styles.levelCard, isSelected && styles.levelCardSelected]}
                  onPress={() => setSelectedLevel(level)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.iconContainer, isSelected && styles.iconContainerSelected]}>
                    <Ionicons
                      name={level.icon as any}
                      size={28}
                      color={isSelected ? colors.brand.gold : colors.text.secondary}
                    />
                  </View>
                  <View style={styles.levelInfo}>
                    <Text style={[styles.levelName, isSelected && styles.levelNameSelected]}>
                      {i18n.t(`levelSelect.levels.${level.id}.name`)}
                    </Text>
                    <Text style={styles.levelDescription}>
                      {i18n.t(`levelSelect.levels.${level.id}.description`)}
                    </Text>
                  </View>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={24} color={colors.brand.gold} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.continueButton, !selectedLevel && styles.continueButtonDisabled]}
            onPress={handleContinue}
            activeOpacity={0.7}
            disabled={!selectedLevel}
          >
            <Text style={[styles.continueButtonText, !selectedLevel && styles.continueButtonTextDisabled]}>
              {i18n.t('levelSelect.continue')}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: spacing.lg,
  },
  backButton: {
    padding: spacing.xs,
  },
  logo: {
    fontFamily: fonts.logo,
    fontSize: 24,
    color: colors.brand.gold,
    letterSpacing: 3,
  },
  placeholder: {
    width: 32,
  },
  mainContent: {
    flex: 1,
    paddingTop: spacing.lg,
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
  levelsContainer: {
    gap: spacing.md,
  },
  levelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border.primary,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    gap: spacing.md,
  },
  levelCardSelected: {
    borderColor: colors.brand.gold,
    backgroundColor: 'rgba(201, 162, 39, 0.1)',
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: colors.border.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainerSelected: {
    borderColor: colors.brand.gold,
    backgroundColor: 'rgba(201, 162, 39, 0.15)',
  },
  levelInfo: {
    flex: 1,
  },
  levelName: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
    color: colors.text.primary,
    marginBottom: 4,
  },
  levelNameSelected: {
    color: colors.brand.goldLight,
  },
  levelDescription: {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 18,
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
});
