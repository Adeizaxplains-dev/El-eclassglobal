import express from 'express';

import {
  findOrCreateConversation,
  createConversation,
  listConversations,
  getConversation,
  addMessage,
  updateConversation,
  resolveConversation,
  reopenConversation,
  closeConversation,
  processConversationWithAI,
} from '../controllers/conversationController.js';

import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

/*
 * ---------------------------------------------------------
 * CONVERSATIONS
 * ---------------------------------------------------------
 *
 * All conversation/admin-inbox endpoints require:
 * - valid authentication
 * - admin or staff role
 */
router.use(protect, authorize('admin', 'staff'));

/*
 * GET /api/conversations
 *
 * Admin inbox:
 * - list conversations
 * - search conversations
 * - filter by status
 * - filter by mode
 * - filter by channel
 */
router.get(
  '/',
  listConversations
);

/*
 * POST /api/conversations
 *
 * Create a new conversation.
 */
router.post(
  '/',
  createConversation
);

/*
 * POST /api/conversations/find-or-create
 *
 * Used mainly by incoming WhatsApp/webhook flows.
 *
 * If the customer already has an open conversation,
 * return it.
 *
 * Otherwise create one.
 */
router.post(
  '/find-or-create',
  findOrCreateConversation
);

/*
 * ---------------------------------------------------------
 * SINGLE CONVERSATION
 * ---------------------------------------------------------
 */

/*
 * GET /api/conversations/:id
 *
 * Get a complete conversation.
 */
router.get(
  '/:id',
  getConversation
);

/*
 * POST /api/conversations/:id/messages
 *
 * Add a customer, business or AI message.
 */
router.post(
  '/:id/messages',
  addMessage
);

/*
 * POST /api/conversations/:id/ai
 *
 * Process the conversation with the AI assistant.
 */
router.post(
  '/:id/ai',
  processConversationWithAI
);

/*
 * PATCH /api/conversations/:id
 *
 * Update:
 * - status
 * - AI/human mode
 * - assigned staff
 * - AI settings
 * - summary
 * - context
 * - metadata
 */
router.patch(
  '/:id',
  updateConversation
);

/*
 * ---------------------------------------------------------
 * CONVERSATION ACTIONS
 * ---------------------------------------------------------
 */

/*
 * PATCH /api/conversations/:id/resolve
 *
 * Mark conversation as resolved.
 */
router.patch(
  '/:id/resolve',
  resolveConversation
);

/*
 * PATCH /api/conversations/:id/reopen
 *
 * Reopen a resolved/closed conversation.
 */
router.patch(
  '/:id/reopen',
  reopenConversation
);

/*
 * PATCH /api/conversations/:id/close
 *
 * Close conversation without deleting its history.
 */
router.patch(
  '/:id/close',
  closeConversation
);

export default router;