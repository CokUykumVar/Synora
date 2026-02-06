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

const MIN_TOPICS = 3;

const TOPICS = [
  { id: 'everyday_objects', icon: 'cube-outline' },
  { id: 'food_drink', icon: 'restaurant-outline' },
  { id: 'people_roles', icon: 'people-outline' },
  { id: 'actions', icon: 'flash-outline' },
  { id: 'adjectives', icon: 'color-palette-outline' },
  { id: 'emotions', icon: 'heart-outline' },
  { id: 'nature_animals', icon: 'leaf-outline' },
  { id: 'travel', icon: 'airplane-outline' },
  { id: 'sports_hobbies', icon: 'football-outline' },
] as const;

type TopicType = typeof TOPICS[number];

export default function TopicSelectScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(new Set());

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

  const toggleTopic = (topicId: string) => {
    setSelectedTopics((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(topicId)) {
        newSet.delete(topicId);
      } else {
        newSet.add(topicId);
      }
      return newSet;
    });
  };

  const handleContinue = () => {
    // TODO: Save selected topics
    router.push('/habit');
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

          <View style={styles.mainContent}>
            <Text style={styles.title}>{i18n.t('topicSelect.title')}</Text>
            <Text style={styles.subtitle}>{i18n.t('topicSelect.subtitle')}</Text>

            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.topicsContainer}
              showsVerticalScrollIndicator={false}
            >
              {TOPICS.map((topic) => {
                const isSelected = selectedTopics.has(topic.id);
                return (
                  <TouchableOpacity
                    key={topic.id}
                    style={[styles.topicCard, isSelected && styles.topicCardSelected]}
                    onPress={() => toggleTopic(topic.id)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.iconContainer, isSelected && styles.iconContainerSelected]}>
                      <Ionicons
                        name={topic.icon as any}
                        size={24}
                        color={isSelected ? colors.brand.gold : colors.text.secondary}
                      />
                    </View>
                    <Text style={[styles.topicName, isSelected && styles.topicNameSelected]}>
                      {i18n.t(`topicSelect.topics.${topic.id}`)}
                    </Text>
                    {isSelected && (
                      <View style={styles.checkContainer}>
                        <Ionicons name="checkmark" size={16} color={colors.brand.gold} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={[styles.hint, selectedTopics.size >= MIN_TOPICS && styles.hintSuccess]}>
              {selectedTopics.size < MIN_TOPICS
                ? i18n.t('topicSelect.hintMin', { count: selectedTopics.size, min: MIN_TOPICS })
                : i18n.t('topicSelect.hint', { count: selectedTopics.size })}
            </Text>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.continueButton, selectedTopics.size < MIN_TOPICS && styles.continueButtonDisabled]}
              onPress={handleContinue}
              activeOpacity={0.7}
              disabled={selectedTopics.size < MIN_TOPICS}
            >
              <Text style={[styles.continueButtonText, selectedTopics.size < MIN_TOPICS && styles.continueButtonTextDisabled]}>
                {i18n.t('topicSelect.continue')}
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
    paddingBottom: spacing.md,
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
  mainContent: {
    flex: 1,
    paddingTop: spacing.sm,
  },
  title: {
    fontFamily: fonts.semiBold,
    fontSize: layout.isSmallDevice ? 22 : 26,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
    letterSpacing: 2,
    fontStyle: 'italic',
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: layout.isSmallDevice ? fontSize.sm : fontSize.md,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    letterSpacing: 1,
    fontStyle: 'italic',
  },
  scrollView: {
    flex: 1,
  },
  topicsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: spacing.md,
  },
  topicCard: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginBottom: spacing.md,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border.primary,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    gap: spacing.sm,
  },
  topicCardSelected: {
    borderColor: colors.brand.gold,
    backgroundColor: 'rgba(201, 162, 39, 0.1)',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  topicName: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: colors.text.primary,
  },
  topicNameSelected: {
    color: colors.brand.goldLight,
  },
  checkContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(201, 162, 39, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hint: {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    color: colors.text.muted,
    textAlign: 'center',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  hintSuccess: {
    color: colors.brand.goldLight,
  },
  footer: {
    paddingBottom: layout.isSmallDevice ? spacing.lg : spacing.xl,
    paddingTop: spacing.md,
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
