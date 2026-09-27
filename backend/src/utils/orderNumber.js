/**
 * Human-readable, roughly-sortable order number: UF-YYMMDD-XXXX.
 * Uniqueness is still enforced by the schema's unique index — this is a
 * best-effort generator, collisions (rare) are handled by retrying with a
 * new random suffix in the order service.
 */
export function generateOrderNumber() {
  const now = new Date();
  const y = String(now.getFullYear()).slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `UF-${y}${m}${d}-${rand}`;
}
