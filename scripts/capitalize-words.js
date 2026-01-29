/**
 * Script to capitalize first letter of all words in words.ts
 */

const fs = require('fs');
const path = require('path');

const wordsFilePath = path.join(__dirname, '..', 'src', 'data', 'words.ts');

console.log('Reading words.ts...');
let content = fs.readFileSync(wordsFilePath, 'utf-8');

// Pattern to match word values: { word: 'something' }
// Captures the word and replaces with capitalized version
const pattern = /(\{ word: ')([^']+)(' \})/g;

let count = 0;
content = content.replace(pattern, (match, prefix, word, suffix) => {
  count++;
  const capitalized = word.charAt(0).toUpperCase() + word.slice(1);
  return prefix + capitalized + suffix;
});

fs.writeFileSync(wordsFilePath, content, 'utf-8');
console.log(`✅ Capitalized ${count} words`);
