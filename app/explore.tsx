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
import { useLanguage } from '../src/context/LanguageContext';
import { colors, fontSize, spacing, borderRadius, fonts, layout } from '../src/constants/theme';

const { width } = Dimensions.get('window');

const CATEGORIES = [
  { id: 'everyday_objects', icon: 'cube-outline', color: '#45B7D1' },
  { id: 'food_drink', icon: 'restaurant-outline', color: '#FF6B6B' },
  { id: 'people_roles', icon: 'people-outline', color: '#673AB7' },
  { id: 'actions', icon: 'flash-outline', color: '#FF5722' },
  { id: 'adjectives', icon: 'color-palette-outline', color: '#00BFA5' },
  { id: 'emotions', icon: 'heart-outline', color: '#F06292' },
  { id: 'nature_animals', icon: 'leaf-outline', color: '#8BC34A' },
  { id: 'travel', icon: 'airplane-outline', color: '#4ECDC4' },
  { id: 'sports_hobbies', icon: 'football-outline', color: '#E67E22' },
];

const FEATURED_TOPICS = [
  { id: 'travel', color: '#4ECDC4' },
  { id: 'food_drink', color: '#FF6B6B' },
  { id: 'everyday_objects', color: '#45B7D1' },
];

// Get daily topic based on current date (changes every day)
const getDailyTopic = () => {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
  );
  const index = dayOfYear % CATEGORIES.length;
  return CATEGORIES[index];
};


export default function ExploreScreen() {
  const router = useRouter();
  const { locale } = useLanguage(); // For re-render on language change
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const [searchQuery, setSearchQuery] = useState('');
  const dailyTopic = getDailyTopic();

  // Normalize string for search (handles all languages including Turkish, Arabic, CJK, Cyrillic)
  const normalizeForSearch = (str: string) => {
    // First handle Turkish specific cases before toLowerCase
    let normalized = str
      .replace(/İ/g, 'i')
      .replace(/I/g, 'ı');

    // Use locale-aware lowercase
    normalized = normalized.toLocaleLowerCase();

    // Normalize diacritics for Latin scripts (é→e, ñ→n, etc.)
    normalized = normalized
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    // Normalize Turkish ı to i for consistent matching
    normalized = normalized.replace(/ı/g, 'i');

    return normalized;
  };

  // Filter topics based on search query
  const normalizedQuery = searchQuery ? normalizeForSearch(searchQuery) : '';

  const filteredFeaturedTopics = FEATURED_TOPICS.filter((topic) => {
    if (!searchQuery) return true;
    // Search in both short category name and full topic name
    const categoryName = normalizeForSearch(i18n.t(`explore.categoryNames.${topic.id}`));
    const topicName = normalizeForSearch(i18n.t(`topicSelect.topics.${topic.id}`));
    return categoryName.includes(normalizedQuery) || topicName.includes(normalizedQuery);
  });

  const filteredCategories = CATEGORIES.filter((category) => {
    if (!searchQuery) return true;
    // Search in both short category name and full topic name
    const categoryName = normalizeForSearch(i18n.t(`explore.categoryNames.${category.id}`));
    const topicName = normalizeForSearch(i18n.t(`topicSelect.topics.${category.id}`));
    return categoryName.includes(normalizedQuery) || topicName.includes(normalizedQuery);
  });

  // Check if daily topic matches search
  const dailyTopicMatches = !searchQuery || (() => {
    const categoryName = normalizeForSearch(i18n.t(`explore.categoryNames.${dailyTopic.id}`));
    const topicName = normalizeForSearch(i18n.t(`topicSelect.topics.${dailyTopic.id}`));
    return categoryName.includes(normalizedQuery) || topicName.includes(normalizedQuery);
  })();

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
          {filteredCategories.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{i18n.t('explore.categories')}</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoriesContainer}
              >
                {filteredCategories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={styles.categoryItem}
                    activeOpacity={0.7}
                    onPress={() => router.push(`/topic?id=${category.id}`)}
                  >
                    <Ionicons
                      name={category.icon as any}
                      size={22}
                      color={colors.text.secondary}
                    />
                    <Text style={styles.categoryText}>
                      {i18n.t(`explore.categoryNames.${category.id}`)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* No Results */}
          {searchQuery.length > 0 && filteredCategories.length === 0 && filteredFeaturedTopics.length === 0 && !dailyTopicMatches && (
            <View style={styles.noResults}>
              <Ionicons name="search-outline" size={48} color={colors.text.muted} />
              <Text style={styles.noResultsText}>{i18n.t('explore.noResults')}</Text>
            </View>
          )}

          {/* Featured Topics */}
          {filteredFeaturedTopics.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{i18n.t('explore.featured')}</Text>
                <TouchableOpacity onPress={() => router.push('/categories')}>
                  <Text style={styles.seeAll}>{i18n.t('explore.seeAll')}</Text>
                </TouchableOpacity>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.featuredContainer}
              >
                {filteredFeaturedTopics.map((topic, index) => (
                  <TouchableOpacity key={topic.id} style={styles.featuredCard} onPress={() => router.push(`/topic?id=${topic.id}`)}>
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
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Topic of the Day */}
          {dailyTopicMatches && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{i18n.t('explore.topicOfTheDay')}</Text>
              <TouchableOpacity style={styles.dailyTopicCard} activeOpacity={0.8} onPress={() => router.push(`/topic?id=${dailyTopic.id}`)}>
                <LinearGradient
                  colors={[`${dailyTopic.color}40`, `${dailyTopic.color}10`]}
                  style={styles.dailyTopicGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.dailyTopicHeader}>
                    <View style={[styles.dailyTopicIcon, { backgroundColor: `${dailyTopic.color}30` }]}>
                      <Ionicons name={dailyTopic.icon as any} size={32} color={dailyTopic.color} />
                    </View>
                    <View style={[styles.dailyTopicBadge, { backgroundColor: dailyTopic.color }]}>
                      <Ionicons name="today-outline" size={14} color={colors.background.primary} />
                      <Text style={styles.dailyTopicBadgeText}>{i18n.t('explore.today')}</Text>
                    </View>
                  </View>
                  <Text style={styles.dailyTopicTitle}>{i18n.t(`topicSelect.topics.${dailyTopic.id}`)}</Text>
                  <Text style={styles.dailyTopicDesc}>{i18n.t('explore.topicOfTheDayDesc')}</Text>
                  <View style={styles.dailyTopicFooter}>
                    <View style={[styles.dailyTopicButton, { backgroundColor: dailyTopic.color }]}>
                      <Text style={styles.dailyTopicButtonText}>{i18n.t('explore.startNow')}</Text>
                      <Ionicons name="arrow-forward" size={16} color={colors.background.primary} />
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

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
    paddingTop: layout.headerPaddingTop,
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
  noResults: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
  },
  noResultsText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text.muted,
    marginTop: spacing.md,
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
  categoryText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.xs,
    color: colors.text.secondary,
    marginTop: spacing.xs,
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
  dailyTopicCard: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginTop: spacing.md,
  },
  dailyTopicGradient: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  dailyTopicHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  dailyTopicIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dailyTopicBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    gap: 4,
  },
  dailyTopicBadgeText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.xs,
    color: colors.background.primary,
  },
  dailyTopicTitle: {
    fontFamily: fonts.heading,
    fontSize: fontSize.xl,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  dailyTopicDesc: {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  dailyTopicFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dailyTopicButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  dailyTopicButtonText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.sm,
    color: colors.background.primary,
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
