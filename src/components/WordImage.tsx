import React, { useState } from 'react';
import {
  View,
  Image,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  ImageStyle,
  Text,
} from 'react-native';
import { getWordImageUrl, getPlaceholderUrl } from '../config/bunny';
import { colors, borderRadius } from '../constants/theme';

interface WordImageProps {
  imageId: string;
  size?: 'thumbnail' | 'medium' | 'large';
  style?: ViewStyle;
  imageStyle?: ImageStyle;
  fallbackEmoji?: string;
  showPlaceholder?: boolean;
}

export default function WordImage({
  imageId,
  size = 'medium',
  style,
  imageStyle,
  fallbackEmoji = '📝',
  showPlaceholder = true,
}: WordImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const imageUrl = getWordImageUrl(imageId, size);
  const placeholderUrl = showPlaceholder ? getPlaceholderUrl(imageId) : null;

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  // Show emoji fallback on error
  if (hasError) {
    return (
      <View style={[styles.container, styles.fallbackContainer, style]}>
        <Text style={styles.fallbackEmoji}>{fallbackEmoji}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {/* Blur placeholder while loading */}
      {isLoading && placeholderUrl && (
        <Image
          source={{ uri: placeholderUrl }}
          style={[styles.image, styles.placeholder, imageStyle]}
          blurRadius={10}
        />
      )}

      {/* Main image */}
      <Image
        source={{ uri: imageUrl }}
        style={[
          styles.image,
          imageStyle,
          isLoading && styles.hidden,
        ]}
        onLoad={handleLoad}
        onError={handleError}
        resizeMode="cover"
      />

      {/* Loading indicator */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.brand.gold} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: colors.background.card,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  hidden: {
    opacity: 0,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.tertiary,
  },
  fallbackEmoji: {
    fontSize: 48,
  },
});
