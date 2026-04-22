import { getAllConfig } from '../server/services/siteConfig.mjs';

async function analyze() {
  const config = await getAllConfig();
  const jsonStr = config['google.serviceAccountJson'];
  if (!jsonStr) return;
  
  const credentials = JSON.parse(jsonStr);
  const key = credentials.private_key;
  
  const b64 = key.replace(/-----BEGIN PRIVATE KEY-----/g, '')
                 .replace(/-----END PRIVATE KEY-----/g, '')
                 .replace(/\s/g, '');
                 
  console.log('Base64 length:', b64.length);
  console.log('Base64 length % 4:', b64.length % 4);
  
  try {
    const buf = Buffer.from(b64, 'base64');
    console.log('Buffer length:', buf.length);
    // Try to parse as ASN.1? No, just check if it's valid.
  } catch (e) {
    console.error('Base64 decode failed:', e.message);
  }
}

analyze().catch(console.error);
