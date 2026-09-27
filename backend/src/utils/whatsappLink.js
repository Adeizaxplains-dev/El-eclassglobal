/**
 * Builds a wa.me deep link with a prefilled message. Used server-side so
 * the API can return one consistent link (product page, cart, order
 * confirmation) instead of every frontend component building its own
 * message string.
 */
export function buildWhatsAppLink(businessNumber, message) {
  if (!businessNumber) {
    return null;
  }

  const digits = String(businessNumber).replace(/\D/g, '');

  if (!digits) {
    return null;
  }

  return `https://wa.me/${digits}?text=${encodeURIComponent(message || '')}`;
}

export function buildProductEnquiryMessage({ storeName, productName, price, size, color }) {
  const parts = [`Hello ${storeName}, I'm interested in the ${productName}.`, `Price: NGN ${price.toLocaleString()}.`];
  if (size) parts.push(`Size: ${size}.`);
  if (color) parts.push(`Colour: ${color}.`);
  return parts.join(' ');
}
