import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MONGO_URL = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017';
const client = new MongoClient(MONGO_URL);

async function migrate() {
  try {
    await client.connect();
    const db = client.db('xiangqi');
    const lessonCol = db.collection('practice_lessons');
    const lessons = await lessonCol.find({}).toArray();

    console.log(`Checking ${lessons.length} lessons for boards...`);

    for (const lesson of lessons) {
      if (!lesson.boards || lesson.boards.length === 0) {
        let boards = [];
        
        // Try to extract from content [board fen="..."]
        if (lesson.content) {
          const match = lesson.content.match(/\[board\s+[^\]]*fen="([^"]+)"/);
          if (match && match[1]) {
            console.log(`Found FEN in content for ${lesson.id}: ${match[1].substring(0, 20)}...`);
            boards = [{
              id: 'primary',
              title: 'Bắt đầu',
              description: '',
              fen: match[1],
              moves: ''
            }];
            
            // Try to extract moves too
            const movesMatch = lesson.content.match(/moves="([^"]+)"/);
            if (movesMatch) boards[0].moves = movesMatch[1];
          }
        }

        // Final fallback to starting board
        if (boards.length === 0) {
           boards = [{
              id: 'primary',
              title: 'Bắt đầu',
              description: '',
              fen: 'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w',
              moves: ''
            }];
        }

        await lessonCol.updateOne(
          { _id: lesson._id },
          { $set: { boards } }
        );
      }
    }

    console.log('Boards migration complete!');
  } catch (e) {
    console.error('Migration failed:', e);
  } finally {
    await client.close();
  }
}

migrate();
