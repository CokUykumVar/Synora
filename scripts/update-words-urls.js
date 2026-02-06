/**
 * Synora - Görsel URL'lerini words.ts'ye Ekle
 * generated-images.json'daki URL'leri words.ts dosyasına ekler
 *
 * Kullanım: node update-words-urls.js
 */

const fs = require('fs');
const path = require('path');

// Dosya yolları
const WORDS_TS_PATH = path.join(__dirname, '..', 'src', 'data', 'words.ts');
const GENERATED_JSON_PATH = path.join(__dirname, 'generated-images.json');

function updateWordsWithUrls() {
  console.log('Görsel URL\'leri words.ts\'ye ekleniyor...\n');

  // generated-images.json dosyasını oku
  if (!fs.existsSync(GENERATED_JSON_PATH)) {
    console.log('HATA: generated-images.json bulunamadı!');
    console.log('Önce "python generate-images.py" komutunu çalıştırın.');
    return;
  }

  const generated = JSON.parse(fs.readFileSync(GENERATED_JSON_PATH, 'utf-8'));
  const generatedCount = Object.keys(generated).length;
  console.log(`${generatedCount} görsel URL'i bulundu.\n`);

  if (generatedCount === 0) {
    console.log('Eklenecek URL yok.');
    return;
  }

  // words.ts dosyasını oku
  let content = fs.readFileSync(WORDS_TS_PATH, 'utf-8');

  let updateCount = 0;
  let skipCount = 0;

  // Her ID için URL ekle
  for (const [id, data] of Object.entries(generated)) {
    const url = data.url;

    // Zaten image alanı var mı kontrol et
    // Pattern: id: 'X', ve sonrasında image: var mı
    const hasImageRegex = new RegExp(
      `id:\\s*'${id}',[\\s\\S]*?image:\\s*['"]`,
      'g'
    );

    if (hasImageRegex.test(content)) {
      // Zaten var, güncelle
      const updateRegex = new RegExp(
        `(id:\\s*'${id}',[\\s\\S]*?)image:\\s*['"][^'"]*['"]`,
        'g'
      );
      const newContent = content.replace(updateRegex, `$1image: '${url}'`);

      if (newContent !== content) {
        content = newContent;
        updateCount++;
      } else {
        skipCount++;
      }
    } else {
      // image alanı yok, ekle (category satırından sonra)
      const addRegex = new RegExp(
        `(id:\\s*'${id}',\\s*\\n)(\\s*category:\\s*'[^']+',)`,
        'g'
      );

      const newContent = content.replace(
        addRegex,
        `$1$2\n    image: '${url}',`
      );

      if (newContent !== content) {
        content = newContent;
        updateCount++;
      } else {
        // Alternatif pattern dene (level satırı varsa)
        const addRegex2 = new RegExp(
          `(id:\\s*'${id}',\\s*\\n\\s*category:\\s*'[^']+',\\s*\\n)(\\s*level:)`,
          'g'
        );

        const newContent2 = content.replace(
          addRegex2,
          `$1    image: '${url}',\n$2`
        );

        if (newContent2 !== content) {
          content = newContent2;
          updateCount++;
        } else {
          console.log(`  Uyarı: ID ${id} için pattern bulunamadı`);
          skipCount++;
        }
      }
    }
  }

  // Dosyayı kaydet
  fs.writeFileSync(WORDS_TS_PATH, content, 'utf-8');

  console.log(`\n${'='.repeat(40)}`);
  console.log(`TAMAMLANDI!`);
  console.log(`Güncellenen: ${updateCount}`);
  console.log(`Atlanan: ${skipCount}`);
  console.log(`Kaydedildi: ${WORDS_TS_PATH}`);
}

// Çalıştır
updateWordsWithUrls();
