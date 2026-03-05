import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

async function migrateSoftDelete() {
  console.log('Starting Soft Delete Migration...');
  
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;

    // 1. Backfill Users
    console.log('Backfilling Users...');
    const userResult = await db.collection('users').updateMany(
      { isDeleted: { $exists: false } },
      { $set: { isDeleted: false } }
    );
    console.log(`Updated ${userResult.modifiedCount} Users.`);

    // 2. Backfill Reviews
    console.log('Backfilling Reviews...');
    const reviewResult = await db.collection('reviews').updateMany(
      { isDeleted: { $exists: false } },
      { $set: { isDeleted: false } }
    );
    console.log(`Updated ${reviewResult.modifiedCount} Reviews.`);

    // 3. Backfill Availability
    console.log('Backfilling Availability...');
    const availabilityResult = await db.collection('availabilities').updateMany(
      { isDeleted: { $exists: false } },
      { $set: { isDeleted: false } }
    );
    console.log(`Updated ${availabilityResult.modifiedCount} Availabilities.`);

    // 4. Migrate Email Index
    console.log('Migrating Email Unique Index...');
    try {
      await db.collection('users').dropIndex('email_1');
      console.log('Dropped legacy email_1 index.');
    } catch (e) {
      if (e.codeName === 'IndexNotFound') {
        console.log('Legacy email_1 index not found. Skipping drop.');
      } else {
        throw e;
      }
    }

    await db.collection('users').createIndex(
      { email: 1 },
      { unique: true, partialFilterExpression: { isDeleted: false }, background: true }
    );
    console.log('Created new partial unique index on email.');

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateSoftDelete();
