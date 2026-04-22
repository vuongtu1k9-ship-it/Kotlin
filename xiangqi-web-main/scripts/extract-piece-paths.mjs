import fs from 'fs';
import path from 'path';

const pieces = [
  'red-general', 'red-advisor', 'red-elephant', 'red-horse', 'red-chariot', 'red-cannon', 'red-soldier',
  'black-general', 'black-advisor', 'black-elephant', 'black-horse', 'black-chariot', 'black-cannon', 'black-soldier'
];

const results = {};

for (const piece of pieces) {
  const filePath = path.join('public', 'pieces', `${piece}.svg`);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    // Match the path d attribute, skipping any radialGradient ids if they were named 'd' (unlikely but safe)
    const match = content.match(/<path[^>]+d="([^"]+)"/);
    if (match) {
      results[piece] = match[1];
    }
  }
}

console.log(JSON.stringify(results, null, 2));
