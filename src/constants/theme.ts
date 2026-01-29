import { Platform, StatusBar, Dimensions } from 'react-native';
import Constants from 'expo-constants';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Get status bar height for different platforms
const getStatusBarHeight = (): number => {
  if (Platform.OS === 'ios') {
    // iOS devices with notch have higher status bar
    return Constants.statusBarHeight || 44;
  }
  // Android
  return StatusBar.currentHeight || Constants.statusBarHeight || 24;
};

// Responsive layout values
export const layout = {
  statusBarHeight: getStatusBarHeight(),
  headerPaddingTop: getStatusBarHeight() + 10,
  screenWidth: SCREEN_WIDTH,
  screenHeight: SCREEN_HEIGHT,
  isSmallDevice: SCREEN_WIDTH < 375,
  isMediumDevice: SCREEN_WIDTH >= 375 && SCREEN_WIDTH < 414,
  isLargeDevice: SCREEN_WIDTH >= 414,
};

export const colors = {
  background: {
    primary: '#0B0D10',
    secondary: '#14161C',
    tertiary: '#1A1E25',
    card: '#1A1E25',
    gradient: {
      colors: ['#1A1E25', '#14161C', '#0E0E11', '#0B0D10'],
      locations: [0, 0.3, 0.7, 1],
    },
  },
  text: {
    primary: '#FFFFFF',
    secondary: '#A0A0A0',
    muted: '#6B6B6B',
  },
  brand: {
    gold: '#C9A227',
    goldLight: '#E8D5A3',
    goldSoft: '#BFA054',
  },
  accent: {
    primary: '#C9A227',
    secondary: '#BFA054',
  },
  border: {
    primary: '#2A2D35',
    secondary: '#1F2228',
  },
  status: {
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
    info: '#2196F3',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  display: 48,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const fonts = {
  logo: 'JosefinSans-SemiBold',
  heading: 'NotoSans-Bold',
  body: 'NotoSans-Regular',
  medium: 'NotoSans-Medium',
  semiBold: 'NotoSans-SemiBold',
  italic: 'PlayfairDisplay-Italic',
  italicMedium: 'PlayfairDisplay-MediumItalic',
};
