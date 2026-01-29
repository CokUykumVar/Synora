import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../src/i18n';
import { colors, fontSize, spacing, borderRadius, fonts, layout } from '../src/constants/theme';

export default function OnboardingScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

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

  const handleExplore = async () => {
    try {
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
      router.push('/language-select');
    } catch (error) {
      router.push('/language-select');
    }
  };

  const handleLogin = () => {
    router.push('/login');
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
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>SYNORA</Text>
            <Text style={styles.slogan}>{i18n.t('onboarding.slogan')}</Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.buttonPrimary}
              onPress={handleExplore}
              activeOpacity={0.7}
            >
              <Text style={styles.buttonTextPrimary}>{i18n.t('onboarding.explore')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.buttonSecondary}
              onPress={handleLogin}
              activeOpacity={0.7}
            >
              <Text style={styles.buttonTextSecondary}>{i18n.t('onboarding.login')}</Text>
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
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // Splash screen ile aynı pozisyon için
    marginBottom: layout.screenHeight * 0.1,
  },
  logo: {
    fontFamily: fonts.logo,
    fontSize: layout.isSmallDevice ? 56 : layout.isMediumDevice ? 64 : 72,
    color: colors.brand.gold,
    letterSpacing: layout.isSmallDevice ? 6 : 8,
    // Android font rendering düzeltmesi
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  slogan: {
    fontFamily: fonts.italic,
    fontSize: layout.isSmallDevice ? fontSize.md : fontSize.xl,
    color: colors.brand.goldLight,
    marginTop: layout.isSmallDevice ? spacing.lg : spacing.xxl,
    textAlign: 'center',
    letterSpacing: 2,
    opacity: 0.85,
    includeFontPadding: false,
  },
  buttonContainer: {
    gap: spacing.md,
    paddingBottom: layout.isSmallDevice ? spacing.lg : spacing.xl,
    paddingHorizontal: spacing.md,
  },
  buttonPrimary: {
    width: '100%',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9999,
    borderWidth: 1.5,
    borderColor: colors.brand.gold,
    backgroundColor: 'rgba(201, 162, 39, 0.15)',
  },
  buttonTextPrimary: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.brand.goldLight,
    letterSpacing: 1,
  },
  buttonSecondary: {
    width: '100%',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: colors.border.primary,
    backgroundColor: 'transparent',
  },
  buttonTextSecondary: {
    fontFamily: fonts.body,
    fontSize: fontSize.md,
    color: colors.text.secondary,
    letterSpacing: 1,
  },
});
