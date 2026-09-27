import { useEffect, useState } from 'react';
import { getStoreInfo } from '../services/storeService.js';
import { STORE_CONFIG } from '../config/store.config.js';

/**
 * Store contact info is used in several storefront locations.
 * Fetch once, normalize the API response, and share it through this hook.
 *
 * The configured Flerläss Global defaults (src/config/store.config.js) are
 * used as the base so the storefront always shows correct branding and
 * contact details, even before the backend `/store` record has been set up
 * for this business. Anything the live API returns simply overrides the
 * matching default.
 */

const FALLBACK_STORE = {
  name: STORE_CONFIG.brand.name,
  logoUrl: STORE_CONFIG.brand.logo,
  tagline: STORE_CONFIG.brand.tagline,
  description: STORE_CONFIG.brand.description,
  currency: STORE_CONFIG.currency,
  whatsappNumber: STORE_CONFIG.contact.whatsappNumber,
  whatsapp: { number: STORE_CONFIG.contact.whatsappNumber },
  contact: {
    phone: STORE_CONFIG.contact.phone,
    email: STORE_CONFIG.contact.email,
  },
};

let cachedStore = null;

export function useStoreInfo() {
  const [store, setStore] = useState(cachedStore || FALLBACK_STORE);
  const [loading, setLoading] = useState(!cachedStore);

  useEffect(() => {
    if (cachedStore) return;

    getStoreInfo()
      .then((response) => {
        // The API interceptor returns response.data,
        // which may still contain the backend { success, data } envelope.
        const storeData = response?.data ?? response;

        if (!storeData || typeof storeData !== 'object') {
          setStore(FALLBACK_STORE);
          return;
        }

        const merged = {
          ...FALLBACK_STORE,
          ...storeData,
          contact: { ...FALLBACK_STORE.contact, ...(storeData.contact || {}) },
          whatsapp: { ...FALLBACK_STORE.whatsapp, ...(storeData.whatsapp || {}) },
        };

        cachedStore = merged;
        setStore(merged);
      })
      .catch(() => {
        setStore(FALLBACK_STORE);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return { store, loading };
}
