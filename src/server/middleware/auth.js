/**
 * API Key Authentication Middleware
 * Validates X-API-Key header on all /api/* requests
 */

const API_KEY = process.env.API_KEY || 'dev-api-key';
const DEV_MODE = process.env.NODE_ENV !== 'production';

export default function authMiddleware(req, res, next) {
  // Skip auth in dev mode if no API_KEY env var set
  if (DEV_MODE && !process.env.API_KEY) {
    console.warn('⚠️  API authentication disabled in dev mode');
    return next();
  }

  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({ error: 'Missing X-API-Key header' });
  }

  if (apiKey !== API_KEY) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  next();
}
