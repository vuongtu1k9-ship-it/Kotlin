import { setBulkConfig } from '../server/services/siteConfig.mjs';
import fs from 'fs';

async function update() {
  const jsonPath = '/home/hoan/DATA/xiangqi-web/config/secrets/cotuong-xyz-e11c382c3620.json';
  const credentials = fs.readFileSync(jsonPath, 'utf8');
  
  const updates = {
    'google.serviceAccountJson': credentials,
    'google.ga4PropertyId': '392362325',
    'google.searchConsoleSiteUrl': 'sc-domain:cotuong.xyz'
  };
  
  console.log('Updating config...');
  await setBulkConfig(updates);
  console.log('Config updated successfully.');
}

update().catch(console.error);
