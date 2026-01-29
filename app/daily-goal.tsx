import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import i18n from '../src/i18n';
import { colors, fontSize, spacing, borderRadius, fonts, layout } from '../src/constants/theme';

const GOALS = [
  { id: 'casual', words: 5, monthly: 150, icon: 'cafe-outline' },
  { id: 'regular', words: 10, monthly: 300, icon: 'fitness-outline' },
  { id: 'serious', words: 15, monthly: 450, icon: 'flame-outline' },
  { id: 'intense', words: 20, monthly: 600, icon: 'flash-outline' },
] as const;

type GoalType = typeof GOALS[number];

export default function DailyGoalScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const [selectedGoal, setSelectedGoal] = useState<GoalType | null>(null);

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
    // TODO: Save daily goal preference
    router.push('/topic-select');
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
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
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

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.title}>{i18n.t('dailyGoal.title')}</Text>
            <Text style={styles.subtitle}>{i18n.t('dailyGoal.subtitle')}</Text>

            <View style={styles.goalsContainer}>
              {GOALS.map((goal) => {
                const isSelected = selectedGoal?.id === goal.id;
                return (
                  <TouchableOpacity
                    key={goal.id}
                    style={[styles.goalCard, isSelected && styles.goalCardSelected]}
                    onPress={() => setSelectedGoal(goal)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.iconContainer, isSelected && styles.iconContainerSelected]}>
                      <Ionicons
                        name={goal.icon as any}
                        size={layout.isSmallDevice ? 20 : 24}
                        color={isSelected ? colors.brand.gold : colors.text.secondary}
                      />
                    </View>
                    <View style={styles.goalInfo}>
                      <Text style={[styles.goalName, isSelected && styles.goalNameSelected]}>
                        {i18n.t(`dailyGoal.goals.${goal.id}.name`)}
                      </Text>
                      <Text style={styles.goalWords}>
                        {goal.words} {i18n.t('dailyGoal.wordsPerDay')}
                      </Text>
                    </View>
                    <View style={styles.monthlyBadge}>
                      <Text style={styles.monthlyText}>
                        {goal.monthly} {i18n.t('dailyGoal.perMonth')}
                      </Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={22} color={colors.brand.gold} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.hint}>{i18n.t('dailyGoal.hint')}</Text>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.continueButton, !selectedGoal && styles.continueButtonDisabled]}
              onPress={handleContinue}
              activeOpacity={0.7}
              disabled={!selectedGoal}
            >
              <Text style={[styles.continueButtonText, !selectedGoal && styles.continueButtonTextDisabled]}>
                {i18n.t('dailyGoal.continue')}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
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
    paddingTop: layout.headerPaddingTop,
    paddingBottom: spacing.sm,
  },
  backButton: {
    padding: spacing.xs,
  },
  logo: {
    fontFamily: fonts.logo,
    fontSize: 24,
    color: colors.brand.gold,
    letterSpacing: 3,
    includeFontPadding: false,
  },
  placeholder: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  title: {
    fontFamily: fonts.semiBold,
    fontSize: layout.isSmallDevice ? 20 : 24,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.xs,
    letterSpacing: 2,
    fontStyle: 'italic',
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: layout.isSmallDevice ? fontSize.xs : fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    letterSpacing: 1,
    fontStyle: 'italic',
  },
  goalsContainer: {
    gap: layout.isSmallDevice ? spacing.sm : spacing.md,
  },
  goalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: layout.isSmallDevice ? spacing.sm : spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.primary,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    gap: spacing.sm,
  },
  goalCardSelected: {
    borderColor: colors.brand.gold,
    backgroundColor: 'rgba(201, 162, 39, 0.1)',
  },
  iconContainer: {
    width: layout.isSmallDevice ? 38 : 44,
    height: layout.isSmallDevice ? 38 : 44,
    borderRadius: layout.isSmallDevice ? 19 : 22,
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
  goalInfo: {
    flex: 1,
  },
  goalName: {
    fontFamily: fonts.semiBold,
    fontSize: layout.isSmallDevice ? fontSize.sm : fontSize.md,
    color: colors.text.primary,
    marginBottom: 2,
  },
  goalNameSelected: {
    color: colors.brand.goldLight,
  },
  goalWords: {
    fontFamily: fonts.body,
    fontSize: layout.isSmallDevice ? fontSize.xs : fontSize.sm,
    color: colors.text.secondary,
  },
  monthlyBadge: {
    backgroundColor: 'rgba(201, 162, 39, 0.1)',
    paddingHorizontal: layout.isSmallDevice ? spacing.xs : spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  monthlyText: {
    fontFamily: fonts.medium,
    fontSize: layout.isSmallDevice ? 10 : fontSize.xs,
    color: colors.brand.goldLight,
  },
  hint: {
    fontFamily: fonts.body,
    fontSize: layout.isSmallDevice ? fontSize.xs : fontSize.sm,
    color: colors.text.muted,
    textAlign: 'center',
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  footer: {
    paddingTop: spacing.sm,
    paddingBottom: layout.isSmallDevice ? spacing.md : spacing.lg,
  },
  continueButton: {
    width: '100%',
    paddingVertical: layout.isSmallDevice ? spacing.md : spacing.md + 4,
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
