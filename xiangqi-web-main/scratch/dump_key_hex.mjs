import { getAllConfig } from '../server/services/siteConfig.mjs';

async function dump() {
  const config = await getAllConfig();
  const jsonStr = config['google.serviceAccountJson'];
  if (!jsonStr) return;
  
  const credentials = JSON.parse(jsonStr);
  const key = credentials.private_key;
  
  const b64 = key.replace(/-----BEGIN PRIVATE KEY-----/g, '')
                 .replace(/-----END PRIVATE KEY-----/g, '')
                 .replace(/\s/g, '');
  const buf = Buffer.from(b64, 'base64');
  console.log(buf.toString('hex'));
}

dump().catch(console.error);
