const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

const { demoProxy } = require("./demoProxy");
const { resetDailyLimits } = require("./reset");

// Export both
exports.demoProxy = demoProxy;
exports.resetDailyLimits = resetDailyLimits;