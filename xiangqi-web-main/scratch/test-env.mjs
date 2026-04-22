
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

console.log('GOOGLE_REFRESH_TOKEN:', process.env.GOOGLE_REFRESH_TOKEN ? 'FOUND' : 'NOT FOUND');
console.log('FB_PAGE_TOKEN:', process.env.FB_PAGE_TOKEN ? 'FOUND' : 'NOT FOUND');
