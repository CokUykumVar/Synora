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

const REMINDER_TIMES = [
  { id: 'morning', time: '09:00', icon: 'sunny-outline' },
  { id: 'noon', time: '12:00', icon: 'partly-sunny-outline' },
  { id: 'afternoon', time: '15:00', icon: 'cafe-outline' },
  { id: 'evening', time: '18:00', icon: 'moon-outline' },
  { id: 'night', time: '21:00', icon: 'bed-outline' },
] as const;

type ReminderTimeType = typeof REMINDER_TIMES[number];

export default function HabitScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [selectedTime, setSelectedTime] = useState<ReminderTimeType | null>(REMINDER_TIMES[0]);

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
    // TODO: Save reminder preferences
    router.push('/saving');
  };

  const handleSkip = () => {
    router.push('/saving');
  };

  const handleBack = () => {
    router.back();
  };

  const toggleReminder = () => {
    setReminderEnabled(!reminderEnabled);
    if (reminderEnabled) {
      setSelectedTime(null);
    } else {
      setSelectedTime(REMINDER_TIMES[0]);
    }
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
            <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
              <Text style={styles.skipText}>{i18n.t('habit.skip')}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.iconWrapper}>
              <View style={styles.iconCircle}>
                <Ionicons name="notifications-outline" size={layout.isSmallDevice ? 36 : 48} color={colors.brand.gold} />
              </View>
            </View>

            <Text style={styles.title}>{i18n.t('habit.title')}</Text>
            <Text style={styles.subtitle}>{i18n.t('habit.subtitle')}</Text>

            <TouchableOpacity
              style={[styles.toggleCard, reminderEnabled && styles.toggleCardActive]}
              onPress={toggleReminder}
              activeOpacity={0.7}
            >
              <View style={styles.toggleInfo}>
                <Ionicons
                  name={reminderEnabled ? 'notifications' : 'notifications-off-outline'}
                  size={22}
                  color={reminderEnabled ? colors.brand.gold : colors.text.secondary}
                />
                <View style={styles.toggleTextContainer}>
                  <Text style={[styles.toggleTitle, reminderEnabled && styles.toggleTitleActive]}>
                    {i18n.t('habit.dailyReminder')}
                  </Text>
                  <Text style={styles.toggleDescription}>
                    {i18n.t('habit.reminderDescription')}
                  </Text>
                </View>
              </View>
              <View style={[styles.toggle, reminderEnabled && styles.toggleActive]}>
                <View style={[styles.toggleThumb, reminderEnabled && styles.toggleThumbActive]} />
              </View>
            </TouchableOpacity>

            {reminderEnabled && (
              <Animated.View style={styles.timesContainer}>
                <Text style={styles.timesLabel}>{i18n.t('habit.selectTime')}</Text>
                <View style={styles.timesGrid}>
                  {REMINDER_TIMES.map((time) => {
                    const isSelected = selectedTime?.id === time.id;
                    return (
                      <TouchableOpacity
                        key={time.id}
                        style={[styles.timeCard, isSelected && styles.timeCardSelected]}
                        onPress={() => setSelectedTime(time)}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name={time.icon as any}
                          size={layout.isSmallDevice ? 16 : 20}
                          color={isSelected ? colors.brand.gold : colors.text.secondary}
                        />
                        <Text style={[styles.timeText, isSelected && styles.timeTextSelected]}>
                          {time.time}
                        </Text>
                        <Text style={[styles.timeName, isSelected && styles.timeNameSelected]}>
                          {i18n.t(`habit.times.${time.id}`)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </Animated.View>
            )}

            <Text style={styles.hint}>{i18n.t('habit.hint')}</Text>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.continueButton}
              onPress={handleContinue}
              activeOpacity={0.7}
            >
              <Text style={styles.continueButtonText}>
                {i18n.t('habit.continue')}
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
  skipButton: {
    padding: spacing.xs,
  },
  skipText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  iconWrapper: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconCircle: {
    width: layout.isSmallDevice ? 70 : 90,
    height: layout.isSmallDevice ? 70 : 90,
    borderRadius: layout.isSmallDevice ? 35 : 45,
    backgroundColor: 'rgba(201, 162, 39, 0.1)',
    borderWidth: 1,
    borderColor: colors.brand.gold,
    justifyContent: 'center',
    alignItems: 'center',
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
    paddingHorizontal: spacing.sm,
  },
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: layout.isSmallDevice ? spacing.md : spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.primary,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    marginBottom: spacing.md,
  },
  toggleCardActive: {
    borderColor: colors.brand.gold,
    backgroundColor: 'rgba(201, 162, 39, 0.1)',
  },
  toggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
  },
  toggleTextContainer: {
    flex: 1,
  },
  toggleTitle: {
    fontFamily: fonts.semiBold,
    fontSize: layout.isSmallDevice ? fontSize.sm : fontSize.md,
    color: colors.text.primary,
    marginBottom: 2,
  },
  toggleTitleActive: {
    color: colors.brand.goldLight,
  },
  toggleDescription: {
    fontFamily: fonts.body,
    fontSize: layout.isSmallDevice ? fontSize.xs : fontSize.sm,
    color: colors.text.secondary,
  },
  toggle: {
    width: 46,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 2,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: colors.brand.gold,
  },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.text.secondary,
  },
  toggleThumbActive: {
    backgroundColor: colors.background.primary,
    alignSelf: 'flex-end',
  },
  timesContainer: {
    marginBottom: spacing.md,
  },
  timesLabel: {
    fontFamily: fonts.medium,
    fontSize: layout.isSmallDevice ? fontSize.xs : fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  timesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  timeCard: {
    width: '18%',
    aspectRatio: layout.isSmallDevice ? 0.9 : 0.8,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xs,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.primary,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    gap: 2,
  },
  timeCardSelected: {
    borderColor: colors.brand.gold,
    backgroundColor: 'rgba(201, 162, 39, 0.15)',
  },
  timeText: {
    fontFamily: fonts.semiBold,
    fontSize: layout.isSmallDevice ? fontSize.xs : fontSize.sm,
    color: colors.text.primary,
  },
  timeTextSelected: {
    color: colors.brand.goldLight,
  },
  timeName: {
    fontFamily: fonts.body,
    fontSize: layout.isSmallDevice ? 8 : 10,
    color: colors.text.muted,
    textAlign: 'center',
  },
  timeNameSelected: {
    color: colors.brand.goldLight,
  },
  hint: {
    fontFamily: fonts.body,
    fontSize: layout.isSmallDevice ? fontSize.xs : fontSize.sm,
    color: colors.text.muted,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  footer: {
    paddingBottom: layout.isSmallDevice ? spacing.md : spacing.lg,
    paddingTop: spacing.sm,
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
  continueButtonText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.brand.goldLight,
    letterSpacing: 1,
  },
});
