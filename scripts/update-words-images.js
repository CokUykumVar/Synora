/**
 * Synora - Görsel Yollarını Güncelle
 * Üretilen görsellerin yollarını words.ts dosyasına ekler
 *
 * Kullanım: node update-words-images.js
 */

const fs = require('fs');
const path = require('path');

// Dosya yolları
const WORDS_TS_PATH = path.join(__dirname, '..', 'src', 'data', 'words.ts');
const IMAGES_DIR = path.join(__dirname, '..', 'assets', 'images', 'words');

function updateWordsWithImages() {
  console.log('Görsel yolları güncelleniyor...\n');

  // Mevcut görselleri listele
  if (!fs.existsSync(IMAGES_DIR)) {
    console.log('HATA: Görsel klasörü bulunamadı!');
    console.log(`Beklenen: ${IMAGES_DIR}`);
    return;
  }

  const images = fs.readdirSync(IMAGES_DIR).filter(f => f.endsWith('.png'));
  console.log(`${images.length} görsel bulundu.\n`);

  // ID -> dosya adı eşlemesi oluştur
  const imageMap = {};
  for (const img of images) {
    // Dosya adı formatı: 0001_bus.png
    const idMatch = img.match(/^(\d+)_/);
    if (idMatch) {
      const id = parseInt(idMatch[1], 10).toString(); // "0001" -> "1"
      imageMap[id] = img;
    }
  }

  console.log(`${Object.keys(imageMap).length} görsel eşleştirildi.\n`);

  // words.ts dosyasını oku
  let content = fs.readFileSync(WORDS_TS_PATH, 'utf-8');

  // Her kelime için image alanını güncelle/ekle
  let updateCount = 0;

  for (const [id, filename] of Object.entries(imageMap)) {
    const imagePath = `require('../../assets/images/words/${filename}')`;

    // Kelime bloğunu bul ve image ekle
    // Pattern: id: 'X', sonraki satırlarda category: '...' var, image yok veya var

    // Önce image alanı var mı kontrol et
    const hasImageRegex = new RegExp(
      `(id:\\s*'${id}',\\s*\\n\\s*category:[^}]+?)(?=translations:)`,
      'g'
    );

    const blockMatch = content.match(hasImageRegex);

    if (blockMatch) {
      // Eğer image: zaten varsa güncelle
      if (blockMatch[0].includes('image:')) {
        // Mevcut image'ı güncelle
        const updateRegex = new RegExp(
          `(id:\\s*'${id}',[\\s\\S]*?)image:\\s*require\\([^)]+\\)`,
          'g'
        );
        const newContent = content.replace(updateRegex, `$1image: ${imagePath}`);
        if (newContent !== content) {
          content = newContent;
          updateCount++;
        }
      } else {
        // image: ekle (category: satırından sonra)
        const addRegex = new RegExp(
          `(id:\\s*'${id}',\\s*\\n)(\\s*category:\\s*'[^']+',)`,
          'g'
        );
        const newContent = content.replace(
          addRegex,
          `$1$2\n    image: ${imagePath},`
        );
        if (newContent !== content) {
          content = newContent;
          updateCount++;
        }
      }
    }
  }

  // Dosyayı kaydet
  fs.writeFileSync(WORDS_TS_PATH, content, 'utf-8');

  console.log(`${updateCount} kelime güncellendi.`);
  console.log(`Kaydedildi: ${WORDS_TS_PATH}`);
}

// Çalıştır
updateWordsWithImages();
