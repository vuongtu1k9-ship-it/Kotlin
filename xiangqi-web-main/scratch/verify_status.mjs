import { isGoogleReportingEnabled } from '../server/services/googleReporting.mjs';

async function testStatus() {
  const enabled = await isGoogleReportingEnabled();
  console.log('Google Reporting Enabled:', enabled);
}

testStatus().catch(console.error);
