const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const axios = require("axios");
const cors = require("cors");

const demoApiKey = defineSecret("NVIDIA_DEMO_PROJECTS_API");
const MAX_REQUESTS = 50; // Requests per day (until midnight reset)

// CORS Configuration (Add your Vercel URL here later)
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://127.0.0.1:5500"
];

const corsHandler = cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
});

exports.demoProxy = onRequest(
  { 
    region: "asia-south1",
    secrets: [demoApiKey],
    timeoutSeconds: 60,
    memory: "512MiB" 
  },
  (req, res) => {
    return corsHandler(req, res, async () => {
      try {
        // 1. Identify User
        const clientIp = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;
        const safeIp = clientIp.replace(/[^a-zA-Z0-9]/g, "_");
        
        const db = admin.firestore();
        const docRef = db.collection('april_demo_limits').doc(safeIp);

        // 2. Check Count (Atomic Increment)
        // We don't check time anymore. We just check if they hit the cap.
        const decision = await db.runTransaction(async (t) => {
          const doc = await t.get(docRef);
          
          if (!doc.exists) {
            t.set(docRef, { count: 1 });
            return { allowed: true };
          }

          const data = doc.data();
          if (data.count >= MAX_REQUESTS) {
            return { allowed: false };
          }

          t.update(docRef, { count: data.count + 1 });
          return { allowed: true };
        });

        // 3. Block if needed
        if (!decision.allowed) {
          return res.status(429).json({
            error: "Daily Quota Exceeded",
            message: "You have used your free daily requests. Quota resets at midnight (Asia/Kolkata)."
          });
        }

        // 4. Call Nvidia
        const { model, messages, stream, max_tokens } = req.body;

        const response = await axios({
          method: "post",
          url: "https://integrate.api.nvidia.com/v1/chat/completions",
          headers: {
            "Authorization": `Bearer ${demoApiKey.value()}`,
            "Content-Type": "application/json",
            "Accept": stream ? "text/event-stream" : "application/json",
          },
          data: {
            model: model || "meta/llama-3.2-90b-vision-instruct",
            messages: messages,
            max_tokens: max_tokens || 1024,
            temperature: 0.7,
            stream: stream || false
          },
          responseType: stream ? "stream" : "json",
        });

        if (stream) {
          res.setHeader("Content-Type", "text/event-stream");
          response.data.pipe(res);
        } else {
          res.status(200).json(response.data);
        }

      } catch (error) {
        if (error.message === 'Not allowed by CORS') {
           return res.status(403).json({ error: "CORS Error: Domain not authorized." });
        }
        res.status(500).json({ error: error.message });
      }
    });
  }
);