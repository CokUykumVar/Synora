# SYNORA - Vocabulary Learning App Documentation

> Bu dosya, proje ile ilgili tum detaylari icerir. Claude ile devam ederken bu dosyayi okumasini isteyin.

## Proje Ozeti

**Synora**, React Native ve Expo ile gelistirilen premium bir kelime ogrenme uygulamasidir. Koyu tema ve altin vurgular ile luks bir tasarima sahiptir.

### Teknoloji Stack

| Teknoloji | Versiyon | Aciklama |
|-----------|----------|----------|
| React Native | 0.81.5 | Mobile framework |
| Expo | ~54.0.32 | Development platform |
| expo-router | ~6.0.22 | File-based routing |
| i18n-js | ^4.5.1 | Internationalization |
| expo-localization | ~17.0.8 | Device locale detection |
| AsyncStorage | 2.2.0 | Local storage |
| expo-linear-gradient | ~15.0.8 | Gradient backgrounds |

### Desteklenen Diller (29 Adet)

```
en, tr, de, es, fr, it, pt, ru, ja, zh, ko, ar, az,
hr, cs, da, nl, fi, el, hi, id, no, pl, ro, sv, th, uk, ur, vi
```

---

## Proje Yapisi

```
Synora/
├── app/                          # Expo Router sayfalar
│   ├── _layout.tsx               # Root layout (UserProvider)
│   ├── index.tsx                 # Splash screen
│   ├── onboarding.tsx            # Karsilama ekrani
│   ├── login.tsx                 # Giris secenekleri
│   ├── email-login.tsx           # Email ile giris
│   ├── register.tsx              # Kayit ekrani
│   ├── language-select.tsx       # Dil secimi
│   ├── level-select.tsx          # Seviye secimi
│   ├── daily-goal.tsx            # Gunluk hedef
│   ├── topic-select.tsx          # Konu secimi
│   ├── habit.tsx                 # Hatirlatici ayarlari
│   ├── saving.tsx                # Kaydetme animasyonu
│   ├── success.tsx               # Basarili ekrani
│   ├── home.tsx                  # Ana sayfa
│   ├── learn.tsx                 # OGRENME EKRANI (Ana ozellik)
│   ├── explore.tsx               # Kesif ekrani
│   ├── stats.tsx                 # Istatistikler
│   ├── profile.tsx               # Profil
│   └── settings.tsx              # Ayarlar
│
├── src/
│   ├── components/               # Paylasilan bilesenler
│   ├── constants/
│   │   └── theme.ts              # Renkler, fontlar, spacing
│   ├── context/
│   │   └── UserContext.tsx       # Kullanici tercihleri context
│   ├── data/
│   │   └── words.ts              # 29 dilde kelime verileri
│   ├── hooks/                    # Custom hooks
│   └── i18n/
│       ├── index.ts              # i18n yapilandirmasi
│       └── locales/              # 29 adet JSON ceviri dosyasi
│           ├── en.json
│           ├── tr.json
│           └── ... (27 daha)
│
├── assets/                       # Gorseller ve ikonlar
├── app.json                      # Expo yapilandirmasi
├── package.json                  # Bagimliliklar
└── tsconfig.json                 # TypeScript ayarlari
```

---

## Tema ve Tasarim Sistemi

### Renkler (`src/constants/theme.ts`)

```typescript
export const colors = {
  background: {
    primary: '#0B0D10',      // En koyu arka plan
    secondary: '#14161C',    // Ikincil arka plan
    tertiary: '#1A1E25',     // Kartlar icin
    card: '#1A1E25',
  },
  text: {
    primary: '#FFFFFF',      // Ana metin
    secondary: '#A0A0A0',    // Ikincil metin
    muted: '#6B6B6B',        // Soluk metin
  },
  brand: {
    gold: '#C9A227',         // ANA MARKA RENGI
    goldLight: '#E8D5A3',
    goldSoft: '#BFA054',
  },
  border: {
    primary: '#2A2D35',
    secondary: '#1F2228',
  },
  status: {
    success: '#4CAF50',      // Dogru cevap
    warning: '#FF9800',
    error: '#F44336',        // Yanlis cevap
    info: '#2196F3',
  },
};
```

### Fontlar

```typescript
export const fonts = {
  logo: 'JosefinSans-SemiBold',      // Logo icin
  heading: 'NotoSans-Bold',          // Basliklar
  body: 'NotoSans-Regular',          // Normal metin
  medium: 'NotoSans-Medium',
  semiBold: 'NotoSans-SemiBold',
  italic: 'PlayfairDisplay-Italic',
};
```

### Spacing

```typescript
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};
```

---

## Kullanici Tercihleri Sistemi

### UserContext (`src/context/UserContext.tsx`)

```typescript
interface UserPreferences {
  nativeLanguage: Language | null;     // Kullanicinin ana dili
  learningLanguage: Language | null;   // Ogrenilecek dil
  level: string | null;                // Seviye (beginner, elementary, etc.)
  dailyGoal: number;                   // Gunluk hedef (5, 10, 15, 20)
  selectedTopics: string[];            // Secilen konular
  reminderEnabled: boolean;            // Hatirlatici acik mi
  reminderTime: string | null;         // Hatirlatici saati
}

interface Language {
  code: string;      // 'en', 'tr', 'de', etc.
  name: string;      // 'English', 'Turkce', etc.
  nameEn: string;    // Ingilizce isim
  flag: string;      // Emoji bayrak
}
```

### Kullanim

```typescript
import { useUser } from '../src/context/UserContext';

function MyComponent() {
  const { preferences, setLearningLanguage, isLoading } = useUser();

  // preferences.learningLanguage?.code -> 'en'
  // preferences.learningLanguage?.name -> 'English'
  // preferences.learningLanguage?.flag -> '🇬🇧'
}
```

---

## Ogrenme Ekrani (learn.tsx) - ANA OZELLIK

### Fazlar (Phases)

```typescript
type LearningPhase = 'selection' | 'flashcard' | 'listening' | 'writing' | 'complete';
```

### 1. Selection (Kelime Secimi)

- Kullanici 5 kelime secene kadar devam eder
- Swipe gestures ile calisir:
  - **Saga kaydir**: "Biliyorum" - kelimeyi atla
  - **Sola kaydir**: "Ogrenmek istiyorum" - kelimeyi sec
- PanResponder ile swipe implementasyonu
- Progress dots ile secim durumu gosterilir

### 2. Flashcard (Gorsel Ogrenme)

- Gorsel + 4 secenekli coktan secmeli
- Dogru cevap yesil, yanlis kirmizi
- Skip butonu ile atlama
- Sonuclar takip edilir

### 3. Listening (Dinleme)

- Ses calma butonu (TODO: TTS implementasyonu)
- Cevirisi gosterilir
- 4 secenekli coktan secmeli
- ScrollView ile kayan icerik
- Kompakt tasarim

### 4. Writing (Yazma)

- Ceviri gosterilir
- Kullanici kelimeyi yazar
- Case-insensitive kontrol
- Dogru/yanlis geri bildirim
- Skip butonu

### 5. Complete (Tamamlandi)

- Kupa ikonu
- Her faz icin sonuclar:
  - Dogru sayisi
  - Atlanan sayisi
- Toplam yuzde hesaplama (sadece cevaplanan sorular uzerinden)
- "Tekrar Et" ve "Bitti" butonlari

### Sonuc Hesaplama

```typescript
const totalCorrect = flashcard.correct + listening.correct + writing.correct;
const totalSkipped = flashcard.skipped + listening.skipped + writing.skipped;
const totalAnswered = (selectedWords.length * 3) - totalSkipped;
const percentage = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
```

---

## Kelime Verileri (`src/data/words.ts`)

### Yapi

```typescript
interface WordData {
  id: string;
  translations: {
    [languageCode: string]: {
      word: string;
      pronunciation?: string;
      example?: string;
    };
  };
  image?: string;
  category: string;
}
```

### Mevcut Kelimeler (10 Adet - Travel Kategorisi)

1. Journey / Yolculuk
2. Adventure / Macera
3. Discover / Kesfetmek
4. Explore / Arastirmak
5. Destination / Varis noktasi
6. Passport / Pasaport
7. Luggage / Bagaj
8. Hotel / Otel
9. Airport / Havalimani
10. Ticket / Bilet

### Kullanim

```typescript
import { getWordsForLanguagePair } from '../src/data/words';

const words = getWordsForLanguagePair('en', 'tr');
// Returns:
// [{
//   id: '1',
//   word: 'Journey',
//   translation: 'Yolculuk',
//   pronunciation: '/ˈdʒɜːrni/',
//   example: 'Life is a journey...',
//   exampleTranslation: 'Hayat bir yolculuktur...',
//   category: 'travel'
// }, ...]
```

---

## i18n Sistemi

### Yapilandirma (`src/i18n/index.ts`)

```typescript
import { I18n } from 'i18n-js';
import { getLocales } from 'expo-localization';

const i18n = new I18n({...locales});

const deviceLocale = getLocales()[0]?.languageCode ?? 'en';
i18n.locale = deviceLocale;
i18n.enableFallback = true;
i18n.defaultLocale = 'en';

export default i18n;
```

### Kullanim

```typescript
import i18n from '../src/i18n';

// Basit kullanim
i18n.t('learn.title')  // "Learn" veya "Ogrenme"

// Degiskenli kullanim
i18n.t('learn.selectedCount', { count: 3, total: 5 })  // "3/5 words selected"
```

### Onemli Ceviri Anahtarlari

```json
{
  "learn": {
    "title": "Learn",
    "selectWords": "Select Words",
    "selectedCount": "{{count}}/{{total}} words selected",
    "wantToLearn": "Want to learn",
    "alreadyKnow": "Already know",
    "visualLearning": "Visual Learning",
    "audioLearning": "Audio Learning",
    "writingPractice": "Writing Practice",
    "selectCorrectWord": "Select the correct word",
    "skip": "Skip",
    "skipped": "skipped",
    "sessionComplete": "Session Complete!",
    "totalScore": "Total Score"
  }
}
```

---

## Bilinen Sorunlar ve Cozumler

### 1. PanResponder Closure Sorunu

**Sorun**: Swipe islemlerinde eski state degerlerinin kullanilmasi.

**Cozum**: useRef ile handler referanslarinin tutulmasi:

```typescript
const handleKnowWordRef = useRef(handleKnowWord);

useEffect(() => {
  handleKnowWordRef.current = handleKnowWord;
}, [handleKnowWord]);

const panResponder = useMemo(() =>
  PanResponder.create({
    onPanResponderRelease: (_, gesture) => {
      if (gesture.dx > SWIPE_THRESHOLD) {
        handleKnowWordRef.current();  // Ref uzerinden cagir
      }
    },
  }), [cardPosition]);
```

### 2. Butonlarin Ekrana Sigmamasi

**Sorun**: Dinleme ekraninda icerik tasiyordu.

**Cozum**: ScrollView eklenmesi ve kompakt tasarim:

```typescript
<ScrollView
  style={styles.exerciseContainer}
  contentContainerStyle={styles.listeningScrollContent}
  showsVerticalScrollIndicator={false}
>
  {/* Icerik */}
</ScrollView>
```

### 3. Gap Property Hatasi

**Sorun**: React Native'de `gap` property desteklenmiyor.

**Cozum**: `marginHorizontal` veya `marginVertical` kullanmak.

---

## Yapilacaklar (TODO)

### Yuksek Oncelik

1. **Text-to-Speech Implementasyonu**
   - Dinleme egzersizi icin ses calma
   - `expo-speech` veya `expo-av` kullanilabilir

2. **Daha Fazla Kelime Ekleme**
   - Diger kategoriler (food, business, technology, etc.)
   - Her kategori icin 20-30 kelime

3. **Gorseller Ekleme**
   - Gorsel ogrenme icin kelime gorselleri
   - Unsplash API veya statik gorseller

### Orta Oncelik

4. **Spaced Repetition System (SRS)**
   - Ogrenilen kelimeleri tekrar zamanlama
   - AsyncStorage ile ilerleme kaydi

5. **Firebase Entegrasyonu**
   - Kullanici kimlik dogrulama
   - Cloud sync

6. **Ses Kaydi**
   - Kullanicinin telaffuzunu kaydetmesi
   - Karsilastirma ozelligi

### Dusuk Oncelik

7. **Offline Mod**
   - Kelime verilerini cache'leme
   - Cevrimdisi calisma

8. **Gamification**
   - Rozetler ve oduller
   - Lider tablosu

---

## Calistirma Komutlari

```bash
# Bagimliliklari yukle
npm install

# Gelistirme sunucusunu baslat
npm start

# Android'de calistir
npm run android

# iOS'ta calistir
npm run ios

# Web'de calistir
npm run web
```

---

## Dosya Degisiklik Gecmisi

| Tarih | Dosya | Degisiklik |
|-------|-------|------------|
| Son | learn.tsx | Skip butonu, coktan secmeli dinleme, dil bazli kelime yukleme |
| Son | words.ts | 29 dil destegi, 10 kelime |
| Son | UserContext.tsx | Kullanici tercihleri yonetimi |
| Son | language-select.tsx | Context'e dil kaydetme |
| Son | _layout.tsx | UserProvider eklendi |
| Son | *.json (29 adet) | skip/skipped cevirileri |

---

## Onemli Notlar

1. **Premium Tema**: Tum tasarim koyu tema + altin vurgular uzerine kurulu. Renk degisikligi yaparken tutarliligi koruyun.

2. **29 Dil**: Yeni ozellik eklerken tum dillerde ceviri eklemeyi unutmayin.

3. **Kelime Verisi**: Yeni kategoriler eklerken `words.ts` dosyasindaki yapiya uygun sekilde ekleyin.

4. **Responsive Tasarim**: ScrollView ve flexible layout kullanin. Sabit yuksekliklerden kacinin.

5. **State Yonetimi**: Kullanici tercihleri `UserContext` ile, kelime verileri `words.ts` ile yonetilir.

---

*Bu dokuman Claude Code ile devam ederken referans olarak kullanilmalidir.*
