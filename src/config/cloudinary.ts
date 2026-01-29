// Cloudinary Configuration
// Get your cloud name from: https://cloudinary.com/console

export const CLOUDINARY_CONFIG = {
  cloudName: 'dauf0yueo', // Synora Cloudinary cloud name

  // Base URL for images
  get baseUrl() {
    return `https://res.cloudinary.com/${this.cloudName}/image/upload`;
  },

  // Folder structure in Cloudinary
  folders: {
    words: 'synora-words',      // Word images: synora-words/apple.webp
    categories: 'synora-categories',  // Category icons
  },

  // Image transformation presets
  transformations: {
    // Thumbnail for word cards (small, optimized)
    thumbnail: 'w_150,h_150,c_fill,f_auto,q_auto',

    // Medium size for learning screens
    medium: 'w_300,h_300,c_fill,f_auto,q_auto',

    // Large size for detail view
    large: 'w_600,h_600,c_fill,f_auto,q_auto',

    // Placeholder (very small, blurred)
    placeholder: 'w_20,h_20,c_fill,f_auto,q_10,e_blur:1000',
  },
};

/**
 * Generate Cloudinary URL for a word image
 * @param imageId - Image ID or public ID in Cloudinary
 * @param size - Size preset: 'thumbnail' | 'medium' | 'large' | 'placeholder'
 * @returns Full Cloudinary URL with transformations
 */
export function getWordImageUrl(
  imageId: string,
  size: 'thumbnail' | 'medium' | 'large' | 'placeholder' = 'medium'
): string {
  // If it's already a full URL, return as is
  if (imageId.startsWith('http://') || imageId.startsWith('https://')) {
    return imageId;
  }

  const transformation = CLOUDINARY_CONFIG.transformations[size];
  const folder = CLOUDINARY_CONFIG.folders.words;

  return `${CLOUDINARY_CONFIG.baseUrl}/${transformation}/${folder}/${imageId}`;
}

/**
 * Generate Cloudinary URL for a category icon
 */
export function getCategoryImageUrl(imageId: string): string {
  if (imageId.startsWith('http://') || imageId.startsWith('https://')) {
    return imageId;
  }

  const transformation = CLOUDINARY_CONFIG.transformations.medium;
  const folder = CLOUDINARY_CONFIG.folders.categories;

  return `${CLOUDINARY_CONFIG.baseUrl}/${transformation}/${folder}/${imageId}`;
}
