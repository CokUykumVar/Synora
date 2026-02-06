/**
 * Synora - CSV to JSON Converter
 * Converts words-template.csv to words-for-images.json
 *
 * Usage: node csv-to-json.js
 */

const fs = require('fs');
const path = require('path');

const CSV_PATH = path.join(__dirname, 'words-template.csv');
const OUTPUT_PATH = path.join(__dirname, 'words-for-images.json');

function csvToJson() {
  console.log('CSV to JSON conversion starting...\n');

  const content = fs.readFileSync(CSV_PATH, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());

  const words = [];
  let id = 1;

  for (const line of lines) {
    const parts = line.split(',');
    if (parts.length >= 3) {
      const word = parts[0].trim();
      const category = parts[1].trim();
      const level = parts[2].trim();

      if (word && category) {
        words.push({
          id: String(id),
          word_en: word,
          category: category,
          level: level
        });
        id++;
      }
    }
  }

  console.log(`Total ${words.length} words found.\n`);

  // Count by category
  const categories = {};
  for (const word of words) {
    categories[word.category] = (categories[word.category] || 0) + 1;
  }

  console.log('Categories:');
  for (const [cat, count] of Object.entries(categories).sort()) {
    console.log(`  ${cat}: ${count}`);
  }

  // Save as JSON
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(words, null, 2), 'utf-8');
  console.log(`\nSaved to: ${OUTPUT_PATH}`);

  // Show examples
  console.log('\nExample words:');
  words.slice(0, 5).forEach(w => {
    console.log(`  [${w.id}] ${w.word_en} - ${w.category} (${w.level})`);
  });

  return words;
}

csvToJson();
