/**
 * Reads utm_source/utm_campaign from the URL on first landing and persists
 * them for the rest of the session, so a sale that started from a TikTok
 * link still gets attributed correctly at checkout, even after the
 * customer has browsed several pages since.
 */
const SOURCE_KEY = 'uf_source';
const CAMPAIGN_KEY = 'uf_campaign';

const VALID_SOURCES = ['tiktok', 'instagram', 'whatsapp', 'direct', 'google', 'referral', 'other'];

export function captureAttribution(search) {
  const params = new URLSearchParams(search);
  const utmSource = params.get('utm_source');
  const utmCampaign = params.get('utm_campaign');

  if (utmSource && !localStorage.getItem(SOURCE_KEY)) {
    const normalized = VALID_SOURCES.includes(utmSource.toLowerCase()) ? utmSource.toLowerCase() : 'other';
    localStorage.setItem(SOURCE_KEY, normalized);
  }
  if (utmCampaign && !localStorage.getItem(CAMPAIGN_KEY)) {
    localStorage.setItem(CAMPAIGN_KEY, utmCampaign);
  }
}

export function getAttribution() {
  return {
    source: localStorage.getItem(SOURCE_KEY) || 'direct',
    campaign: localStorage.getItem(CAMPAIGN_KEY) || '',
  };
}
