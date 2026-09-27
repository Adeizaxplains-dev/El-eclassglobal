/**
 * DEMO / PLACEHOLDER PRODUCTS
 * ---------------------------------------------------------------------------
 * These exist ONLY so the storefront doesn't look empty before the real
 * catalogue is loaded into the backend. They are never real inventory:
 *
 *   - `isDemo: true` on every entry.
 *   - Prices are illustrative starting points, not confirmed client pricing.
 *   - No photography is included — an icon + category stand in for a photo
 *     until real product images are uploaded, so nothing here can be
 *     mistaken for an actual product photo.
 *   - Home.jsx only renders these when the live API returns zero products
 *     for a section, and they intentionally do NOT link to a product-detail
 *     page (there is no real product behind them) — instead they route to
 *     a WhatsApp enquiry.
 *
 * Delete this file's contents (or simply stop importing it) once the real
 * catalogue is live in the backend.
 */

export const DEMO_PRODUCTS = [
  { id: 'demo-1', name: 'iPhone 15 Pro Max', category: 'smartphones', icon: 'smartphone', price: 1650000, condition: 'UK Used' },
  { id: 'demo-2', name: 'Samsung Galaxy S24 Ultra', category: 'smartphones', icon: 'smartphone', price: 1450000, condition: 'New' },
  { id: 'demo-3', name: 'MacBook Air M2', category: 'laptops', icon: 'laptop', price: 1850000, condition: 'US Used' },
  { id: 'demo-4', name: 'HP Pavilion 15', category: 'laptops', icon: 'laptop', price: 950000, condition: 'New' },
  { id: 'demo-5', name: 'JBL Flip 6 Speaker', category: 'audio', icon: 'headphones', price: 145000, condition: 'New' },
  { id: 'demo-6', name: 'Apple AirPods Pro (2nd Gen)', category: 'audio', icon: 'headphones', price: 250000, condition: 'New' },
  { id: 'demo-7', name: '20,000mAh Fast-Charge Power Bank', category: 'power', icon: 'battery', price: 35000, condition: 'New' },
  { id: 'demo-8', name: '1.5KVA Inverter + Battery Kit', category: 'power', icon: 'zap', price: 620000, condition: 'New' },
];

export const DEMO_DEALS = [
  { id: 'demo-deal-1', name: 'Samsung Galaxy A55', category: 'smartphones', icon: 'smartphone', price: 480000, wasPrice: 560000 },
  { id: 'demo-deal-2', name: 'Dell Inspiron 14', category: 'laptops', icon: 'laptop', price: 720000, wasPrice: 830000 },
  { id: 'demo-deal-3', name: 'Anker Soundcore Earbuds', category: 'audio', icon: 'headphones', price: 38000, wasPrice: 52000 },
  { id: 'demo-deal-4', name: '10,000mAh Power Bank', category: 'power', icon: 'battery', price: 18000, wasPrice: 24000 },
];
