import fs from 'fs';
import path from 'path';

const localesDir = path.resolve('./public/locales');
const folders = fs.readdirSync(localesDir);

for (const folder of folders) {
  const filePath = path.join(localesDir, folder, 'translation.json');
  if (!fs.existsSync(filePath)) continue;
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  content = content.replace(/<span className=\\"text-blue-500\\">📚<\/span>/g, '<0>📚</0>');
  content = content.replace(/<span className=\\"text-blue-600\\">(.*?)<\/span>/g, '<1>$1</1>');
  content = content.replace(/<strong className=\\"text-slate-600 dark:text-white\/60\\">(.*?)<\/strong>/g, '<2>$1</2>');

  fs.writeFileSync(filePath, content, 'utf8');
}

console.log('Fixed HTML tags in translation files');
