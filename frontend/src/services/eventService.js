import { api } from './api.js';
import { getSessionId } from '../utils/session.js';
import { getAttribution } from '../utils/attribution.js';

/**
 * Fires one conversion-funnel event. Failures are swallowed — tracking
 * must never block or break the actual user flow it's observing.
 */
export const trackEvent = (type, metadata = {}) => {
  const { source, campaign } = getAttribution();
  return api.post('/events', { type, sessionId: getSessionId(), metadata, source, campaign }).catch(() => {});
};
