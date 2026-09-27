import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';

const GRAPH_BASE_URL = 'https://graph.facebook.com/v20.0';

function isConfigured() {
  return Boolean(
    env.whatsapp.accessToken &&
    env.whatsapp.phoneNumberId
  );
}

async function sendRaw(payload) {
  if (!isConfigured()) {
    logger.warn('WhatsApp not configured — message not sent', {
      to: payload?.to,
    });

    return {
      sent: false,
      reason: 'not_configured',
    };
  }

  try {
    const response = await fetch(
      `${GRAPH_BASE_URL}/${env.whatsapp.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.whatsapp.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      logger.error('WhatsApp send failed', {
        message: data?.error?.message,
        code: data?.error?.code,
      });

      return {
        sent: false,
        reason: data?.error?.message || 'unknown_error',
      };
    }

    return {
      sent: true,
      data,
    };
  } catch (error) {
    logger.error('WhatsApp request failed', {
      message: error.message,
    });

    return {
      sent: false,
      reason: error.message,
    };
  }
}

/**
 * Send a normal text message.
 */
export async function sendMessage(to, text) {
  return sendRaw({
    messaging_product: 'whatsapp',
    to,
    type: 'text',
    text: {
      body: text,
    },
  });
}

/**
 * Send an image from a publicly accessible URL.
 */
export async function sendImage(to, imageUrl, caption = '') {
  return sendRaw({
    messaging_product: 'whatsapp',
    to,
    type: 'image',
    image: {
      link: imageUrl,
      ...(caption ? { caption } : {}),
    },
  });
}

/**
 * Send a product image + product information.
 */
export async function sendProductMessage(to, product) {
  const price = product.getEffectivePrice();

  const caption = [
    `🛍️ ${product.name}`,
    '',
    `💰 Price: NGN ${price.toLocaleString()}`,
    '',
    product.description
      ? product.description
      : '',
  ]
    .filter(Boolean)
    .join('\n');

  const imageUrl = product.images?.[0]?.url;

  // If the product has no image,
  // send the product information as text instead.
  if (!imageUrl) {
    return sendMessage(to, caption);
  }

  return sendImage(to, imageUrl, caption);
}

/**
 * Send an approved WhatsApp template.
 */
export async function sendTemplate(
  to,
  templateName,
  languageCode,
  components = []
) {
  return sendRaw({
    messaging_product: 'whatsapp',
    to,
    type: 'template',
    template: {
      name: templateName,
      language: {
        code: languageCode,
      },
      components,
    },
  });
}

/**
 * Order confirmation.
 */
export async function sendOrderConfirmation(
  customerPhone,
  order
) {
  const text = `Hi ${order.delivery.fullName}, your ${store.name} order ${order.orderNumber} has been received. Total: NGN ${order.total.toLocaleString()}. We'll notify you when it ships.`;

  return sendMessage(customerPhone, text);
}

/**
 * Generic follow-up message.
 */
export async function sendFollowUp(
  customerPhone,
  text
) {
  return sendMessage(customerPhone, text);
}

/**
 * WhatsApp webhook payload handler.
 */
export function handleWebhookPayload(payload) {
  logger.info('WhatsApp webhook received', {
    entries: payload?.entry?.length || 0,
  });

  // Conversation/message processing will be added next.
}