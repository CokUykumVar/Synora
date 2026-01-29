import React, { useState } from 'react';
import {
  View,
  Image,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  ImageStyle,
} from 'react-native';
import { getWordImageUrl } from '../config/cloudinary';
import { colors } from '../constants/theme';

interface WordImageProps {
  imageId: string;
  size?: 'thumbnail' | 'medium' | 'large';
  style?: ViewStyle;
  imageStyle?: ImageStyle;
  showPlaceholder?: boolean;
}

export default function WordImage({
  imageId,
  size = 'medium',
  style,
  imageStyle,
  showPlaceholder = true,
}: WordImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const imageUrl = getWordImageUrl(imageId, size);
  const placeholderUrl = showPlaceholder
    ? getWordImageUrl(imageId, 'placeholder')
    : null;

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  if (hasError) {
    return (
      <View style={[styles.container, styles.errorContainer, style]}>
        <View style={[styles.errorPlaceholder, imageStyle]}>
          {/* You can add an error icon here */}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {/* Placeholder/blur image */}
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
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.background.tertiary,
  },
});
