// Bunny.net CDN Configuration
// Setup: https://bunny.net

export const BUNNY_CONFIG = {
  // Bunny.net Pull Zone URL
  cdnUrl: 'https://synora-images.b-cdn.net',

  // Folder structure
  folders: {
    words: 'words',           // Word images: words/apple.webp
    categories: 'categories', // Category icons
  },

  // Image sizes (width in pixels)
  sizes: {
    thumbnail: 150,
    medium: 300,
    large: 600,
  },
};

/**
 * Generate Bunny CDN URL for a word image
 * Uses Bunny Optimizer for automatic resizing and format conversion
 *
 * @param imageId - Image filename (e.g., 'apple.webp' or 'apple')
 * @param size - Size preset: 'thumbnail' | 'medium' | 'large'
 * @returns Full Bunny CDN URL with optimization parameters
 */
export function getWordImageUrl(
  imageId: string,
  size: 'thumbnail' | 'medium' | 'large' = 'medium'
): string {
  // If it's already a full URL, return as is
  if (imageId.startsWith('http://') || imageId.startsWith('https://')) {
    return imageId;
  }

  // Ensure the image has an extension (default to .jpg)
  const imageName = imageId.includes('.') ? imageId : `${imageId}.jpg`;

  const folder = BUNNY_CONFIG.folders.words;

  // Bunny CDN URL
  return `${BUNNY_CONFIG.cdnUrl}/${folder}/${imageName}`;
}

/**
 * Generate image filename from English word
 * "Meeting Room" → "meeting-room.jpg"
 * "Apple" → "apple.jpg"
 */
export function wordToImageName(englishWord: string): string {
  return englishWord
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')          // Replace spaces with dashes
    + '.jpg';
}

/**
 * Generate Bunny CDN URL for a category icon
 */
export function getCategoryImageUrl(imageId: string): string {
  if (imageId.startsWith('http://') || imageId.startsWith('https://')) {
    return imageId;
  }

  const imageName = imageId.includes('.') ? imageId : `${imageId}.webp`;
  const width = BUNNY_CONFIG.sizes.medium;
  const folder = BUNNY_CONFIG.folders.categories;

  return `${BUNNY_CONFIG.cdnUrl}/${folder}/${imageName}?width=${width}&aspect_ratio=1:1`;
}

/**
 * Get placeholder/blur URL for progressive loading
 */
export function getPlaceholderUrl(imageId: string): string {
  if (imageId.startsWith('http://') || imageId.startsWith('https://')) {
    return imageId;
  }

  const imageName = imageId.includes('.') ? imageId : `${imageId}.jpg`;
  const folder = BUNNY_CONFIG.folders.words;

  // Same URL for now (Bunny Optimizer can add ?width=20 if enabled)
  return `${BUNNY_CONFIG.cdnUrl}/${folder}/${imageName}`;
}
