import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n, { changeLocale } from '../i18n';

interface LanguageContextType {
  locale: string;
  setLocale: (locale: string) => Promise<void>;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocaleState] = useState(i18n.locale);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSavedLanguage();
  }, []);

  const loadSavedLanguage = async () => {
    try {
      const savedLocale = await AsyncStorage.getItem('nativeLanguage');
      if (savedLocale) {
        changeLocale(savedLocale);
        setLocaleState(savedLocale);
      }
    } catch (error) {
      console.log('Error loading language:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setLocale = async (newLocale: string) => {
    try {
      await AsyncStorage.setItem('nativeLanguage', newLocale);
      changeLocale(newLocale);
      setLocaleState(newLocale);
    } catch (error) {
      console.log('Error saving language:', error);
    }
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, isLoading }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
