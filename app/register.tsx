import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import i18n from '../src/i18n';
import { colors, fontSize, spacing, borderRadius, fonts, layout } from '../src/constants/theme';

export default function RegisterScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  const handleRegister = () => {
    // TODO: Implement register logic
    router.replace('/home');
  };

  const handleLogin = () => {
    router.push('/email-login');
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
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
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

            <View style={styles.formContainer}>
              <Text style={styles.title}>{i18n.t('register.title')}</Text>
              <Text style={styles.subtitle}>{i18n.t('register.subtitle')}</Text>

              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color={colors.text.muted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={i18n.t('register.namePlaceholder')}
                  placeholderTextColor={colors.text.muted}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color={colors.text.muted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={i18n.t('register.emailPlaceholder')}
                  placeholderTextColor={colors.text.muted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.text.muted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={i18n.t('register.passwordPlaceholder')}
                  placeholderTextColor={colors.text.muted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                  <Ionicons
                    name={showPassword ? "eye-outline" : "eye-off-outline"}
                    size={20}
                    color={colors.text.muted}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.text.muted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={i18n.t('register.confirmPasswordPlaceholder')}
                  placeholderTextColor={colors.text.muted}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeButton}>
                  <Ionicons
                    name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                    size={20}
                    color={colors.text.muted}
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.registerButton}
                onPress={handleRegister}
                activeOpacity={0.7}
              >
                <Text style={styles.registerButtonText}>{i18n.t('register.registerButton')}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>{i18n.t('register.hasAccount')}</Text>
              <TouchableOpacity onPress={handleLogin}>
                <Text style={styles.loginText}>{i18n.t('register.login')}</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
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
    includeFontPadding: false,
  },
  placeholder: {
    width: 32,
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: layout.isSmallDevice ? spacing.lg : spacing.xl,
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
    marginBottom: spacing.xxl,
    letterSpacing: 1,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.primary,
    borderRadius: borderRadius.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: fontSize.md,
    color: colors.text.primary,
    paddingVertical: spacing.md + 2,
  },
  eyeButton: {
    padding: spacing.xs,
  },
  registerButton: {
    width: '100%',
    paddingVertical: spacing.md + 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.xl,
    borderWidth: 1.5,
    borderColor: colors.brand.gold,
    backgroundColor: 'rgba(201, 162, 39, 0.15)',
    marginTop: spacing.lg,
  },
  registerButtonText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.brand.goldLight,
    letterSpacing: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: layout.isSmallDevice ? spacing.lg : spacing.xl,
    gap: spacing.xs,
  },
  footerText: {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    color: colors.text.muted,
  },
  loginText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.sm,
    color: colors.brand.gold,
  },
});
