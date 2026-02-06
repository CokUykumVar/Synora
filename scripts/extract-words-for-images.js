/**
 * Extract words from words.ts for image generation
 * Usage: node scripts/extract-words-for-images.js [category]
 * Example: node scripts/extract-words-for-images.js everyday_objects
 */

const fs = require('fs');
const path = require('path');

const wordsFilePath = path.join(__dirname, '..', 'src', 'data', 'words.ts');
const outputPath = path.join(__dirname, 'words-for-images.json');

// Get category from command line argument
const category = process.argv[2];

if (!category) {
  console.log('Usage: node extract-words-for-images.js <category>');
  console.log('Example: node extract-words-for-images.js everyday_objects');
  process.exit(1);
}

// Read words.ts
const content = fs.readFileSync(wordsFilePath, 'utf-8');

// Extract word entries using regex
const wordPattern = /\{\s*id:\s*'(\d+)',\s*category:\s*'([^']+)',\s*level:\s*'([^']+)',\s*translations:\s*\{[^}]*en:\s*\{\s*word:\s*'([^']+)'/g;

const words = [];
let match;

while ((match = wordPattern.exec(content)) !== null) {
  const [_, id, cat, level, wordEn] = match;

  if (cat === category) {
    words.push({
      id: id,
      word_en: wordEn,
      category: cat,
      level: level
    });
  }
}

console.log(`Found ${words.length} words in category "${category}"`);

// Save to JSON
fs.writeFileSync(outputPath, JSON.stringify(words, null, 2), 'utf-8');
console.log(`Saved to ${outputPath}`);
