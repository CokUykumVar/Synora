/**
 * Script to import words from CSV with automatic translation
 *
 * Usage: node scripts/import-with-translate.js words.csv
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const csvFilePath = process.argv[2];
if (!csvFilePath) {
  console.log('Usage: node scripts/import-with-translate.js <csv-file>');
  process.exit(1);
}

const wordsFilePath = path.join(__dirname, '..', 'src', 'data', 'words.ts');

// Language codes
const LANG_MAP = {
  'en': 'en', 'tr': 'tr', 'de': 'de', 'es': 'es', 'fr': 'fr',
  'it': 'it', 'pt': 'pt', 'ru': 'ru', 'ja': 'ja', 'zh': 'zh-CN',
  'ko': 'ko', 'ar': 'ar', 'az': 'az', 'hr': 'hr', 'cs': 'cs',
  'da': 'da', 'nl': 'nl', 'fi': 'fi', 'el': 'el', 'hi': 'hi',
  'id': 'id', 'no': 'no', 'pl': 'pl', 'ro': 'ro', 'sv': 'sv',
  'th': 'th', 'uk': 'uk', 'ur': 'ur', 'vi': 'vi'
};

const categoryArrays = {
  travel: 'travelWords',
  food: 'foodWords',
  business: 'businessWords',
  technology: 'technologyWords',
  health: 'healthWords',
  sports: 'sportsWords',
  music: 'musicWords',
  entertainment: 'entertainmentWords',
  nature: 'natureWords',
  shopping: 'shoppingWords',
  family: 'familyWords',
  education: 'educationWords',
};

// Google Translate API (free)
function translate(text, targetLang) {
  return new Promise((resolve) => {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result[0][0][0]);
        } catch (e) {
          resolve(text);
        }
      });
    }).on('error', () => resolve(text));
  });
}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function translateWord(englishWord) {
  const translations = {};
  for (const [langCode, googleCode] of Object.entries(LANG_MAP)) {
    if (langCode === 'en') {
      translations[langCode] = englishWord;
    } else {
      try {
        translations[langCode] = await translate(englishWord, googleCode);
        await delay(50);
      } catch {
        translations[langCode] = englishWord;
      }
    }
  }
  return translations;
}

function capitalize(word) {
  if (!word) return word;
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function escapeWord(word) {
  // Capitalize first letter and escape single quotes
  return capitalize(word).replace(/'/g, "\\'");
}

async function main() {
  // Read CSV
  const csvContent = fs.readFileSync(csvFilePath, 'utf-8');
  const lines = csvContent.trim().split('\n');

  const wordsByCategory = {};
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    if (values.length < 4 || !values[0]) continue;
    const word = { word: values[0], category: values[1], level: values[2], image: values[3] };
    if (!wordsByCategory[word.category]) wordsByCategory[word.category] = [];
    wordsByCategory[word.category].push(word);
  }

  console.log('Words by category:');
  Object.keys(wordsByCategory).forEach(cat => console.log(`  ${cat}: ${wordsByCategory[cat].length}`));

  // Read words.ts
  let content = fs.readFileSync(wordsFilePath, 'utf-8');

  // Find max ID
  const idPattern = /id:\s*'(\d+)'/g;
  let maxId = 0, match;
  while ((match = idPattern.exec(content)) !== null) {
    maxId = Math.max(maxId, parseInt(match[1]));
  }
  console.log(`\nCurrent max ID: ${maxId}`);

  // Find insertion points
  const insertions = [];
  for (const category of Object.keys(wordsByCategory)) {
    const arrayName = categoryArrays[category];
    if (!arrayName) continue;

    const regex = new RegExp(`export const ${arrayName}: WordData\\[\\] = \\[`);
    const startMatch = content.match(regex);
    if (!startMatch) continue;

    const matchStart = content.indexOf(startMatch[0]);
    const startPos = matchStart + startMatch[0].length;

    let depth = 1, endPos = -1;
    for (let i = startPos; i < content.length; i++) {
      if (content[i] === '[') depth++;
      else if (content[i] === ']') { depth--; if (depth === 0) { endPos = i; break; } }
    }
    if (endPos === -1) continue;

    insertions.push({ category, arrayName, position: endPos, words: wordsByCategory[category] });
  }

  insertions.sort((a, b) => b.position - a.position);

  // Process each category
  let totalAdded = 0;
  for (const insertion of insertions) {
    console.log(`\nTranslating ${insertion.words.length} ${insertion.category} words...`);

    let newEntries = '';
    for (let i = 0; i < insertion.words.length; i++) {
      const word = insertion.words[i];
      maxId++;

      console.log(`  [${i + 1}/${insertion.words.length}] ${word.word}`);
      const translations = await translateWord(word.word);

      let translationsStr = '';
      for (const [lang, trans] of Object.entries(translations)) {
        translationsStr += `      ${lang}: { word: '${escapeWord(trans)}' },\n`;
      }

      newEntries += `
  {
    id: '${maxId}',
    category: '${word.category}',
    level: '${word.level}',
    image: 'synora-words/${word.image}',
    translations: {
${translationsStr}    },
  },`;
    }

    content = content.slice(0, insertion.position) + newEntries + content.slice(insertion.position);
    console.log(`✅ Added ${insertion.words.length} words to ${insertion.arrayName}`);
    totalAdded += insertion.words.length;

    // Save after each category
    fs.writeFileSync(wordsFilePath, content, 'utf-8');
  }

  console.log(`\n✅ Total: ${totalAdded} words added with translations!`);
}

main().catch(console.error);
