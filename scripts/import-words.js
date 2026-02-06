/**
 * Script to import words from CSV to words.ts with all 29 languages
 *
 * CSV Format (image_name artık gerekli DEĞİL - otomatik oluşturuluyor):
 * word,category,level
 * apple,food,beginner
 * meeting,business,intermediate
 *
 * Resim Adlandırma (Bunny CDN):
 * - "apple" kelimesi için → apple.jpg yükle
 * - "credit card" kelimesi için → credit-card.jpg yükle
 * - Resimleri Bunny'ye words/ klasörüne yükle
 *
 * Usage: node scripts/import-words.js words.csv
 */

const fs = require('fs');
const path = require('path');

const csvFilePath = process.argv[2];
if (!csvFilePath) {
  console.log('Usage: node scripts/import-words.js <csv-file>');
  console.log('Example: node scripts/import-words.js my-words.csv');
  process.exit(1);
}

const wordsFilePath = path.join(__dirname, '..', 'src', 'data', 'words.ts');

// All 29 supported languages
const LANGUAGES = [
  'en', 'tr', 'de', 'es', 'fr', 'it', 'pt', 'ru', 'ja', 'zh', 'ko', 'ar',
  'az', 'hr', 'cs', 'da', 'nl', 'fi', 'el', 'hi', 'id', 'no', 'pl', 'ro',
  'sv', 'th', 'uk', 'ur', 'vi'
];

// Category to array name mapping
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
  verbs: 'verbsWords',
  adjectives: 'adjectivesWords',
  emotions: 'emotionsWords',
};

// Capitalize first letter of each word
function capitalizeWords(str) {
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// Read CSV
const csvContent = fs.readFileSync(csvFilePath, 'utf-8');
const lines = csvContent.trim().split('\n');

// Parse CSV rows and group by category
const wordsByCategory = {};
for (let i = 1; i < lines.length; i++) {
  const values = lines[i].split(',').map(v => v.trim());
  if (values.length < 3 || !values[0]) continue;

  const word = {
    word: capitalizeWords(values[0]),
    category: values[1],
    level: values[2] || 'intermediate'
  };

  if (!wordsByCategory[word.category]) {
    wordsByCategory[word.category] = [];
  }
  wordsByCategory[word.category].push(word);
}

console.log('Words by category:');
Object.keys(wordsByCategory).forEach(cat => {
  console.log(`  ${cat}: ${wordsByCategory[cat].length} words`);
});

// Read current words.ts
let wordsContent = fs.readFileSync(wordsFilePath, 'utf-8');

// Find the last ID in the file
const idPattern = /id:\s*'(\d+)'/g;
let maxId = 0;
let match;
while ((match = idPattern.exec(wordsContent)) !== null) {
  const id = parseInt(match[1]);
  if (id > maxId) maxId = id;
}
console.log(`\nCurrent max ID: ${maxId}`);

// Find all insertion points first (before modifying content)
const insertions = [];
for (const category of Object.keys(wordsByCategory)) {
  const arrayName = categoryArrays[category];
  if (!arrayName) {
    console.log(`⚠️  Unknown category: ${category} - skipping`);
    continue;
  }

  const arrayStartRegex = new RegExp(`export const ${arrayName}: WordData\\[\\] = \\[`);
  const startMatch = wordsContent.match(arrayStartRegex);

  if (!startMatch) {
    console.log(`⚠️  Array ${arrayName} not found - skipping ${category}`);
    continue;
  }

  const matchStart = wordsContent.indexOf(startMatch[0]);
  const startPos = matchStart + startMatch[0].length;

  let depth = 1;
  let endPos = -1;

  for (let i = startPos; i < wordsContent.length; i++) {
    const char = wordsContent[i];
    if (char === '[') {
      depth++;
    } else if (char === ']') {
      depth--;
      if (depth === 0) {
        endPos = i;
        break;
      }
    }
  }

  if (endPos === -1) {
    console.log(`⚠️  Could not find end of ${arrayName} array`);
    continue;
  }

  insertions.push({
    category,
    arrayName,
    position: endPos,
    words: wordsByCategory[category]
  });
}

// Sort insertions by position descending
insertions.sort((a, b) => b.position - a.position);

// Generate translations for all languages (using English word as placeholder)
function generateTranslations(englishWord) {
  let translations = '';
  for (const lang of LANGUAGES) {
    if (lang === 'en') {
      translations += `      en: { word: '${englishWord}' },\n`;
    } else {
      // Use English word as placeholder - can be translated later
      translations += `      ${lang}: { word: '${englishWord}' },\n`;
    }
  }
  return translations;
}

// Now insert at each position
let totalAdded = 0;
for (const insertion of insertions) {
  let newEntries = '';
  for (const word of insertion.words) {
    maxId++;
    const translations = generateTranslations(word.word);
    newEntries += `
  {
    id: '${maxId}',
    category: '${word.category}',
    level: '${word.level}',
    translations: {
${translations}    },
  },`;
  }

  wordsContent =
    wordsContent.slice(0, insertion.position) +
    newEntries +
    wordsContent.slice(insertion.position);

  console.log(`✅ Added ${insertion.words.length} words to ${insertion.arrayName}`);
  totalAdded += insertion.words.length;
}

// Write back
fs.writeFileSync(wordsFilePath, wordsContent, 'utf-8');

console.log(`\n✅ Total: ${totalAdded} new words added with all 29 languages`);
console.log('\n📋 Resim listesi (Bunny\'ye yükle):');
for (const category of Object.keys(wordsByCategory)) {
  for (const word of wordsByCategory[category]) {
    const imageName = word.word.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-') + '.jpg';
    console.log(`   ${imageName}`);
  }
}
console.log('\nNext steps:');
console.log('1. Resimleri Bunny CDN\'e yükle: https://synora.b-cdn.net/words/');
console.log('2. Resim adları: kelime.jpg (küçük harf, boşluk yerine -)');
console.log('3. Çeviriler için: node scripts/translate-words.js');
