import { getAllConfig } from '../server/services/siteConfig.mjs';

async function checkBytes() {
  const config = await getAllConfig();
  const jsonStr = config['google.serviceAccountJson'];
  if (!jsonStr) return;
  
  try {
    const credentials = JSON.parse(jsonStr);
    const key = credentials.private_key;
    console.log('Key length:', key?.length);
    console.log('First 200 chars hex:');
    const buffer = Buffer.from(key);
    console.log(buffer.slice(0, 200).toString('hex'));
    console.log('First 200 chars literal:');
    console.log(JSON.stringify(key.substring(0, 200)));
  } catch (e) {
    console.error('Failed:', e.message);
  }
}

checkBytes().catch(console.error);
