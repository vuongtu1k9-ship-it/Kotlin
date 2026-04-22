import fs from 'fs';
import { getAllConfig } from '../server/services/siteConfig.mjs';

async function saveKey() {
  const config = await getAllConfig();
  const jsonStr = config['google.serviceAccountJson'];
  if (!jsonStr) return;
  
  try {
    const credentials = JSON.parse(jsonStr);
    const key = credentials.private_key;
    fs.writeFileSync('scratch/debug_key.pem', key);
    console.log('Saved to scratch/debug_key.pem');
  } catch (e) {
    console.error('Failed:', e.message);
  }
}

saveKey().catch(console.error);
