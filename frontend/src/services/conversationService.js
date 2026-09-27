import { api } from './api.js';

export const listConversations = (params = {}) =>
  api.get('/conversations', { params });

export const getConversation = (conversationId) => {
  if (!conversationId) {
    throw new Error('Conversation ID is required');
  }

  return api.get(`/conversations/${conversationId}`);
};

export const createConversation = (payload = {}) => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('Conversation data is required');
  }

  return api.post('/conversations', payload);
};

export const findOrCreateConversation = (payload = {}) => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('Conversation data is required');
  }

  return api.post('/conversations/find-or-create', payload);
};

export const addMessage = (conversationId, payload = {}) => {
  if (!conversationId) {
    throw new Error('Conversation ID is required');
  }

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('Message data is required');
  }

  return api.post(`/conversations/${conversationId}/messages`, payload);
};

export const processConversationWithAI = (conversationId, payload = {}) => {
  if (!conversationId) {
    throw new Error('Conversation ID is required');
  }

  return api.post(`/conversations/${conversationId}/ai`, payload);
};

export const updateConversation = (conversationId, payload = {}) => {
  if (!conversationId) {
    throw new Error('Conversation ID is required');
  }

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('Conversation update data is required');
  }

  return api.patch(`/conversations/${conversationId}`, payload);
};

export const resolveConversation = (conversationId) => {
  if (!conversationId) {
    throw new Error('Conversation ID is required');
  }

  return api.patch(`/conversations/${conversationId}/resolve`);
};

export const reopenConversation = (conversationId) => {
  if (!conversationId) {
    throw new Error('Conversation ID is required');
  }

  return api.patch(`/conversations/${conversationId}/reopen`);
};

export const closeConversation = (conversationId) => {
  if (!conversationId) {
    throw new Error('Conversation ID is required');
  }

  return api.patch(`/conversations/${conversationId}/close`);
};