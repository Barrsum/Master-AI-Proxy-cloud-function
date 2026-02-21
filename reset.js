const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");
const logger = require("firebase-functions/logger");

exports.resetDailyLimits = onSchedule(
  {
    schedule: "0 0 * * *", // Run at 00:00 (Midnight)
    timeZone: "Asia/Kolkata", // Set to your timezone
    region: "asia-south1",
    timeoutSeconds: 540 // Allow time for deleting many docs
  },
  async (event) => {
    const db = admin.firestore();
    const collectionRef = db.collection('april_demo_limits');
    
    logger.info("Starting daily limit reset...");

    // Efficiently delete all documents in the collection
    // Note: recursiveDelete is powerful. Use with care.
    await db.recursiveDelete(collectionRef);
    
    logger.info("Daily limits reset complete. Collection wiped.");
  }
);