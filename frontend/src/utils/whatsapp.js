/**
 * Reusable WhatsApp deep-link builder for the frontend. The product-detail
 * page prefers the ready-made link the backend returns (source of truth
 * for the store's WhatsApp number); this is for spots — cart, contact
 * page — where we're building a message client-side rather than showing
 * a backend-supplied one.
 */
export function buildWhatsAppLink(number, message) {
  let digits = String(number || '').replace(/\D/g, '');

  // Normalize Nigerian phone numbers to international format.
  if (digits.startsWith('0')) {
    digits = `234${digits.slice(1)}`;
  } else if (digits.startsWith('234')) {
    // Already in Nigerian international format.
    digits = digits;
  }

  if (!digits) {
    return '#';
  }

  return `https://wa.me/${digits}?text=${encodeURIComponent(message || '')}`;
}

export function buildCartWhatsAppMessage(storeName, items) {
  return items
    .map((item) => {
      const price = new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        maximumFractionDigits: 0,
      }).format(Number(item.unitPrice) || 0);

      const details = [
        `🛍️ ${item.name}`,
        `💰 Price: ${price}`,
        `🔢 Quantity: ${item.quantity}`,
        `📂 Category: ${item.category || '—'}`,
      ];

      if (item.size) {
        details.push(`📏 Size: ${item.size}`);
      }

      if (item.color) {
        details.push(`🎨 Colour: ${item.color}`);
      }

      if (item.image) {
        details.push(`🖼️ Product image: ${item.image}`);
      }

      return details.join('\n');
    })
    .map(
      (details) =>
        `Hello ${storeName},\n\nI'm interested in this product:\n\n${details}\n\nPlease let me know if this item is available.`
    )
    .join('\n\n--------------------\n\n');
}