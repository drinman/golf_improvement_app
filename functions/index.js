const functions = require("firebase-functions");
const next = require("next");

const dev = process.env.NODE_ENV !== "production";
const app = next({ 
  dev,
  conf: { 
    distDir: ".next",
    // Prevent conflicts with Firebase Functions
    useFileSystemPublicRoutes: true
  } 
});
const handle = app.getRequestHandler();

// Using v1 syntax which is more stable for Next.js
exports.nextApp = functions.https.onRequest(async (req, res) => {
  try {
    await app.prepare();
    return handle(req, res);
  } catch (error) {
    console.error('Error running Next.js app:', error);
    res.status(500).send('Internal Server Error');
  }
});
