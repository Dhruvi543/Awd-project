import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

async function runIntegrityChecks() {
  console.log('[INTEGRITY CRON] Starting Nightly Validation Check...');
  
  try {
    // Connect to mongoose enforcing strict read concerns to avoid replication propagation lag false-positives
    await mongoose.connect(MONGO_URI, { readConcern: { level: 'majority' } });
    console.log('[INTEGRITY CRON] Connected to MongoDB with readConcern: majority');
    const db = mongoose.connection.db;

    let anomaliesFound = 0;

    console.log('[INTEGRITY CRON] Checking for Orphaned Cascade Appointments...');
    // A. Orphaned Cascade Flags: Found an appointment marked cancelled by system_cascade where the doctor is NOT deleted.
    const orphanedCascades = await db.collection('appointments').aggregate([
      { $match: { cancellationSource: "system_cascade" } },
      { $lookup: { from: "users", localField: "doctor", foreignField: "_id", as: "doctorDoc" } },
      { $unwind: { path: "$doctorDoc", preserveNullAndEmptyArrays: true } },
      { $match: { "doctorDoc.isDeleted": { $ne: true } } }
    ]).toArray();

    if (orphanedCascades.length > 0) {
      console.error(`[ALERT] Found ${orphanedCascades.length} orphaned appointment cascades mapped to active doctors!`);
      anomaliesFound++;
    }

    console.log('[INTEGRITY CRON] Checking for Ghost Relational Dependencies...');
    // B. Deleted Users Still Referenced by Active Reviews
    const ghostReviews = await db.collection('reviews').aggregate([
      { $match: { isDeleted: false } },
      { $lookup: { from: "users", localField: "doctor", foreignField: "_id", as: "docRef" } },
      { $unwind: { path: "$docRef", preserveNullAndEmptyArrays: true } },
      { $match: { "docRef.isDeleted": true } }
    ]).toArray();

    if (ghostReviews.length > 0) {
      console.error(`[ALERT] Found ${ghostReviews.length} active reviews referencing a deleted doctor!`);
      anomaliesFound++;
    }

    console.log('[INTEGRITY CRON] Checking for Active Identity Collisions...');
    // C. Duplicate Active Emails (Sanity Check verifying Partial Index safety)
    const duplicateEmails = await db.collection('users').aggregate([
      { $match: { isDeleted: false } }, 
      { $group: { _id: "$email", count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } }
    ]).toArray();

    if (duplicateEmails.length > 0) {
      console.error(`[ALERT] Critical Violation! Found ${duplicateEmails.length} active mapping collisions on UNIQUE keys!`);
      duplicateEmails.forEach(c => console.log(`   -> Email: ${c._id} (Instances: ${c.count})`));
      anomaliesFound++;
    }

    console.log(`[INTEGRITY CRON] Check cycle completed. Total anomalies detected: ${anomaliesFound}`);
    
    // In production, an anomaliesFound > 0 triggers PagerDuty HTTP alerts
    if (anomaliesFound > 0) {
        process.exit(1); 
    } else {
        process.exit(0);
    }
  } catch (error) {
    console.error('[INTEGRITY CRON] Critical Failure during execution:', error);
    process.exit(1);
  }
}

runIntegrityChecks();
