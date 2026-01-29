import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import i18n from '../src/i18n';
import { colors, fontSize, spacing, borderRadius, fonts, layout } from '../src/constants/theme';

export default function LoginScreen() {
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

  const handleGoogleLogin = () => {
    // TODO: Google login
    router.replace('/home');
  };

  const handleAppleLogin = () => {
    // TODO: Apple login
    router.replace('/home');
  };

  const handleEmailLogin = () => {
    // TODO: Navigate to email login screen
    router.push('/email-login');
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
            <Text style={styles.logo}>SYNORA</Text>
          </View>

          <View style={styles.messageContainer}>
            <Text style={styles.title}>{i18n.t('login.title')}</Text>
            <Text style={styles.subtitle}>{i18n.t('login.subtitle')}</Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={handleGoogleLogin}
              activeOpacity={0.7}
            >
              <Ionicons name="logo-google" size={20} color={colors.text.primary} />
              <Text style={styles.socialButtonText}>{i18n.t('login.google')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.socialButton}
              onPress={handleAppleLogin}
              activeOpacity={0.7}
            >
              <Ionicons name="logo-apple" size={22} color={colors.text.primary} />
              <Text style={styles.socialButtonText}>{i18n.t('login.apple')}</Text>
            </TouchableOpacity>

            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>{i18n.t('login.or')}</Text>
              <View style={styles.divider} />
            </View>

            <TouchableOpacity
              style={styles.emailButton}
              onPress={handleEmailLogin}
              activeOpacity={0.7}
            >
              <Text style={styles.emailButtonText}>{i18n.t('login.email')}</Text>
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
    alignItems: 'center',
    paddingTop: layout.headerPaddingTop,
  },
  logo: {
    fontFamily: fonts.logo,
    fontSize: layout.isSmallDevice ? 28 : 36,
    color: colors.brand.gold,
    letterSpacing: 4,
    includeFontPadding: false,
  },
  messageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: layout.isSmallDevice ? spacing.lg : 40,
  },
  title: {
    fontFamily: fonts.semiBold,
    fontSize: layout.isSmallDevice ? 24 : 28,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    letterSpacing: 2,
    fontStyle: 'italic',
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: layout.isSmallDevice ? fontSize.sm : fontSize.md,
    color: colors.text.secondary,
    textAlign: 'center',
    letterSpacing: 1.5,
    fontStyle: 'italic',
    paddingHorizontal: spacing.xl,
    lineHeight: 24,
  },
  buttonContainer: {
    gap: spacing.md,
    paddingBottom: layout.isSmallDevice ? spacing.lg : spacing.xl,
  },
  socialButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md + 4,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border.primary,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    gap: spacing.sm,
  },
  socialButtonText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text.primary,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border.primary,
  },
  dividerText: {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    color: colors.text.muted,
    marginHorizontal: spacing.md,
  },
  emailButton: {
    width: '100%',
    paddingVertical: spacing.md + 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.brand.gold,
    backgroundColor: 'rgba(201, 162, 39, 0.15)',
  },
  emailButtonText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.brand.goldLight,
    letterSpacing: 1,
  },
});
