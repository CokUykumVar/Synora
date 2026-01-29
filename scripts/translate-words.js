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

  // Find words that have same text in all languages (not translated)
  // Pattern: words where en.word === tr.word === ja.word etc.
  const wordPattern = /{\s*id:\s*'(\d+)',[\s\S]*?translations:\s*{([\s\S]*?)}\s*,?\s*}/g;

  let match;
  let wordsToTranslate = [];

  while ((match = wordPattern.exec(content)) !== null) {
    const id = match[1];
    const translationsBlock = match[2];

    // Extract English word
    const enMatch = translationsBlock.match(/en:\s*{\s*word:\s*'([^']+)'/);
    if (!enMatch) continue;

    const englishWord = enMatch[1];

    // Check if Turkish is same as English (means not translated)
    const trMatch = translationsBlock.match(/tr:\s*{\s*word:\s*'([^']+)'/);
    if (trMatch && trMatch[1] === englishWord) {
      wordsToTranslate.push({ id, englishWord, fullMatch: match[0] });
    }
  }

  console.log(`Found ${wordsToTranslate.length} words to translate`);

  if (wordsToTranslate.length === 0) {
    console.log('All words are already translated!');
    return;
  }

  // Translate each word
  for (let i = 0; i < wordsToTranslate.length; i++) {
    const { id, englishWord, fullMatch } = wordsToTranslate[i];
    console.log(`[${i + 1}/${wordsToTranslate.length}] Translating: ${englishWord}`);

    let newTranslations = {};

    for (const [langCode, googleCode] of Object.entries(LANG_MAP)) {
      if (langCode === 'en') {
        newTranslations[langCode] = englishWord;
        continue;
      }

      try {
        const translated = await translate(englishWord, googleCode);
        newTranslations[langCode] = translated;
        await delay(100); // Small delay to avoid rate limiting
      } catch (e) {
        newTranslations[langCode] = englishWord;
      }
    }

    // Build new translations block
    let translationsStr = '';
    for (const [lang, word] of Object.entries(newTranslations)) {
      const escapedWord = word.replace(/'/g, "\\'");
      translationsStr += `      ${lang}: { word: '${escapedWord}' },\n`;
    }

    // Create new word block
    const idMatch = fullMatch.match(/id:\s*'(\d+)'/);
    const categoryMatch = fullMatch.match(/category:\s*'([^']+)'/);
    const levelMatch = fullMatch.match(/level:\s*'([^']+)'/);
    const imageMatch = fullMatch.match(/image:\s*'([^']+)'/);

    const newBlock = `{
    id: '${idMatch[1]}',
    category: '${categoryMatch[1]}',
    level: '${levelMatch ? levelMatch[1] : 'beginner'}',
    image: '${imageMatch ? imageMatch[1] : ''}',
    translations: {
${translationsStr}    },
  }`;

    // Replace in content
    content = content.replace(fullMatch, newBlock);

    // Save periodically
    if ((i + 1) % 10 === 0) {
      fs.writeFileSync(wordsFilePath, content, 'utf-8');
      console.log('  Progress saved...');
    }
  }

  // Final save
  fs.writeFileSync(wordsFilePath, content, 'utf-8');
  console.log(`\n✅ Translated ${wordsToTranslate.length} words to all 29 languages!`);
}

translateAllWords().catch(console.error);
