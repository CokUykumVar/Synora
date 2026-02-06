/**
 * Script to translate words using Google Translate (free)
 *
 * Usage: node scripts/translate-words.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const wordsFilePath = path.join(__dirname, '..', 'src', 'data', 'words.ts');

// Language codes mapping for Google Translate
const LANG_MAP = {
  'en': 'en', 'tr': 'tr', 'de': 'de', 'es': 'es', 'fr': 'fr',
  'it': 'it', 'pt': 'pt', 'ru': 'ru', 'ja': 'ja', 'zh': 'zh-CN',
  'ko': 'ko', 'ar': 'ar', 'az': 'az', 'hr': 'hr', 'cs': 'cs',
  'da': 'da', 'nl': 'nl', 'fi': 'fi', 'el': 'el', 'hi': 'hi',
  'id': 'id', 'no': 'no', 'pl': 'pl', 'ro': 'ro', 'sv': 'sv',
  'th': 'th', 'uk': 'uk', 'ur': 'ur', 'vi': 'vi'
};

const LANG_ORDER = ['en', 'tr', 'de', 'es', 'fr', 'it', 'pt', 'ru', 'ja', 'zh', 'ko', 'ar',
  'az', 'hr', 'cs', 'da', 'nl', 'fi', 'el', 'hi', 'id', 'no', 'pl', 'ro',
  'sv', 'th', 'uk', 'ur', 'vi'];

// Free Google Translate API
function translate(text, targetLang) {
  return new Promise((resolve, reject) => {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;

    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          const translated = result[0][0][0];
          resolve(translated);
        } catch (e) {
          resolve(text); // Return original on error
        }
      });
    }).on('error', () => resolve(text));
  });
}

// Delay function to avoid rate limiting
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function translateAllWords() {
  console.log('Reading words.ts...');
  let content = fs.readFileSync(wordsFilePath, 'utf-8');

  // Find all word entries that need translation
  // Match complete word objects including the trailing comma
  const wordPattern = /\{\s*id:\s*'(\d+)',\s*category:\s*'([^']+)',\s*level:\s*'([^']+)',\s*translations:\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\},?\s*\},?/g;

  let wordsToTranslate = [];
  let match;

  while ((match = wordPattern.exec(content)) !== null) {
    const id = match[1];
    const category = match[2];
    const level = match[3];
    const translationsBlock = match[4];

    // Extract English word
    const enMatch = translationsBlock.match(/en:\s*\{\s*word:\s*'([^']+)'/);
    if (!enMatch) continue;

    const englishWord = enMatch[1];

    // Check if Turkish is same as English (means not translated)
    const trMatch = translationsBlock.match(/tr:\s*\{\s*word:\s*'([^']+)'/);
    if (trMatch && trMatch[1] === englishWord) {
      wordsToTranslate.push({
        id,
        category,
        level,
        englishWord,
        fullMatch: match[0],
        startIndex: match.index,
        endIndex: match.index + match[0].length
      });
    }
  }

  console.log(`Found ${wordsToTranslate.length} words to translate`);

  if (wordsToTranslate.length === 0) {
    console.log('All words are already translated!');
    return;
  }

  // Process in reverse order to maintain correct indices
  wordsToTranslate.reverse();

  // Translate each word
  for (let i = 0; i < wordsToTranslate.length; i++) {
    const wordData = wordsToTranslate[i];
    const displayIndex = wordsToTranslate.length - i;
    console.log(`[${displayIndex}/${wordsToTranslate.length}] Translating: ${wordData.englishWord}`);

    let translations = {};

    for (const langCode of LANG_ORDER) {
      if (langCode === 'en') {
        translations[langCode] = wordData.englishWord;
        continue;
      }

      try {
        const googleCode = LANG_MAP[langCode];
        const translated = await translate(wordData.englishWord, googleCode);
        translations[langCode] = translated;
        await delay(100); // Small delay to avoid rate limiting
      } catch (e) {
        translations[langCode] = wordData.englishWord;
      }
    }

    // Build new translations block
    let translationsStr = '';
    for (const lang of LANG_ORDER) {
      const word = translations[lang];
      const escapedWord = word.replace(/'/g, "\\'");
      translationsStr += `      ${lang}: { word: '${escapedWord}' },\n`;
    }

    // Create new word block
    const newBlock = `{
    id: '${wordData.id}',
    category: '${wordData.category}',
    level: '${wordData.level}',
    translations: {
${translationsStr}    },
  },`;

    // Replace in content using indices
    content = content.substring(0, wordData.startIndex) + newBlock + content.substring(wordData.endIndex);

    // Save periodically
    if ((displayIndex) % 10 === 0) {
      fs.writeFileSync(wordsFilePath, content, 'utf-8');
      console.log('  Progress saved...');
    }
  }

  // Final save
  fs.writeFileSync(wordsFilePath, content, 'utf-8');
  console.log(`\n✅ Translated ${wordsToTranslate.length} words to all 29 languages!`);
}

translateAllWords().catch(console.error);
