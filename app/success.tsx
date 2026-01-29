import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import i18n from '../src/i18n';
import { colors, fontSize, spacing, borderRadius, fonts, layout } from '../src/constants/theme';

export default function SuccessScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const checkAnim = useRef(new Animated.Value(0)).current;
  const textAnim = useRef(new Animated.Value(0)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Confetti animations
  const confettiAnims = useRef(
    Array.from({ length: 12 }, () => ({
      translateY: new Animated.Value(-100),
      translateX: new Animated.Value(0),
      rotate: new Animated.Value(0),
      opacity: new Animated.Value(1),
    }))
  ).current;

  useEffect(() => {
    // Sequence of animations
    Animated.sequence([
      // Fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      // Scale up circle
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      // Check mark
      Animated.spring(checkAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      // Text
      Animated.timing(textAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      // Button
      Animated.spring(buttonAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse animation for the circle
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Confetti animation
    confettiAnims.forEach((anim, index) => {
      const delay = index * 80;
      const xOffset = (index % 2 === 0 ? 1 : -1) * (30 + Math.random() * 50);

      setTimeout(() => {
        Animated.parallel([
          Animated.timing(anim.translateY, {
            toValue: 400,
            duration: 2000,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(anim.translateX, {
            toValue: xOffset,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(anim.rotate, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(anim.opacity, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]).start();
      }, delay);
    });
  }, []);

  const handleStart = () => {
    router.replace('/home');
  };

  const confettiColors = [
    colors.brand.gold,
    colors.brand.goldLight,
    '#FFD700',
    '#FFA500',
    '#FF6B6B',
    '#4ECDC4',
  ];

  return (
    <LinearGradient
      colors={colors.background.gradient.colors}
      locations={colors.background.gradient.locations}
      style={styles.container}
      start={{ x: 0.5, y: 0.35 }}
      end={{ x: 0.5, y: 1 }}
    >
      {/* Confetti */}
      {confettiAnims.map((anim, index) => {
        const rotate = anim.rotate.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', `${360 + Math.random() * 360}deg`],
        });

        return (
          <Animated.View
            key={index}
            style={[
              styles.confetti,
              {
                left: `${15 + (index * 6)}%`,
                backgroundColor: confettiColors[index % confettiColors.length],
                opacity: anim.opacity,
                transform: [
                  { translateY: anim.translateY },
                  { translateX: anim.translateX },
                  { rotate },
                ],
              },
            ]}
          />
        );
      })}

      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <View style={styles.header}>
            <Text style={styles.logo}>SYNORA</Text>
          </View>

          <View style={styles.mainContent}>
            <Animated.View
              style={[
                styles.successCircle,
                {
                  transform: [
                    { scale: Animated.multiply(scaleAnim, pulseAnim) },
                  ],
                },
              ]}
            >
              <Animated.View
                style={{
                  transform: [{ scale: checkAnim }],
                  opacity: checkAnim,
                }}
              >
                <Ionicons name="checkmark" size={60} color={colors.brand.gold} />
              </Animated.View>
            </Animated.View>

            <Animated.View
              style={{
                opacity: textAnim,
                transform: [
                  {
                    translateY: textAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  },
                ],
              }}
            >
              <Text style={styles.title}>{i18n.t('success.title')}</Text>
              <Text style={styles.subtitle}>{i18n.t('success.subtitle')}</Text>
            </Animated.View>

            <Animated.View
              style={[
                styles.featuresContainer,
                {
                  opacity: textAnim,
                  transform: [
                    {
                      translateY: textAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [30, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={styles.featureRow}>
                <View style={styles.featureIcon}>
                  <Ionicons name="rocket-outline" size={20} color={colors.brand.gold} />
                </View>
                <Text style={styles.featureText}>{i18n.t('success.features.personalized')}</Text>
              </View>
              <View style={styles.featureRow}>
                <View style={styles.featureIcon}>
                  <Ionicons name="trophy-outline" size={20} color={colors.brand.gold} />
                </View>
                <Text style={styles.featureText}>{i18n.t('success.features.goals')}</Text>
              </View>
              <View style={styles.featureRow}>
                <View style={styles.featureIcon}>
                  <Ionicons name="sparkles-outline" size={20} color={colors.brand.gold} />
                </View>
                <Text style={styles.featureText}>{i18n.t('success.features.ready')}</Text>
              </View>
            </Animated.View>
          </View>

          <Animated.View
            style={[
              styles.footer,
              {
                opacity: buttonAnim,
                transform: [
                  {
                    translateY: buttonAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [30, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <TouchableOpacity
              style={styles.startButton}
              onPress={handleStart}
              activeOpacity={0.8}
            >
              <Text style={styles.startButtonText}>{i18n.t('success.start')}</Text>
              <Ionicons name="arrow-forward" size={20} color={colors.background.primary} />
            </TouchableOpacity>
          </Animated.View>
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
  confetti: {
    position: 'absolute',
    top: 100,
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  header: {
    alignItems: 'center',
    paddingTop: layout.headerPaddingTop,
    paddingBottom: spacing.xl,
  },
  logo: {
    fontFamily: fonts.logo,
    fontSize: 28,
    color: colors.brand.gold,
    letterSpacing: 4,
    includeFontPadding: false,
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: layout.isSmallDevice ? spacing.lg : spacing.xl,
  },
  successCircle: {
    width: layout.isSmallDevice ? 100 : 120,
    height: layout.isSmallDevice ? 100 : 120,
    borderRadius: layout.isSmallDevice ? 50 : 60,
    backgroundColor: 'rgba(201, 162, 39, 0.15)',
    borderWidth: 3,
    borderColor: colors.brand.gold,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontFamily: fonts.semiBold,
    fontSize: layout.isSmallDevice ? 24 : 28,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
    letterSpacing: 1,
    fontStyle: 'italic',
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: layout.isSmallDevice ? fontSize.sm : fontSize.md,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl * 2,
    letterSpacing: 1,
    fontStyle: 'italic',
    paddingHorizontal: spacing.lg,
  },
  featuresContainer: {
    width: '100%',
    gap: spacing.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.primary,
    gap: spacing.md,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(201, 162, 39, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text.primary,
  },
  footer: {
    paddingBottom: layout.isSmallDevice ? spacing.lg : spacing.xl,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md + 4,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.brand.gold,
  },
  startButtonText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: colors.background.primary,
    letterSpacing: 1,
  },
});
