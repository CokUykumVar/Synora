import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Language {
  code: string;
  name: string;
  nameEn: string;
  flag: string;
}

interface UserPreferences {
  nativeLanguage: Language | null;
  learningLanguage: Language | null;
  level: string | null;
  dailyGoal: number;
  selectedTopics: string[];
  reminderEnabled: boolean;
  reminderTime: string | null;
}

interface UserContextType {
  preferences: UserPreferences;
  setNativeLanguage: (lang: Language) => Promise<void>;
  setLearningLanguage: (lang: Language) => Promise<void>;
  setLevel: (level: string) => Promise<void>;
  setDailyGoal: (goal: number) => Promise<void>;
  setSelectedTopics: (topics: string[]) => Promise<void>;
  setReminder: (enabled: boolean, time: string | null) => Promise<void>;
  loadPreferences: () => Promise<void>;
  isLoading: boolean;
}

const defaultPreferences: UserPreferences = {
  nativeLanguage: null,
  learningLanguage: null,
  level: null,
  dailyGoal: 10,
  selectedTopics: [],
  reminderEnabled: false,
  reminderTime: null,
};

const UserContext = createContext<UserContextType | undefined>(undefined);

const STORAGE_KEY = 'synora_user_preferences';

export function UserProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(true);

  // Ref to track latest preferences for sequential updates
  const preferencesRef = useRef<UserPreferences>(defaultPreferences);

  // Keep ref in sync with state
  useEffect(() => {
    preferencesRef.current = preferences;
  }, [preferences]);

  useEffect(() => {
    loadPreferences();
  }, []);

  const savePreferences = async (newPreferences: UserPreferences) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newPreferences));
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  };

  const loadPreferences = async () => {
    try {
      setIsLoading(true);
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const loadedPrefs = { ...defaultPreferences, ...parsed };
        setPreferences(loadedPrefs);
        preferencesRef.current = loadedPrefs;
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setNativeLanguage = async (lang: Language) => {
    const newPrefs = { ...preferencesRef.current, nativeLanguage: lang };
    preferencesRef.current = newPrefs;
    setPreferences(newPrefs);
    await savePreferences(newPrefs);
  };

  const setLearningLanguage = async (lang: Language) => {
    const newPrefs = { ...preferencesRef.current, learningLanguage: lang };
    preferencesRef.current = newPrefs;
    setPreferences(newPrefs);
    await savePreferences(newPrefs);
  };

  const setLevel = async (level: string) => {
    const newPrefs = { ...preferencesRef.current, level };
    preferencesRef.current = newPrefs;
    setPreferences(newPrefs);
    await savePreferences(newPrefs);
  };

  const setDailyGoal = async (goal: number) => {
    const newPrefs = { ...preferencesRef.current, dailyGoal: goal };
    preferencesRef.current = newPrefs;
    setPreferences(newPrefs);
    await savePreferences(newPrefs);
  };

  const setSelectedTopics = async (topics: string[]) => {
    const newPrefs = { ...preferencesRef.current, selectedTopics: topics };
    preferencesRef.current = newPrefs;
    setPreferences(newPrefs);
    await savePreferences(newPrefs);
  };

  const setReminder = async (enabled: boolean, time: string | null) => {
    const newPrefs = { ...preferencesRef.current, reminderEnabled: enabled, reminderTime: time };
    preferencesRef.current = newPrefs;
    setPreferences(newPrefs);
    await savePreferences(newPrefs);
  };

  return (
    <UserContext.Provider
      value={{
        preferences,
        setNativeLanguage,
        setLearningLanguage,
        setLevel,
        setDailyGoal,
        setSelectedTopics,
        setReminder,
        loadPreferences,
        isLoading,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
