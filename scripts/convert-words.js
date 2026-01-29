/**
 * Word Data Converter Script
 *
 * Converts CSV/Excel data to JSON format for the Synora app.
 *
 * Usage:
 *   node scripts/convert-words.js input.csv food
 *
 * CSV Format:
 *   word,tr,de,es,fr,image,levels,tags
 *   apple,elma,Apfel,manzana,pomme,apple.webp,beginner,fruit;healthy
 *   bread,ekmek,Brot,pan,pain,bread.webp,beginner;elementary,bakery
 *
 * Notes:
 *   - Multiple levels/tags separated by semicolon (;)
 *   - Image should be the filename in Cloudinary (e.g., apple.webp)
 */

const fs = require('fs');
const path = require('path');

// Supported languages
const LANGUAGES = ['tr', 'de', 'es', 'fr', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 'ar', 'nl', 'pl', 'sv', 'no', 'da', 'fi', 'el', 'he', 'th', 'vi', 'id', 'ms', 'cs', 'ro', 'hu', 'uk'];

function parseCSV(content) {
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

  const words = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length < headers.length) continue;

    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index]?.trim() || '';
    });

    words.push(row);
  }

  return { headers, words };
}

function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current);

  return values;
}

function convertToWordFormat(csvWord, category, index) {
  const id = `${category}_${String(index + 1).padStart(3, '0')}`;

  // Build translations object
  const translations = {};
  LANGUAGES.forEach(lang => {
    if (csvWord[lang]) {
      translations[lang] = csvWord[lang];
    }
  });

  // Parse levels (semicolon separated)
  const levels = csvWord.levels
    ? csvWord.levels.split(';').map(l => l.trim()).filter(Boolean)
    : ['beginner'];

  // Parse tags (semicolon separated)
  const tags = csvWord.tags
    ? csvWord.tags.split(';').map(t => t.trim()).filter(Boolean)
    : [];

  return {
    id,
    word: csvWord.word || csvWord.en || '',
    translations,
    image: csvWord.image || `${csvWord.word}.webp`,
    levels,
    pronunciation: csvWord.pronunciation || '',
    tags: tags.length > 0 ? tags : undefined,
  };
}

function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log('Usage: node convert-words.js <input.csv> <category>');
    console.log('');
    console.log('Example: node convert-words.js food-words.csv food');
    console.log('');
    console.log('CSV Format:');
    console.log('  word,tr,de,es,fr,image,levels,tags');
    console.log('  apple,elma,Apfel,manzana,pomme,apple.webp,beginner,fruit;healthy');
    process.exit(1);
  }

  const inputFile = args[0];
  const category = args[1];

  // Read CSV file
  if (!fs.existsSync(inputFile)) {
    console.error(`Error: File not found: ${inputFile}`);
    process.exit(1);
  }

  const csvContent = fs.readFileSync(inputFile, 'utf-8');
  const { headers, words: csvWords } = parseCSV(csvContent);

  console.log(`Found ${csvWords.length} words in CSV`);
  console.log(`Headers: ${headers.join(', ')}`);

  // Convert to word format
  const words = csvWords.map((w, i) => convertToWordFormat(w, category, i));

  // Create output JSON
  const output = {
    category,
    version: 1,
    lastUpdated: new Date().toISOString().split('T')[0],
    words,
  };

  // Write to file
  const outputDir = path.join(__dirname, '..', 'src', 'data', 'words');
  const outputFile = path.join(outputDir, `${category}.json`);

  // Ensure directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputFile, JSON.stringify(output, null, 2), 'utf-8');

  console.log(`\nSuccessfully converted ${words.length} words`);
  console.log(`Output: ${outputFile}`);

  // Print sample
  console.log('\nSample word:');
  console.log(JSON.stringify(words[0], null, 2));
}

main();
