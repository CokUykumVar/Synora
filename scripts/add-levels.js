/**
 * Script to add level and image fields to all words in words.ts
 *
 * Usage: node scripts/add-levels.js
 */

const fs = require('fs');
const path = require('path');

const wordsFilePath = path.join(__dirname, '..', 'src', 'data', 'words.ts');

// Read the file
let content = fs.readFileSync(wordsFilePath, 'utf-8');

// Pattern to match word objects that don't have level
// Matches: { id: '...', category: '...', translations:
// And adds level and image after category

const pattern = /(\{\s*id:\s*'(\d+)',\s*category:\s*'(\w+)',)\s*(translations:)/g;

let count = 0;

content = content.replace(pattern, (match, prefix, id, category, translations) => {
  count++;
  // Default level is 'beginner', can be changed later
  const level = 'beginner';
  // Image name will be placeholder, needs to be updated with actual image names
  const image = `synora-words/${category}_${id}`;

  return `${prefix}\n    level: '${level}',\n    image: '${image}',\n    ${translations}`;
});

// Write the file back
fs.writeFileSync(wordsFilePath, content, 'utf-8');

console.log(`✅ Added level and image to ${count} words`);
console.log('');
console.log('Next steps:');
console.log('1. Open src/data/words.ts');
console.log('2. Update level values: beginner | elementary | intermediate | advanced');
console.log('3. Update image names to match Cloudinary uploads');
