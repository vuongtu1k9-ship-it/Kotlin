import crypto from 'node:crypto';
import { getAllConfig } from '../server/services/siteConfig.mjs';

async function testCrypto() {
  const config = await getAllConfig();
  const jsonStr = config['google.serviceAccountJson'];
  if (!jsonStr) return;
  
  try {
    const credentials = JSON.parse(jsonStr);
    const key = credentials.private_key;
    
    console.log('Testing crypto.createPrivateKey...');
    const pkey = crypto.createPrivateKey(key);
    console.log('Key loaded successfully into crypto module');
  } catch (e) {
    console.error('Crypto load failed:', e);
  }
}

testCrypto().catch(console.error);
