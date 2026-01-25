import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import i18n from '../src/i18n';
import { colors, fontSize, spacing, borderRadius, fonts } from '../src/constants/theme';

const { width } = Dimensions.get('window');

const CATEGORIES = [
  { id: 'all', icon: 'grid-outline' },
  { id: 'travel', icon: 'airplane-outline' },
  { id: 'food', icon: 'restaurant-outline' },
  { id: 'business', icon: 'briefcase-outline' },
  { id: 'technology', icon: 'laptop-outline' },
  { id: 'health', icon: 'fitness-outline' },
  { id: 'sports', icon: 'football-outline' },
  { id: 'music', icon: 'musical-notes-outline' },
];

const FEATURED_TOPICS = [
  { id: 'travel', wordCount: 150, progress: 45, color: '#4ECDC4' },
  { id: 'business', wordCount: 200, progress: 30, color: '#FF6B6B' },
  { id: 'technology', wordCount: 180, progress: 60, color: '#45B7D1' },
];

const POPULAR_WORDS = [
  { word: 'Adventure', translation: 'Macera', category: 'travel' },
  { word: 'Innovation', translation: 'Yenilik', category: 'technology' },
  { word: 'Delicious', translation: 'Lezzetli', category: 'food' },
  { word: 'Strategy', translation: 'Strateji', category: 'business' },
];

const NEW_TOPICS = [
  { id: 'entertainment', icon: 'film-outline', wordCount: 120, isNew: true },
  { id: 'nature', icon: 'leaf-outline', wordCount: 90, isNew: true },
  { id: 'shopping', icon: 'cart-outline', wordCount: 85, isNew: false },
  { id: 'family', icon: 'people-outline', wordCount: 110, isNew: false },
];

export default function ExploreScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <LinearGradient
      colors={colors.background.gradient.colors}
      locations={colors.background.gradient.locations}
      style={styles.container}
      start={{ x: 0.5, y: 0.35 }}
      end={{ x: 0.5, y: 1 }}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
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
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{i18n.t('explore.title')}</Text>
            <Text style={styles.headerSubtitle}>{i18n.t('explore.subtitle')}</Text>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={20} color={colors.text.muted} />
            <TextInput
              style={styles.searchInput}
              placeholder={i18n.t('explore.searchPlaceholder')}
              placeholderTextColor={colors.text.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={colors.text.muted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Categories */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{i18n.t('explore.categories')}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesContainer}
            >
              {CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryItem,
                    selectedCategory === category.id && styles.categoryItemActive,
                  ]}
                  onPress={() => setSelectedCategory(category.id)}
                >
                  <Ionicons
                    name={category.icon as any}
                    size={22}
                    color={selectedCategory === category.id ? colors.brand.gold : colors.text.secondary}
                  />
                  <Text
                    style={[
                      styles.categoryText,
                      selectedCategory === category.id && styles.categoryTextActive,
                    ]}
                  >
                    {i18n.t(`explore.categoryNames.${category.id}`)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Featured Topics */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{i18n.t('explore.featured')}</Text>
              <TouchableOpacity>
                <Text style={styles.seeAll}>{i18n.t('explore.seeAll')}</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featuredContainer}
            >
              {FEATURED_TOPICS.map((topic, index) => (
                <TouchableOpacity key={topic.id} style={styles.featuredCard}>
                  <LinearGradient
                    colors={[`${topic.color}30`, `${topic.color}10`]}
                    style={styles.featuredGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={[styles.featuredIcon, { backgroundColor: `${topic.color}40` }]}>
                      <Ionicons
                        name={CATEGORIES.find(c => c.id === topic.id)?.icon as any || 'book-outline'}
                        size={28}
                        color={topic.color}
                      />
                    </View>
                    <Text style={styles.featuredTitle}>
                      {i18n.t(`topicSelect.topics.${topic.id}`)}
                    </Text>
                    <Text style={styles.featuredCount}>
                      {topic.wordCount} {i18n.t('explore.words')}
                    </Text>
                    <View style={styles.featuredProgressContainer}>
                      <View style={styles.featuredProgressBg}>
                        <View
                          style={[
                            styles.featuredProgress,
                            { width: `${topic.progress}%`, backgroundColor: topic.color },
                          ]}
                        />
                      </View>
                      <Text style={styles.featuredProgressText}>{topic.progress}%</Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Popular Words */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{i18n.t('explore.popularWords')}</Text>
              <TouchableOpacity>
                <Text style={styles.seeAll}>{i18n.t('explore.seeAll')}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.wordsGrid}>
              {POPULAR_WORDS.map((item, index) => (
                <TouchableOpacity key={index} style={styles.wordCard}>
                  <Text style={styles.wordText}>{item.word}</Text>
                  <Text style={styles.translationText}>{item.translation}</Text>
                  <View style={styles.wordCategoryBadge}>
                    <Text style={styles.wordCategoryText}>
                      {i18n.t(`topicSelect.topics.${item.category}`)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* New & Recommended Topics */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{i18n.t('explore.newTopics')}</Text>
            </View>
            {NEW_TOPICS.map((topic) => (
              <TouchableOpacity key={topic.id} style={styles.topicRow}>
                <View style={styles.topicIconContainer}>
                  <Ionicons name={topic.icon as any} size={24} color={colors.brand.gold} />
                </View>
                <View style={styles.topicInfo}>
                  <View style={styles.topicTitleRow}>
                    <Text style={styles.topicTitle}>
                      {i18n.t(`topicSelect.topics.${topic.id}`)}
                    </Text>
                    {topic.isNew && (
                      <View style={styles.newBadge}>
                        <Text style={styles.newBadgeText}>{i18n.t('explore.new')}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.topicWordCount}>
                    {topic.wordCount} {i18n.t('explore.words')}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.text.muted} />
              </TouchableOpacity>
            ))}
          </View>

          {/* Quick Stats */}
          <View style={styles.quickStats}>
            <View style={styles.quickStatItem}>
              <Text style={styles.quickStatNumber}>12</Text>
              <Text style={styles.quickStatLabel}>{i18n.t('explore.topicsAvailable')}</Text>
            </View>
            <View style={styles.quickStatDivider} />
            <View style={styles.quickStatItem}>
              <Text style={styles.quickStatNumber}>1.2K+</Text>
              <Text style={styles.quickStatLabel}>{i18n.t('explore.wordsToLearn')}</Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} activeOpacity={0.7} onPress={() => router.push('/home')}>
          <Ionicons name="home-outline" size={24} color={colors.text.muted} />
          <Text style={styles.navLabel}>{i18n.t('home.nav.home')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} activeOpacity={0.7}>
          <Ionicons name="search" size={24} color={colors.brand.gold} />
          <Text style={[styles.navLabel, styles.navLabelActive]}>{i18n.t('home.nav.explore')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} activeOpacity={0.7} onPress={() => router.push('/stats')}>
          <Ionicons name="stats-chart-outline" size={24} color={colors.text.muted} />
          <Text style={styles.navLabel}>{i18n.t('home.nav.stats')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} activeOpacity={0.7} onPress={() => router.push('/settings')}>
          <Ionicons name="settings-outline" size={24} color={colors.text.muted} />
          <Text style={styles.navLabel}>{i18n.t('home.nav.settings')}</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  header: {
    paddingTop: 60,
    paddingBottom: spacing.lg,
  },
  headerTitle: {
    fontFamily: fonts.heading,
    fontSize: fontSize.xxl,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontFamily: fonts.body,
    fontSize: fontSize.md,
    color: colors.text.secondary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    borderWidth: 1,
    borderColor: colors.border.primary,
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: fontSize.md,
    color: colors.text.primary,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
    color: colors.text.primary,
  },
  seeAll: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: colors.brand.gold,
  },
  categoriesContainer: {
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  categoryItem: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: colors.border.primary,
    marginRight: spacing.sm,
    minWidth: 80,
  },
  categoryItemActive: {
    backgroundColor: 'rgba(201, 162, 39, 0.15)',
    borderColor: colors.brand.gold,
  },
  categoryText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.xs,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  categoryTextActive: {
    color: colors.brand.gold,
  },
  featuredContainer: {
    paddingVertical: spacing.sm,
  },
  featuredCard: {
    width: width * 0.55,
    marginRight: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  featuredGradient: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  featuredIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  featuredTitle: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  featuredCount: {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  featuredProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  featuredProgressBg: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  featuredProgress: {
    height: '100%',
    borderRadius: 3,
  },
  featuredProgressText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.xs,
    color: colors.text.secondary,
  },
  wordsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  wordCard: {
    width: (width - spacing.lg * 2 - spacing.md) / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  wordText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  translationText: {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  wordCategoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(201, 162, 39, 0.15)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  wordCategoryText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.xs,
    color: colors.brand.gold,
  },
  topicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  topicIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(201, 162, 39, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  topicInfo: {
    flex: 1,
  },
  topicTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  topicTitle: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text.primary,
  },
  newBadge: {
    backgroundColor: colors.brand.gold,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  newBadgeText: {
    fontFamily: fonts.semiBold,
    fontSize: 10,
    color: colors.background.primary,
    textTransform: 'uppercase',
  },
  topicWordCount: {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    color: colors.text.muted,
    marginTop: spacing.xs,
  },
  quickStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(201, 162, 39, 0.1)',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 39, 0.2)',
    marginBottom: spacing.lg,
  },
  quickStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  quickStatDivider: {
    width: 1,
    backgroundColor: 'rgba(201, 162, 39, 0.3)',
    marginHorizontal: spacing.md,
  },
  quickStatNumber: {
    fontFamily: fonts.heading,
    fontSize: fontSize.xxl,
    color: colors.brand.gold,
  },
  quickStatLabel: {
    fontFamily: fonts.body,
    fontSize: fontSize.xs,
    color: colors.text.secondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: 'rgba(11, 13, 16, 0.95)',
    borderTopWidth: 1,
    borderTopColor: colors.border.primary,
    paddingVertical: spacing.sm,
    paddingBottom: 30,
    paddingHorizontal: spacing.lg,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  navLabel: {
    fontFamily: fonts.medium,
    fontSize: fontSize.xs,
    color: colors.text.muted,
    marginTop: spacing.xs,
  },
  navLabelActive: {
    color: colors.brand.gold,
  },
});
