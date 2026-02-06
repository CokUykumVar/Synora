/**
 * Synora - Kelime Çıkarıcı
 * words.ts dosyasından kelimeleri JSON formatına çıkarır
 *
 * Kullanım: node extract-words.js
 * Çıktı: words-for-images.json
 */

const fs = require('fs');
const path = require('path');

// Dosya yolları
const WORDS_TS_PATH = path.join(__dirname, '..', 'src', 'data', 'words.ts');
const OUTPUT_PATH = path.join(__dirname, 'words-for-images.json');

function extractWords() {
  console.log('Kelimeler çıkarılıyor...\n');

  // words.ts dosyasını oku
  const content = fs.readFileSync(WORDS_TS_PATH, 'utf-8');

  const words = [];

  // Regex ile kelime bloklarını bul
  // Her kelime bloğu: { id: '...', category: '...', translations: { en: { word: '...' }, ... } }
  const wordBlockRegex = /\{\s*id:\s*'(\d+)',\s*category:\s*'([^']+)',[\s\S]*?translations:\s*\{([\s\S]*?)\}\s*,?\s*\}/g;

  let match;
  while ((match = wordBlockRegex.exec(content)) !== null) {
    const id = match[1];
    const category = match[2];
    const translationsBlock = match[3];

    // İngilizce kelimeyi bul
    const enMatch = translationsBlock.match(/en:\s*\{\s*word:\s*'([^']+)'/);
    const trMatch = translationsBlock.match(/tr:\s*\{\s*word:\s*'([^']+)'/);

    if (enMatch) {
      words.push({
        id: id,
        word_en: enMatch[1],
        word_tr: trMatch ? trMatch[1] : '',
        category: category
      });
    }
  }

  // Eğer regex çalışmazsa alternatif yöntem
  if (words.length === 0) {
    console.log('Alternatif çıkarma yöntemi deneniyor...');

    // Satır satır işle
    const lines = content.split('\n');
    let currentWord = null;

    for (const line of lines) {
      // Yeni kelime bloğu başlangıcı
      if (line.includes("id: '")) {
        const idMatch = line.match(/id:\s*'(\d+)'/);
        if (idMatch) {
          if (currentWord && currentWord.word_en) {
            words.push(currentWord);
          }
          currentWord = { id: idMatch[1], word_en: '', word_tr: '', category: '' };
        }
      }

      // Kategori
      if (currentWord && line.includes("category: '")) {
        const catMatch = line.match(/category:\s*'([^']+)'/);
        if (catMatch) {
          currentWord.category = catMatch[1];
        }
      }

      // İngilizce kelime
      if (currentWord && line.trim().startsWith('en:')) {
        const enMatch = line.match(/word:\s*'([^']+)'/);
        if (enMatch) {
          currentWord.word_en = enMatch[1];
        }
      }

      // Türkçe kelime
      if (currentWord && line.trim().startsWith('tr:')) {
        const trMatch = line.match(/word:\s*'([^']+)'/);
        if (trMatch) {
          currentWord.word_tr = trMatch[1];
        }
      }
    }

    // Son kelimeyi ekle
    if (currentWord && currentWord.word_en) {
      words.push(currentWord);
    }
  }

  console.log(`Toplam ${words.length} kelime bulundu.\n`);

  // Kategorilere göre grupla ve say
  const categories = {};
  for (const word of words) {
    categories[word.category] = (categories[word.category] || 0) + 1;
  }

  console.log('Kategoriler:');
  for (const [cat, count] of Object.entries(categories)) {
    console.log(`  ${cat}: ${count} kelime`);
  }

  // JSON olarak kaydet
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(words, null, 2), 'utf-8');
  console.log(`\nKaydedildi: ${OUTPUT_PATH}`);

  // Örnek çıktı göster
  console.log('\nÖrnek kelimeler:');
  words.slice(0, 5).forEach(w => {
    console.log(`  [${w.id}] ${w.word_en} (${w.word_tr}) - ${w.category}`);
  });

  return words;
}

// Çalıştır
extractWords();
