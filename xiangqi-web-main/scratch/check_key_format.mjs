import { getAllConfig } from '../server/services/siteConfig.mjs';

async function checkKey() {
  const config = await getAllConfig();
  const jsonStr = config['google.serviceAccountJson'];
  if (!jsonStr) return;
  
  try {
    const credentials = JSON.parse(jsonStr);
    const key = credentials.private_key;
    console.log('Private key exists:', !!key);
    console.log('Private key starts with:', key?.substring(0, 30));
    console.log('Contains literal \\n (escaped):', key?.includes('\\n'));
    console.log('Contains actual newlines:', key?.includes('\n'));
  } catch (e) {
    console.error('Failed to parse JSON:', e.message);
  }
}

checkKey().catch(console.error);
