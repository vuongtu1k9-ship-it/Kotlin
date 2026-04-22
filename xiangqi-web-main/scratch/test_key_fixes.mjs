import crypto from 'node:crypto';
import { getAllConfig } from '../server/services/siteConfig.mjs';

async function test() {
  const config = await getAllConfig();
  const jsonStr = config['google.serviceAccountJson'];
  if (!jsonStr) return;
  
  const credentials = JSON.parse(jsonStr);
  let key = credentials.private_key;
  
  console.log('Original key length:', key.length);
  
  try {
    crypto.createPrivateKey(key);
    console.log('Success with original');
  } catch (e) {
    console.log('Failed with original:', e.message);
    
    // Try to normalize newlines
    const normalizedKey = key.replace(/\\n/g, '\n');
    try {
      crypto.createPrivateKey(normalizedKey);
      console.log('Success after normalization');
    } catch (e2) {
      console.log('Failed after normalization:', e2.message);
      
      // Try to remove all whitespace and re-wrap
      const b64 = key.replace(/-----BEGIN PRIVATE KEY-----/g, '')
                     .replace(/-----END PRIVATE KEY-----/g, '')
                     .replace(/\s/g, '');
      const rewrapped = `-----BEGIN PRIVATE KEY-----\n${b64.match(/.{1,64}/g).join('\n')}\n-----END PRIVATE KEY-----\n`;
      try {
        crypto.createPrivateKey(rewrapped);
        console.log('Success after re-wrapping');
      } catch (e3) {
        console.log('Failed after re-wrapping:', e3.message);
      }
    }
  }
}

test().catch(console.error);
