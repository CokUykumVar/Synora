// Shared language constants for the entire app
// All 29 supported languages

export interface Language {
  code: string;
  name: string;
  nameEn: string;
  flag: string;
}

export const LANGUAGES: Language[] = [
  { code: 'tr', name: 'Türkçe', nameEn: 'Turkish', flag: '🇹🇷' },
  { code: 'en', name: 'English', nameEn: 'English', flag: '🇬🇧' },
  { code: 'ar', name: 'العربية', nameEn: 'Arabic', flag: '🇸🇦' },
  { code: 'az', name: 'Azərbaycan', nameEn: 'Azerbaijani', flag: '🇦🇿' },
  { code: 'cs', name: 'Čeština', nameEn: 'Czech', flag: '🇨🇿' },
  { code: 'da', name: 'Dansk', nameEn: 'Danish', flag: '🇩🇰' },
  { code: 'de', name: 'Deutsch', nameEn: 'German', flag: '🇩🇪' },
  { code: 'el', name: 'Ελληνικά', nameEn: 'Greek', flag: '🇬🇷' },
  { code: 'es', name: 'Español', nameEn: 'Spanish', flag: '🇪🇸' },
  { code: 'fi', name: 'Suomi', nameEn: 'Finnish', flag: '🇫🇮' },
  { code: 'fr', name: 'Français', nameEn: 'French', flag: '🇫🇷' },
  { code: 'hi', name: 'हिन्दी', nameEn: 'Hindi', flag: '🇮🇳' },
  { code: 'hr', name: 'Hrvatski', nameEn: 'Croatian', flag: '🇭🇷' },
  { code: 'id', name: 'Indonesia', nameEn: 'Indonesian', flag: '🇮🇩' },
  { code: 'it', name: 'Italiano', nameEn: 'Italian', flag: '🇮🇹' },
  { code: 'ja', name: '日本語', nameEn: 'Japanese', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', nameEn: 'Korean', flag: '🇰🇷' },
  { code: 'nl', name: 'Nederlands', nameEn: 'Dutch', flag: '🇳🇱' },
  { code: 'no', name: 'Norsk', nameEn: 'Norwegian', flag: '🇳🇴' },
  { code: 'pl', name: 'Polski', nameEn: 'Polish', flag: '🇵🇱' },
  { code: 'pt', name: 'Português', nameEn: 'Portuguese', flag: '🇵🇹' },
  { code: 'ro', name: 'Română', nameEn: 'Romanian', flag: '🇷🇴' },
  { code: 'ru', name: 'Русский', nameEn: 'Russian', flag: '🇷🇺' },
  { code: 'sv', name: 'Svenska', nameEn: 'Swedish', flag: '🇸🇪' },
  { code: 'th', name: 'ไทย', nameEn: 'Thai', flag: '🇹🇭' },
  { code: 'uk', name: 'Українська', nameEn: 'Ukrainian', flag: '🇺🇦' },
  { code: 'ur', name: 'اردو', nameEn: 'Urdu', flag: '🇵🇰' },
  { code: 'vi', name: 'Tiếng Việt', nameEn: 'Vietnamese', flag: '🇻🇳' },
  { code: 'zh', name: '简体中文', nameEn: 'Chinese', flag: '🇨🇳' },
];

// TTS language codes for Azure Speech
export const LANGUAGE_TO_TTS: { [key: string]: string } = {
  en: 'en-US',
  tr: 'tr-TR',
  ar: 'ar-SA',
  az: 'az-AZ',
  cs: 'cs-CZ',
  da: 'da-DK',
  de: 'de-DE',
  el: 'el-GR',
  es: 'es-ES',
  fi: 'fi-FI',
  fr: 'fr-FR',
  hi: 'hi-IN',
  hr: 'hr-HR',
  id: 'id-ID',
  it: 'it-IT',
  ja: 'ja-JP',
  ko: 'ko-KR',
  nl: 'nl-NL',
  no: 'nb-NO',
  pl: 'pl-PL',
  pt: 'pt-PT',
  ro: 'ro-RO',
  ru: 'ru-RU',
  sv: 'sv-SE',
  th: 'th-TH',
  uk: 'uk-UA',
  ur: 'ur-PK',
  vi: 'vi-VN',
  zh: 'zh-CN',
};

// Helper functions
export const getLanguageByCode = (code: string): Language | undefined => {
  return LANGUAGES.find(lang => lang.code === code);
};

export const getLanguageName = (code: string): string => {
  return getLanguageByCode(code)?.name || code;
};

export const getLanguageFlag = (code: string): string => {
  return getLanguageByCode(code)?.flag || '🌐';
};

export const getTTSCode = (code: string): string => {
  return LANGUAGE_TO_TTS[code] || 'en-US';
};
