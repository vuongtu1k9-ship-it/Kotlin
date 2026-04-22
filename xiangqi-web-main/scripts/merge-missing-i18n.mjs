import fs from 'fs';
import path from 'path';

const localesDir = path.resolve('./public/locales');
const enPath = path.join(localesDir, 'en', 'translation.json');
const viPath = path.join(localesDir, 'vi', 'translation.json');

const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));

// Deep spread / merge, where target takes priority, but source fills missing keys
function deepMerge(target, source) {
  if (typeof source !== 'object' || source === null) {
    return target === undefined ? source : target;
  }
  
  if (Array.isArray(source)) {
    return target === undefined ? source : target; // Do not deep merge arrays, just fall back
  }
  
  const result = { ...(target || {}) };
  for (const key of Object.keys(source)) {
    if (result[key] === undefined) {
      result[key] = source[key];
    } else if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key], source[key]);
    }
  }
  return result;
}

const folders = fs.readdirSync(localesDir);
let updatedCount = 0;

for (const folder of folders) {
  if (folder === 'en') continue; // vi and en are our sources/already handled mostly. But we should still fill 'vi' with 'en' just in case? No, 'vi' is the original source mostly.
  
  const targetPath = path.join(localesDir, folder, 'translation.json');
  if (!fs.existsSync(targetPath)) continue;
  
  const targetData = JSON.parse(fs.readFileSync(targetPath, 'utf8'));
  
  const mergedData = deepMerge(targetData, enData);
  
  // Custom manual overrides for specific locales can go here but we just use English fallback
  
  // Calculate differences
  const targetStr = JSON.stringify(targetData);
  const mergedStr = JSON.stringify(mergedData, null, 2);
  
  if (targetStr !== JSON.stringify(mergedData)) {
    fs.writeFileSync(targetPath, mergedStr + '\n', 'utf8');
    console.log(`Merged missing keys for ${folder}`);
    updatedCount++;
  }
}

console.log(`Done! Updated ${updatedCount} translation files.`);
