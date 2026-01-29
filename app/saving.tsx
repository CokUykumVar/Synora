import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import i18n from '../src/i18n';
import { colors, fontSize, spacing, fonts, layout } from '../src/constants/theme';

const SAVE_ITEMS = [
  { id: 'language', icon: 'language-outline' },
  { id: 'level', icon: 'stats-chart-outline' },
  { id: 'goal', icon: 'flag-outline' },
  { id: 'topics', icon: 'albums-outline' },
  { id: 'reminder', icon: 'notifications-outline' },
] as const;

export default function SavingScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const itemAnims = useRef(SAVE_ITEMS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    // Initial fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // Spinning animation
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Animate items one by one
    const animateItems = async () => {
      for (let i = 0; i < SAVE_ITEMS.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 400));

        Animated.spring(itemAnims[i], {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }).start();

        setCurrentItemIndex(i);
        setCompletedItems(prev => new Set([...prev, SAVE_ITEMS[i].id]));
      }

      // Wait a bit then navigate
      await new Promise(resolve => setTimeout(resolve, 800));
      router.replace('/success');
    };

    animateItems();
  }, []);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <LinearGradient
      colors={colors.background.gradient.colors}
      locations={colors.background.gradient.locations}
      style={styles.container}
      start={{ x: 0.5, y: 0.35 }}
      end={{ x: 0.5, y: 1 }}
    >
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <View style={styles.header}>
            <Text style={styles.logo}>SYNORA</Text>
          </View>

          <View style={styles.mainContent}>
            <View style={styles.loaderContainer}>
              <Animated.View style={[styles.spinner, { transform: [{ rotate: spin }] }]}>
                <Ionicons name="sync-outline" size={40} color={colors.brand.gold} />
              </Animated.View>
            </View>

            <Text style={styles.title}>{i18n.t('saving.title')}</Text>
            <Text style={styles.subtitle}>{i18n.t('saving.subtitle')}</Text>

            <View style={styles.itemsContainer}>
              {SAVE_ITEMS.map((item, index) => {
                const isCompleted = completedItems.has(item.id);
                const scale = itemAnims[index].interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.5, 1],
                });

                return (
                  <Animated.View
                    key={item.id}
                    style={[
                      styles.itemRow,
                      {
                        opacity: itemAnims[index],
                        transform: [{ scale }],
                      },
                    ]}
                  >
                    <View style={[styles.itemIcon, isCompleted && styles.itemIconCompleted]}>
                      <Ionicons
                        name={item.icon as any}
                        size={20}
                        color={isCompleted ? colors.brand.gold : colors.text.secondary}
                      />
                    </View>
                    <Text style={[styles.itemText, isCompleted && styles.itemTextCompleted]}>
                      {i18n.t(`saving.items.${item.id}`)}
                    </Text>
                    {isCompleted && (
                      <View style={styles.checkIcon}>
                        <Ionicons name="checkmark-circle" size={20} color={colors.brand.gold} />
                      </View>
                    )}
                  </Animated.View>
                );
              })}
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>{i18n.t('saving.pleaseWait')}</Text>
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
    paddingBottom: spacing.md,
  },
  logo: {
    fontFamily: fonts.logo,
    fontSize: 24,
    color: colors.brand.gold,
    letterSpacing: 4,
    includeFontPadding: false,
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderContainer: {
    marginBottom: spacing.lg,
  },
  spinner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(201, 162, 39, 0.1)',
    borderWidth: 2,
    borderColor: colors.brand.gold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: fonts.semiBold,
    fontSize: layout.isSmallDevice ? 20 : 22,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.xs,
    letterSpacing: 1,
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
    paddingHorizontal: spacing.md,
  },
  itemsContainer: {
    width: '100%',
    gap: spacing.sm,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.primary,
    gap: spacing.sm,
  },
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  itemIconCompleted: {
    backgroundColor: 'rgba(201, 162, 39, 0.15)',
    borderColor: colors.brand.gold,
  },
  itemText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  itemTextCompleted: {
    color: colors.text.primary,
  },
  checkIcon: {
    marginLeft: 'auto',
  },
  footer: {
    paddingBottom: layout.isSmallDevice ? spacing.lg : spacing.xl,
    alignItems: 'center',
  },
  footerText: {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    color: colors.text.muted,
  },
});
