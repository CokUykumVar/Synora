/**
 * List words that need images for a category
 *
 * Usage:
 *   node scripts/list-words-for-images.js <category>
 *   node scripts/list-words-for-images.js --all
 *   node scripts/list-words-for-images.js --missing   (only words without images)
 */

const fs = require('fs');
const path = require('path');

const CATEGORIES = [
  'everyday_objects', 'food_drink', 'people_roles', 'actions',
  'adjectives', 'emotions', 'nature_animals', 'travel', 'sports_hobbies'
];

const arg = process.argv[2];

if (!arg) {
  console.log('Usage:');
  console.log('  node scripts/list-words-for-images.js <category>');
  console.log('  node scripts/list-words-for-images.js --all');
  console.log('  node scripts/list-words-for-images.js --missing');
  console.log('');
  console.log('Categories:', CATEGORIES.join(', '));
  process.exit(1);
}

const wordsTs = fs.readFileSync('src/data/words.ts', 'utf-8');
const imagesDir = 'assets/images/words';

function getWordsForCategory(category) {
  const words = [];
  const pattern = new RegExp(
    `id:\\s*'(\\d+)',[\\s\\S]*?category:\\s*'${category}',[\\s\\S]*?en:\\s*\\{\\s*word:\\s*'([^']+)'`,
    'g'
  );
  let match;
  while ((match = pattern.exec(wordsTs)) !== null) {
    words.push({ id: match[1], word: match[2] });
  }
  return words;
}

function hasImage(category, word) {
  const safeName = word.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  const extensions = ['png', 'jpg', 'jpeg', 'webp'];

  for (const ext of extensions) {
    const imagePath = path.join(imagesDir, category, `${safeName}.${ext}`);
    if (fs.existsSync(imagePath)) return true;
  }
  return false;
}

function listCategory(category, onlyMissing = false) {
  const words = getWordsForCategory(category);
  const categoryDir = path.join(imagesDir, category);

  console.log(`\n=== ${category.toUpperCase()} (${words.length} words) ===`);
  console.log(`Image folder: ${categoryDir}`);
  console.log('');

  let missing = 0;
  let existing = 0;

  words.forEach(w => {
    const has = hasImage(category, w.word);
    if (has) {
      existing++;
      if (!onlyMissing) {
        console.log(`  ✓ ${w.word}`);
      }
    } else {
      missing++;
      console.log(`  ○ ${w.word}`);
    }
  });

  console.log('');
  console.log(`Existing: ${existing}, Missing: ${missing}`);

  return { existing, missing };
}

// Main
if (arg === '--all') {
  let totalExisting = 0;
  let totalMissing = 0;

  CATEGORIES.forEach(cat => {
    const { existing, missing } = listCategory(cat);
    totalExisting += existing;
    totalMissing += missing;
  });

  console.log('\n========================================');
  console.log(`TOTAL: ${totalExisting} existing, ${totalMissing} missing`);

} else if (arg === '--missing') {
  let totalMissing = 0;

  CATEGORIES.forEach(cat => {
    const { missing } = listCategory(cat, true);
    totalMissing += missing;
  });

  console.log('\n========================================');
  console.log(`TOTAL MISSING: ${totalMissing}`);

} else if (CATEGORIES.includes(arg)) {
  listCategory(arg);

} else {
  console.log(`Invalid category: ${arg}`);
  console.log('Valid categories:', CATEGORIES.join(', '));
}
