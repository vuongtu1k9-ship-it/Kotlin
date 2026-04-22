import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

import { isGoogleReportingEnabled } from '../server/services/googleReporting.mjs';

async function test() {
  console.log('Testing isGoogleReportingEnabled...');
  try {
    const enabled = await isGoogleReportingEnabled();
    console.log(`isGoogleReportingEnabled: ${enabled}`);
  } catch (err) {
    console.error('Error in test:', err);
  }
}

test();
