# Synora Changelog

## [2.0.0] - 2025-02-06

### 🔄 Büyük Değişiklikler

#### Kelime Veritabanı Yenilendi
- **16 kategoriden 9 kategoriye** düşürüldü (daha odaklı içerik)
- **2716 kelime** 29 dile çevrildi (Google Translate API)
- **405 loanword** silindi (Bikini, Pizza, Jeans vb. - çevrilmeyen kelimeler)
- **Son durum: 2311 kelime** x 29 dil = 67,019 çeviri

#### Yeni Kategori Yapısı
| Kategori | Kelime Sayısı |
|----------|---------------|
| everyday_objects | 472 |
| adjectives | 350 |
| nature_animals | 325 |
| travel | 317 |
| actions | 229 |
| sports_hobbies | 225 |
| people_roles | 148 |
| food_drink | 145 |
| emotions | 100 |

### 🐛 Düzeltilen Hatalar

#### Çeviri Sorunları
- **101 bileşik kelime** düzeltildi (örn: "Washingmachine" → "Washing machine")
- **79 Arapça "Com." hatası** düzeltildi (Google Translate bug'ı)
- Tüm dillerde çeviri tutarlılığı sağlandı

#### Uygulama Hataları
- Keşfet ekranı "Tümünü Gör" butonu çökme hatası düzeltildi
- words.ts'deki undefined array entries temizlendi

### 📁 Yeni Dosyalar ve Scriptler

#### Import Sistemi
- `scripts/import-with-translate.js` - Sadece YENİ kelimeleri import eder (akıllı import)
- `scripts/words/*.txt` - Kategori bazlı kelime listeleri (tab-separated)
- `scripts/check-translations.js` - Çeviri kalite kontrolü
- `scripts/list-words-for-images.js` - Resim eksiklerini listeler

#### Resim Yönetimi
- `assets/images/words/{category}/` - Kategori bazlı resim klasörleri
- `scripts/generate-images.py` - AI resim üretimi
- `scripts/extract-words-for-images.js` - Resim listesi çıkarma

### 🗑️ Silinen Dosyalar
- Eski kategori JSON dosyaları (`src/data/words/*.json`)
- Cloudinary config (bunny.ts ile değiştirildi)
- Gereksiz CSV template dosyaları

### 📋 Kelime Listesi Formatı

```
word	level
Chair	beginner
Table	beginner
Washing machine	intermediate
```

### 🔧 Kullanım

```bash
# Yeni kelime import et (sadece yeni kelimeler)
node scripts/import-with-translate.js food_drink
node scripts/import-with-translate.js --all

# Çeviri kontrolü
node scripts/check-translations.js

# Eksik resimleri listele
node scripts/list-words-for-images.js --missing
node scripts/list-words-for-images.js emotions
```

### 📊 Desteklenen Diller (29)
EN, TR, DE, ES, FR, IT, PT, RU, JA, ZH, KO, AR, AZ, HR, CS, DA, NL, FI, EL, HI, ID, NO, PL, RO, SV, TH, UK, UR, VI

---

## [1.0.0] - Önceki Sürüm
- İlk sürüm
- 16 kategori
- Temel kelime yapısı
