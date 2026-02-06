/**
 * Script to import NEW words from category files with automatic translation to 29 languages
 * Only imports words that don't already exist in words.ts
 *
 * File location: scripts/words/{category}.txt
 * Format (tab separated):
 * word	level
 * apple	beginner
 * wine	intermediate
 *
 * Categories: everyday_objects, food_drink, people_roles, actions, adjectives, emotions, nature_animals, travel, sports_hobbies
 * Levels: beginner, elementary, intermediate, advanced
 *
 * Usage:
 *   node scripts/import-with-translate.js food_drink      (import single category)
 *   node scripts/import-with-translate.js --all           (import all categories)
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Category to variable name mapping
const CATEGORY_MAP = {
  'everyday_objects': 'everydayObjectsWords',
  'food_drink': 'foodDrinkWords',
  'people_roles': 'peopleRolesWords',
  'actions': 'actionsWords',
  'adjectives': 'adjectivesWords',
  'emotions': 'emotionsWords',
  'nature_animals': 'natureAnimalsWords',
  'travel': 'travelWords',
  'sports_hobbies': 'sportsHobbiesWords',
};

const VALID_CATEGORIES = Object.keys(CATEGORY_MAP);
const VALID_LEVELS = ['beginner', 'elementary', 'intermediate', 'advanced'];

const wordsDir = path.join(__dirname, 'words');
const wordsFilePath = path.join(__dirname, '..', 'src', 'data', 'words.ts');

// Language codes for Google Translate
const LANG_MAP = {
  'en': 'en', 'tr': 'tr', 'de': 'de', 'es': 'es', 'fr': 'fr',
  'it': 'it', 'pt': 'pt', 'ru': 'ru', 'ja': 'ja', 'zh': 'zh-CN',
  'ko': 'ko', 'ar': 'ar', 'az': 'az', 'hr': 'hr', 'cs': 'cs',
  'da': 'da', 'nl': 'nl', 'fi': 'fi', 'el': 'el', 'hi': 'hi',
  'id': 'id', 'no': 'no', 'pl': 'pl', 'ro': 'ro', 'sv': 'sv',
  'th': 'th', 'uk': 'uk', 'ur': 'ur', 'vi': 'vi'
};

const arg = process.argv[2];
if (!arg) {
  console.log('Usage:');
  console.log('  node scripts/import-with-translate.js <category>   (import single category)');
  console.log('  node scripts/import-with-translate.js --all        (import all categories)');
  console.log('');
  console.log('Categories:', VALID_CATEGORIES.join(', '));
  process.exit(1);
}

// Google Translate API (free)
function translate(text, targetLang) {
  return new Promise((resolve, reject) => {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result && result[0] && result[0][0] && result[0][0][0]) {
            resolve(result[0][0][0]);
          } else {
            resolve(text);
          }
        } catch (e) {
          resolve(text);
        }
      });
    }).on('error', () => resolve(text));
  });
}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function translateWord(englishWord, retries = 3) {
  const translations = {};
  for (const [langCode, googleCode] of Object.entries(LANG_MAP)) {
    if (langCode === 'en') {
      translations[langCode] = { word: capitalize(englishWord) };
    } else {
      for (let attempt = 0; attempt < retries; attempt++) {
        try {
          const translated = await translate(englishWord, googleCode);
          translations[langCode] = { word: capitalize(translated) };
          await delay(80);
          break;
        } catch {
          if (attempt === retries - 1) {
            translations[langCode] = { word: capitalize(englishWord) };
          }
          await delay(500);
        }
      }
    }
  }
  return translations;
}

function capitalize(word) {
  if (!word) return word;
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function getExistingWords(content, category) {
  // Extract all English words for the given category
  const existing = new Set();
  const pattern = new RegExp(`category: '${category}'[\\s\\S]*?en: \\{ word: '([^']+)' \\}`, 'g');
  let match;
  while ((match = pattern.exec(content)) !== null) {
    existing.add(match[1].toLowerCase());
  }
  return existing;
}

function loadCategoryFile(category) {
  const filePath = path.join(wordsDir, `${category}.txt`);
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return [];
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.trim().split('\n');
  const words = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const separator = line.includes('\t') ? '\t' : ',';
    const values = line.split(separator).map(v => v.trim());

    if (values.length < 2) continue;

    const [word, level] = values;

    if (!VALID_LEVELS.includes(level)) {
      console.log(`Skipping "${word}": invalid level "${level}"`);
      continue;
    }

    words.push({ word, category, level });
  }

  return words;
}

function generateEntryString(wordData) {
  const transStr = Object.entries(wordData.translations)
    .map(([lang, data]) => `      ${lang}: { word: '${data.word.replace(/'/g, "\\'")}' }`)
    .join(',\n');

  return `  {
    id: '${wordData.id}',
    category: '${wordData.category}',
    level: '${wordData.level}',
    translations: {
${transStr}
    },
  }`;
}

async function main() {
  console.log('==================================================');
  console.log('SYNORA - Word Import (Only NEW words)');
  console.log('==================================================\n');

  const categoriesToImport = arg === '--all'
    ? VALID_CATEGORIES
    : [arg];

  for (const cat of categoriesToImport) {
    if (!VALID_CATEGORIES.includes(cat)) {
      console.log(`Invalid category: ${cat}`);
      console.log(`Valid categories: ${VALID_CATEGORIES.join(', ')}`);
      process.exit(1);
    }
  }

  let content = fs.readFileSync(wordsFilePath, 'utf-8');

  // Get max existing ID
  let currentId = 1;
  const idPattern = /id:\s*['"](\d+)['"]/g;
  let match;
  while ((match = idPattern.exec(content)) !== null) {
    currentId = Math.max(currentId, parseInt(match[1]) + 1);
  }

  console.log(`Starting ID: ${currentId}\n`);

  const startTime = Date.now();
  let totalNew = 0;
  let totalSkipped = 0;

  for (const cat of categoriesToImport) {
    const allWords = loadCategoryFile(cat);
    if (allWords.length === 0) continue;

    // Get existing words for this category
    const existingWords = getExistingWords(content, cat);

    // Filter to only new words
    const newWords = allWords.filter(w => !existingWords.has(w.word.toLowerCase()));

    console.log(`\n>>> ${cat} <<<`);
    console.log(`   Total in file: ${allWords.length}`);
    console.log(`   Already exists: ${allWords.length - newWords.length}`);
    console.log(`   New to import: ${newWords.length}`);

    if (newWords.length === 0) {
      console.log('   No new words to import.');
      totalSkipped += allWords.length;
      continue;
    }

    const varName = CATEGORY_MAP[cat];

    for (let i = 0; i < newWords.length; i++) {
      const w = newWords[i];
      totalNew++;
      process.stdout.write(`   [${i + 1}/${newWords.length}] ${w.word}...`);

      const translations = await translateWord(w.word);

      const entryData = {
        id: String(currentId),
        translations,
        category: w.category,
        level: w.level,
      };

      const entryString = generateEntryString(entryData);

      // Find the closing of the array and insert before it
      const arrayEndPattern = new RegExp(`(export const ${varName}: WordData\\[\\] = \\[[\\s\\S]*?)\\n\\];`);
      const arrayMatch = content.match(arrayEndPattern);

      if (arrayMatch) {
        const existingContent = arrayMatch[1];
        const hasEntries = existingContent.includes("id: '");
        const newContent = hasEntries
          ? `${existingContent},\n${entryString}\n];`
          : `${existingContent}\n${entryString}\n];`;
        content = content.replace(arrayEndPattern, newContent);
      }

      console.log(' ✓');
      currentId++;

      // Save periodically (every 10 words)
      if (totalNew % 10 === 0) {
        fs.writeFileSync(wordsFilePath, content, 'utf-8');
      }
    }

    // Save after each category
    fs.writeFileSync(wordsFilePath, content, 'utf-8');
    console.log(`   ${newWords.length} new words added to ${cat}`);
  }

  const elapsed = Math.round((Date.now() - startTime) / 1000);
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;

  console.log('\n==================================================');
  console.log(`COMPLETE!`);
  console.log(`   New words imported: ${totalNew}`);
  console.log(`   Skipped (existing): ${totalSkipped}`);
  console.log(`   Time: ${mins}m ${secs}s`);
  console.log('==================================================');
}

main().catch(console.error);
