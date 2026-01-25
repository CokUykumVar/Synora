import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import { UserProvider } from '../src/context/UserContext';
import {
  NotoSans_400Regular,
  NotoSans_500Medium,
  NotoSans_600SemiBold,
  NotoSans_700Bold,
} from '@expo-google-fonts/noto-sans';
import {
  JosefinSans_400Regular,
  JosefinSans_500Medium,
  JosefinSans_600SemiBold,
  JosefinSans_700Bold,
} from '@expo-google-fonts/josefin-sans';
import {
  PlayfairDisplay_400Regular_Italic,
  PlayfairDisplay_500Medium_Italic,
} from '@expo-google-fonts/playfair-display';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        await Font.loadAsync({
          'NotoSans-Regular': NotoSans_400Regular,
          'NotoSans-Medium': NotoSans_500Medium,
          'NotoSans-SemiBold': NotoSans_600SemiBold,
          'NotoSans-Bold': NotoSans_700Bold,
          'JosefinSans-Regular': JosefinSans_400Regular,
          'JosefinSans-Medium': JosefinSans_500Medium,
          'JosefinSans-SemiBold': JosefinSans_600SemiBold,
          'JosefinSans-Bold': JosefinSans_700Bold,
          'PlayfairDisplay-Italic': PlayfairDisplay_400Regular_Italic,
          'PlayfairDisplay-MediumItalic': PlayfairDisplay_500Medium_Italic,
        });
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  useEffect(() => {
    if (appIsReady) {
      SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <UserProvider>
      <View style={{ flex: 1, backgroundColor: '#0B0D10' }}>
        <StatusBar style="light" />
        <Slot />
      </View>
    </UserProvider>
  );
}
