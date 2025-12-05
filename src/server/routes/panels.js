/**
 * Panel API Routes
 * Handles panel CRUD operations via REST API
 */

import express from 'express';
import { createPanel, renderPanel } from '../../managers/panelManager.js';

const router = express.Router();

/**
 * POST /api/panels
 * Create a new panel
 * Request body: { title?: string, code?: string, position?: { x, y }, size?: { w, h } }
 * Response: { success: true, panelId: string }
 */
router.post('/', async (req, res) => {
  try {
    const { title, code, position, size } = req.body;

    // Validate request body (optional fields)
    if (title !== undefined && typeof title !== 'string') {
      return res.status(400).json({ error: 'title must be a string' });
    }
    if (code !== undefined && typeof code !== 'string') {
      return res.status(400).json({ error: 'code must be a string' });
    }
    if (position !== undefined && (typeof position !== 'object' || position === null)) {
      return res.status(400).json({ error: 'position must be an object' });
    }
    if (size !== undefined && (typeof size !== 'object' || size === null)) {
      return res.status(400).json({ error: 'size must be an object' });
    }

    // Create panel with provided options or defaults
    const panelId = createPanel({
      title: title || undefined, // Let panelManager handle default
      code: code || '',
      position: position || { x: 0, y: 0 },
      size: size || { w: 600, h: 200 }
    });

    // Render panel in DOM (if running in browser context)
    // Note: This will only work if server is integrated with client
    // For separate server, client handles rendering via WebSocket event
    try {
      // Only render if document is available (browser context)
      if (typeof document !== 'undefined') {
        renderPanel(panelId);
      }
    } catch (renderError) {
      console.warn('Cannot render panel in server context:', renderError.message);
    }

    // Broadcast to Vite WebSocket server via HTTP callback
    try {
      await fetch('http://localhost:5173/api/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'panel_created',
          panelId,
          title: title || undefined,
          code: code || '',
          position: position || { x: 0, y: 0 },
          size: size || { w: 600, h: 200 }
        })
      });
    } catch (broadcastError) {
      console.warn('Failed to broadcast to Vite WebSocket:', broadcastError.message);
      // Don't fail the request if broadcast fails
    }

    res.json({ success: true, panelId });
  } catch (error) {
    console.error('Error creating panel:', error);
    res.status(500).json({
      error: 'Failed to create panel',
      details: error.message
    });
  }
});

export default router;
