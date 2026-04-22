import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MONGO_URL = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017';
const client = new MongoClient(MONGO_URL);

function makeSlug(text) {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[đĐ]/g, 'd')
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w-]+/g, '') // Remove all non-word chars
    .replace(/--+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
}

async function migrate() {
  try {
    await client.connect();
    const db = client.db('xiangqi');
    
    // 1. Categories
    console.log('Migrating categories...');
    const catCol = db.collection('practice_categories');
    const categories = await catCol.find({}).toArray();
    for (const cat of categories) {
      const slug = makeSlug(cat.name);
      await catCol.updateOne({ _id: cat._id }, { $set: { slug } });
    }

    // 2. Lessons
    console.log('Migrating lessons...');
    const lessonCol = db.collection('practice_lessons');
    const lessons = await lessonCol.find({}).toArray();
    for (const lesson of lessons) {
      const slug = makeSlug(lesson.title || lesson.id);
      
      // Also ensure it has a categorySlug based on its category
      let categorySlug = '';
      if (lesson.category) {
        categorySlug = makeSlug(lesson.category);
      } else {
        categorySlug = 'uncategorized';
      }

      await lessonCol.updateOne(
        { _id: lesson._id }, 
        { $set: { slug, categorySlug } }
      );
    }

    console.log('Migration complete!');
  } catch (e) {
    console.error('Migration failed:', e);
  } finally {
    await client.close();
  }
}

migrate();
