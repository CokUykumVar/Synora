import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { colors, fontSize, spacing, fonts } from '../constants/theme';

const { width } = Dimensions.get('window');

interface OnboardingSlideProps {
  title: string;
  description: string;
  index: number;
}

export default function OnboardingSlide({ title, description, index }: OnboardingSlideProps) {
  return (
    <View style={styles.slide}>
      <View style={styles.illustrationContainer}>
        <View style={styles.illustrationPlaceholder}>
          <Text style={styles.illustrationNumber}>{index + 1}</Text>
        </View>
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  slide: {
    width,
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  illustrationContainer: {
    flex: 0.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  illustrationPlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.border.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.brand.gold,
  },
  illustrationNumber: {
    fontFamily: fonts.logo,
    fontSize: 64,
    color: colors.brand.goldSoft,
  },
  textContainer: {
    flex: 0.3,
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: fontSize.xxl,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  description: {
    fontFamily: fonts.body,
    fontSize: fontSize.md,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});
