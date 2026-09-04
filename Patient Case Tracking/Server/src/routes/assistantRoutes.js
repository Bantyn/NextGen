import express from 'express';
import {
  handleAssistantChat,
  getQuickActions,
  handleToolExecution,
} from '../controllers/assistantController.js';

const router = express.Router();

// Chat turn endpoint
router.post('/chat', handleAssistantChat);

// Quick action shortcuts
router.get('/quick-actions', getQuickActions);

// Read-only tool endpoint (for n8n or direct diagnostic verification)
router.get('/tools/:toolName', handleToolExecution);
router.post('/tools/:toolName', handleToolExecution);

export default router;
