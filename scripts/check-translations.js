const fs = require('fs');
const content = fs.readFileSync('src/data/words.ts', 'utf-8');

const issues = [];

// Find words where TR translation looks suspicious
const pattern = /en:\s*\{\s*word:\s*'([^']+)'\s*\},\s*\n\s*tr:\s*\{\s*word:\s*'([^']+)'/g;
let match;

// Known loanwords that stay same in Turkish
const loanwords = ['hotel', 'taxi', 'metro', 'cafe', 'piano', 'guitar', 'radio', 'video', 'photo', 'laptop', 'monitor', 'router', 'modem', 'computer', 'internet', 'bluetooth', 'wifi', 'yoga', 'karate', 'judo', 'sushi', 'pizza', 'pasta', 'hamburger', 'sandwich', 'cocktail', 'espresso', 'cappuccino', 'latte', 'croissant', 'steak', 'grill', 'barbecue', 'menu', 'chef', 'casino', 'poker', 'lobby', 'lounge', 'suite', 'tennis', 'golf', 'rugby', 'hockey', 'basketball', 'volleyball', 'baseball', 'badminton', 'squash', 'marathon', 'sprint', 'ski', 'snowboard', 'surf', 'kayak', 'drone', 'robot', 'laser', 'neon', 'led', 'usb', 'hdmi', 'gps', 'atm', 'tv', 'dvd', 'mp3', 'pdf', 'api', 'app', 'web', 'blog', 'podcast', 'online', 'offline', 'email', 'spam', 'virus', 'server', 'browser', 'cloud', 'backup', 'update', 'reset', 'format', 'demo', 'beta', 'prototype', 'version', 'bug', 'code', 'script', 'plugin', 'template', 'theme', 'icon', 'logo', 'brand', 'poster', 'flyer', 'brochure', 'catalog', 'magazine', 'newsletter', 'memo', 'report', 'index', 'reference', 'review', 'rating', 'score', 'level', 'episode', 'season', 'series', 'volume', 'print', 'model', 'sample', 'design', 'style', 'format', 'font', 'color', 'contrast', 'filter', 'effect', 'animation', 'gradient', 'pattern', 'texture', 'rotate', 'scale', 'crop', 'trim', 'delete', 'insert', 'search', 'sort', 'filter', 'group', 'merge', 'split', 'link', 'import', 'export', 'sync', 'buffer', 'cache', 'memory', 'storage', 'disk', 'partition', 'folder', 'file', 'document', 'image', 'media', 'content', 'data', 'log', 'record', 'item', 'element', 'component', 'module', 'unit', 'block', 'section', 'segment', 'part', 'bit', 'byte', 'pixel', 'string', 'text', 'page', 'card', 'ticket', 'pass', 'permit', 'license', 'certificate', 'diploma', 'title', 'award', 'prize', 'medal', 'trophy', 'cup', 'star', 'badge', 'seal', 'stamp', 'webcam', 'scanner', 'projector', 'speaker', 'microphone', 'amplifier', 'mixer', 'synthesizer', 'drum', 'bass', 'solo', 'duo', 'trio', 'quartet', 'ensemble', 'orchestra', 'band', 'concert', 'festival', 'tour', 'album', 'single', 'track', 'remix', 'cover', 'acoustic', 'electric', 'digital', 'analog', 'stereo', 'mono', 'surround', 'dolby', 'bluetooth', 'wireless', 'portable', 'compact', 'slim', 'ultra', 'pro', 'plus', 'max', 'mini', 'nano', 'micro', 'macro', 'mega', 'giga', 'tera', 'pico', 'kilo', 'milli', 'centi', 'deci', 'hecto'];

while ((match = pattern.exec(content)) !== null) {
  const en = match[1];
  const tr = match[2];

  // Check if Turkish is same as English (shouldn't be for most words)
  if (en.toLowerCase() === tr.toLowerCase() && en.length > 3) {
    // Skip known loanwords
    const isLoanword = loanwords.some(lw => en.toLowerCase().includes(lw.toLowerCase()));
    if (!isLoanword) {
      issues.push({ en, tr, issue: 'Ayni (cevirilmemis olabilir)' });
    }
  }

  // Check for obviously wrong translations
  if (tr.includes('undefined') || tr.includes('null') || tr.includes('[object')) {
    issues.push({ en, tr, issue: 'Hata iceriyor' });
  }
}

// Count total
const totalPairs = (content.match(/en:\s*\{\s*word:/g) || []).length;

console.log('Kontrol edilen kelime:', totalPairs);
console.log('Potansiyel sorun:', issues.length);
console.log('');

if (issues.length > 0) {
  console.log('=== POTANSIYEL SORUNLAR (TR ayni EN ile) ===');
  issues.slice(0, 50).forEach(i => {
    console.log(i.en + ' -> TR: ' + i.tr);
  });
  if (issues.length > 50) {
    console.log('... ve ' + (issues.length - 50) + ' tane daha');
  }
} else {
  console.log('Belirgin sorun bulunamadi!');
}

// Check for duplicate entries
console.log('');
console.log('=== DUPLICATE KONTROL ===');

// Find all entries with their categories
const catPattern = /id:\s*'(\d+)',\s*\n\s*category:\s*'([^']+)'[\s\S]*?en:\s*\{\s*word:\s*'([^']+)'/g;
const entries = [];
let catMatch;

while ((catMatch = catPattern.exec(content)) !== null) {
  entries.push({ id: catMatch[1], category: catMatch[2], word: catMatch[3].toLowerCase() });
}

// Find duplicates within same category
const seen = {};
const sameCatDupes = [];

entries.forEach(e => {
  const key = e.category + '|' + e.word;
  if (seen[key]) {
    sameCatDupes.push({ word: e.word, category: e.category, ids: [seen[key], e.id] });
  } else {
    seen[key] = e.id;
  }
});

console.log('Ayni kategoride tekrar eden:', sameCatDupes.length);
if (sameCatDupes.length > 0) {
  console.log('');
  console.log('=== AYNI KATEGORIDE TEKRAR (SORUNLU) ===');
  sameCatDupes.slice(0, 30).forEach(d => {
    console.log(d.word + ' (' + d.category + ') - ID: ' + d.ids.join(', '));
  });
  if (sameCatDupes.length > 30) {
    console.log('... ve ' + (sameCatDupes.length - 30) + ' tane daha');
  }
}

// Find duplicates across different categories (this is OK)
const wordCount = {};
entries.forEach(e => {
  if (!wordCount[e.word]) wordCount[e.word] = [];
  wordCount[e.word].push(e.category);
});

const crossCatDupes = Object.entries(wordCount).filter(([w, cats]) => cats.length > 1 && new Set(cats).size > 1);
console.log('');
console.log('Farkli kategorilerde ayni kelime (sorun degil):', crossCatDupes.length);
if (crossCatDupes.length > 0) {
  crossCatDupes.slice(0, 10).forEach(([word, cats]) => {
    console.log('  ' + word + ': ' + [...new Set(cats)].join(', '));
  });
}
