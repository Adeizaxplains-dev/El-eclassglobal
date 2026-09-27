/**
 * STORE CONFIGURATION
 * ---------------------------------------------------------------------------
 * Single source of truth for business identity, contact details, locations,
 * sourcing countries, delivery and payment info, and social links.
 *
 * The live backend (`/store` endpoint, see services/storeService.js) is
 * still the source of truth once it's populated for this business — see
 * hooks/useStoreInfo.js, which merges whatever the API returns on top of
 * these defaults. That means:
 *
 *   - Before the backend is updated for this client, the storefront still
 *     shows correct Flerläss Global branding and contact info everywhere.
 *   - Once the backend `/store` record is updated for Flerläss Global,
 *     values returned by the API simply override these defaults.
 *
 * To rebrand this codebase for a different client, this is the only file
 * that needs to change for storefront branding/contact/logistics info.
 */

import logo from '../assets/brand/logo.png';

export const STORE_CONFIG = {
  brand: {
    name: 'Flerläss Global',
    shortName: 'Flerläss',
    logo,
    favicon: '/favicon.png',
    tagline: 'Premium Gadgets, Sourced Globally.',
    description:
      'Authentic smartphones, laptops, audio devices, power solutions and other gadgets — sourced from the USA, Canada, UK and Dubai and delivered nationwide across Nigeria.',
  },

  contact: {
    // Replace with the confirmed business line(s) — placeholders until
    // the client supplies final production contact details.
    whatsappNumber: '2348000000000',
    phone: '',
    email: '',
  },

  locations: ['Ilorin', 'Abuja', 'Lagos'],

  sourcing: ['USA', 'Canada', 'UK', 'Dubai'],

  delivery: {
    coverage: 'Nationwide delivery across Nigeria',
    // Delivery fees are location/weight-dependent and not yet confirmed —
    // never hard-code a fee here. Surface a neutral message instead.
    feeNote: 'Delivery fees vary by location — confirm your total via WhatsApp.',
  },

  payments: [
    { id: 'naira', label: 'Naira' },
    { id: 'cash', label: 'Cash' },
    { id: 'trade-in', label: 'Swap / Trade-in' },
    { id: 'crypto', label: 'Bitcoin / Crypto' },
  ],

  social: {
    instagram: '',
    facebook: '',
    tiktok: '',
    twitter: '',
  },

  currency: 'NGN',
};
