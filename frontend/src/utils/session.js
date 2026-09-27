const SESSION_KEY = 'uf_session_id';

/**
 * A stable per-browser identifier for guest carts/events. Not auth —
 * just lets the backend associate a cart/funnel events with "this visitor"
 * across page loads without requiring an account. Persisted in
 * localStorage (not sessionStorage) so a cart survives a closed tab.
 */
export function getSessionId() {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}
