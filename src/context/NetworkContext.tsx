import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Network from 'expo-network';
import { Ionicons } from '@expo/vector-icons';
import i18n from '../i18n';
import { colors, fonts, fontSize, spacing, borderRadius } from '../constants/theme';

const { width, height } = Dimensions.get('window');

interface NetworkContextType {
  isConnected: boolean;
  checkConnection: () => Promise<boolean>;
}

const NetworkContext = createContext<NetworkContextType>({
  isConnected: true,
  checkConnection: async () => true,
});

export const useNetwork = () => useContext(NetworkContext);

interface NetworkProviderProps {
  children: React.ReactNode;
}

export const NetworkProvider: React.FC<NetworkProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(true);
  const [showOverlay, setShowOverlay] = useState(false);
  const [showRestored, setShowRestored] = useState(false);
  const wasDisconnected = useRef(false);

  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const restoredOpacity = useRef(new Animated.Value(0)).current;
  const restoredSlide = useRef(new Animated.Value(-100)).current;
  const restoredScale = useRef(new Animated.Value(0.8)).current;

  const checkConnection = async (): Promise<boolean> => {
    try {
      const networkState = await Network.getNetworkStateAsync();
      const connected = networkState.isConnected === true && networkState.isInternetReachable === true;
      return connected;
    } catch (error) {
      console.log('Network check error:', error);
      return false;
    }
  };

  // Monitor network status
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const monitorNetwork = async () => {
      const connected = await checkConnection();

      if (!connected && isConnected) {
        // Connection lost
        setIsConnected(false);
        setShowOverlay(true);
        wasDisconnected.current = true;

        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      } else if (connected && !isConnected) {
        // Connection restored
        setIsConnected(true);

        // Hide overlay
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          setShowOverlay(false);
        });

        // Show "Connection restored" message if was disconnected
        if (wasDisconnected.current) {
          setShowRestored(true);
          restoredSlide.setValue(-100);
          restoredOpacity.setValue(0);
          restoredScale.setValue(0.8);

          Animated.parallel([
            Animated.timing(restoredOpacity, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.spring(restoredSlide, {
              toValue: 0,
              friction: 6,
              tension: 50,
              useNativeDriver: true,
            }),
            Animated.spring(restoredScale, {
              toValue: 1,
              friction: 5,
              tension: 60,
              useNativeDriver: true,
            }),
          ]).start();

          // Auto hide after 2.5 seconds
          setTimeout(() => {
            Animated.parallel([
              Animated.timing(restoredOpacity, {
                toValue: 0,
                duration: 400,
                useNativeDriver: true,
              }),
              Animated.timing(restoredSlide, {
                toValue: -50,
                duration: 400,
                useNativeDriver: true,
              }),
              Animated.timing(restoredScale, {
                toValue: 0.9,
                duration: 400,
                useNativeDriver: true,
              }),
            ]).start(() => {
              setShowRestored(false);
              wasDisconnected.current = false;
            });
          }, 2500);
        }
      }
    };

    // Initial check
    monitorNetwork();

    // Check every 3 seconds
    intervalId = setInterval(monitorNetwork, 3000);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isConnected]);

  return (
    <NetworkContext.Provider value={{ isConnected, checkConnection }}>
      {children}

      {/* No Internet Overlay */}
      {showOverlay && (
        <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
          <View style={styles.overlayContent}>
            <View style={styles.iconContainer}>
              <Ionicons name="cloud-offline-outline" size={48} color={colors.brand.gold} />
            </View>
            <Text style={styles.overlayTitle}>{i18n.t('common.noInternet')}</Text>
            <Text style={styles.overlayMessage}>{i18n.t('common.checkConnection')}</Text>
            <View style={styles.loadingDots}>
              <LoadingDots />
            </View>
          </View>
        </Animated.View>
      )}

      {/* Connection Restored Toast */}
      {showRestored && (
        <Animated.View
          style={[
            styles.restoredContainer,
            {
              opacity: restoredOpacity,
              transform: [
                { translateY: restoredSlide },
                { scale: restoredScale }
              ]
            }
          ]}
        >
          <LinearGradient
            colors={['rgba(76, 175, 80, 0.95)', 'rgba(56, 142, 60, 0.95)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.restoredGradient}
          >
            <View style={styles.restoredIconContainer}>
              <Ionicons name="wifi" size={24} color="#fff" />
            </View>
            <View style={styles.restoredTextContainer}>
              <Text style={styles.restoredTitle}>{i18n.t('common.connectionRestored')}</Text>
              <Text style={styles.restoredSubtitle}>{i18n.t('common.canContinue')}</Text>
            </View>
            <View style={styles.restoredCheckContainer}>
              <Ionicons name="checkmark-circle" size={28} color="#fff" />
            </View>
          </LinearGradient>
        </Animated.View>
      )}
    </NetworkContext.Provider>
  );
};

// Loading dots animation component
const LoadingDots: React.FC = () => {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animateDots = () => {
      const duration = 400;
      const delay = 150;

      Animated.loop(
        Animated.sequence([
          Animated.timing(dot1, { toValue: 1, duration, useNativeDriver: true }),
          Animated.timing(dot1, { toValue: 0.3, duration, useNativeDriver: true }),
        ])
      ).start();

      setTimeout(() => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(dot2, { toValue: 1, duration, useNativeDriver: true }),
            Animated.timing(dot2, { toValue: 0.3, duration, useNativeDriver: true }),
          ])
        ).start();
      }, delay);

      setTimeout(() => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(dot3, { toValue: 1, duration, useNativeDriver: true }),
            Animated.timing(dot3, { toValue: 0.3, duration, useNativeDriver: true }),
          ])
        ).start();
      }, delay * 2);
    };

    animateDots();
  }, []);

  return (
    <View style={styles.dotsContainer}>
      <Animated.View style={[styles.dot, { opacity: dot1 }]} />
      <Animated.View style={[styles.dot, { opacity: dot2 }]} />
      <Animated.View style={[styles.dot, { opacity: dot3 }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: width,
    height: height,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  overlayContent: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(201, 162, 39, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  overlayTitle: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.xl,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  overlayMessage: {
    fontFamily: fonts.body,
    fontSize: fontSize.md,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  loadingDots: {
    marginTop: spacing.md,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.brand.gold,
  },
  restoredContainer: {
    position: 'absolute',
    top: 50,
    left: spacing.md,
    right: spacing.md,
    zIndex: 9999,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  restoredGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.xl,
    gap: spacing.md,
  },
  restoredIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  restoredTextContainer: {
    flex: 1,
  },
  restoredTitle: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: '#fff',
  },
  restoredSubtitle: {
    fontFamily: fonts.body,
    fontSize: fontSize.xs,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  restoredCheckContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
