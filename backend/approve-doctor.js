import mongoose from 'mongoose';

const MONGO_URI = "mongodb://127.0.0.1:27017/doxi";

async function approveDocs() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB via mongoose");
    
    // Use raw collections to bypass schema validation / ES modules issues
    const db = mongoose.connection.db;
    
    const usersResult = await db.collection('users').updateMany(
      { role: 'doctor' },
      { $set: { isApproved: true, consultationFee: 500 } }
    );
    console.log(`Updated ${usersResult.modifiedCount} doctor user profiles to approved.`);
    
    const docsResult = await db.collection('doctors').updateMany(
      {},
      { 
        $set: { 
          isApproved: true, 
          consultationFee: 500,
          availability: [
            { day: "Monday", slots: [{ startTime: "09:00", endTime: "17:00", isBooked: false }] },
            { day: "Tuesday", slots: [{ startTime: "09:00", endTime: "17:00", isBooked: false }] },
            { day: "Wednesday", slots: [{ startTime: "09:00", endTime: "17:00", isBooked: false }] },
            { day: "Thursday", slots: [{ startTime: "09:00", endTime: "17:00", isBooked: false }] },
            { day: "Friday", slots: [{ startTime: "09:00", endTime: "17:00", isBooked: false }] }
          ]
        } 
      }
    );
    console.log(`Updated ${docsResult.modifiedCount} doctor records with availability and approval.`);
    
    // Explicitly add booking fee globally or ensure it allows docs
    await db.collection('settings').updateOne(
      {},
      { $set: { autoApproveDoctors: true, bookingFee: 100 } },
      { upsert: true }
    );
    console.log("Settings updated to auto approve and booking fee 100.");

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

approveDocs();
