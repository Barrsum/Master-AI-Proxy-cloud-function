# ⚡ April Vibe Coding - Master AI Proxy

**A Serverless, Rate-Limited, Self-Cleaning Backend for AI Demos.**

This repository hosts the centralized backend for all "April Vibe Coding" web experiments. It acts as a secure gateway to Nvidia's NIM APIs (Llama 3.2, Mistral, etc.), ensuring that frontend keys are never exposed and usage is strictly capped.

## 🏗️ Architecture

1.  **Firebase Functions (`demoProxy`):**
    *   Receives requests from verified Frontends.
    *   Checks Cloud Firestore for the user's IP address.
    *   **Rate Logic:** Allows 50 requests per IP per day.
    *   **CORS:** Only allows requests from `localhost` and specific Vercel deployments.
    *   **Forwarding:** Securely calls Nvidia API with the private key.

2.  **Firebase Scheduler (`resetDailyLimits`):**
    *   Runs automatically every midnight (Asia/Kolkata).
    *   **Self-Cleaning:** Wipes the entire Firestore collection.
    *   Ensures the database never bloats with old logs and users get a fresh start daily.

## 🚀 Setup & Deployment

### Prerequisites
*   Node.js & NPM
*   Firebase CLI (`npm install -g firebase-tools`)
*   A Firebase Project (Blaze Plan required for external API calls, but free tier generous)

### Installation
1.  Clone the repo:
    ```bash
    git clone https://github.com/Barrsum/Master-AI-Proxy-cloud-function
    cd Master-AI-Proxy-cloud-function
    npm install
    ```

2.  Set your Nvidia API Key:
    ```bash
    firebase functions:secrets:set NVIDIA_DEMO_PROJECTS_API
    # Paste your key when prompted
    ```

    To generate your Nvidia API Key check readme.md of [Coming soon...](https://www.linkedin.com/in/ram-bapat-barrsum-diamos)

3.  Deploy:
    ```bash
    firebase deploy --only functions
    ```

## 🔌 API Usage

**Endpoint:** `https://asia-south1-YOUR_PROJECT.cloudfunctions.net/demoProxy`
**Method:** `POST`

### Request Body (Standard OpenAI Format)
```json
{
  "model": "meta/llama-3.2-90b-vision-instruct",
  "messages": [
    { "role": "user", "content": "Describe this image..." }
  ],
  "stream": false
}
```

### Rate Limit Headers
The API returns these headers so the frontend can show the user their status:
*   `X-RateLimit-Remaining`: Number of requests left today.
*   `X-RateLimit-Reset`: Time when the limit resets (Midnight).

## 🛡️ Security
*   **CORS:** To add a new frontend project (e.g., a new Vercel app), open `demoProxy.js`, add the domain to `allowedOrigins`, and redeploy.
*   **DDOS Protection:** High-volume spam is rejected at the Firestore layer before hitting the expensive Nvidia API.

---
*Built for the April 30-Day Vibe Coding Challenge.*

Built by Ram Bapat - Challenge [\#30DaysOfVibeCoding](https://www.linkedin.com/posts/ram-bapat-barrsum-diamos_vibecoding-ai-machinelearning-activity-7312839191153860608-wQ8y) - [LinkedIn Profile](https://www.linkedin.com/in/ram-bapat-barrsum-diamos)