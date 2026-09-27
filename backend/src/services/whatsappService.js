// backend/src/services/whatsappService.js

import mongoose from 'mongoose';

import { Conversation } from '../models/Conversation.js';
import { Customer } from '../models/Customer.js';

import {
  findOrCreateCustomer,
} from './customerService.js';

import {
  prepareAIConversationRequest,
  generateAIResponse,
  buildFallbackResponse,
} from './aiConversationService.js';

import {
  sendMessage,
  sendImage,
} from '../integrations/whatsapp/whatsappService.js';

import { logger } from '../utils/logger.js';

/*
 * ---------------------------------------------------------
 * WHATSAPP SERVICE
 * ---------------------------------------------------------
 *
 * Application-level WhatsApp service.
 *
 * Responsibility:
 *
 * Meta WhatsApp webhook
 *        ↓
 * parse incoming message
 *        ↓
 * find/create customer
 *        ↓
 * find/create conversation
 *        ↓
 * save customer message
 *        ↓
 * prepare AI context
 *        ↓
 * AI provider
 *        ↓
 * validate response
 *        ↓
 * send WhatsApp response
 *
 * IMPORTANT:
 *
 * This file does NOT contain the Meta Graph API implementation.
 *
 * Low-level WhatsApp communication remains inside:
 *
 * integrations/whatsapp/whatsappService.js
 *
 * This keeps the architecture clean:
 *
 * Controller/Webhook
 *        ↓
 * services/whatsappService.js
 *        ↓
 * integrations/whatsapp/whatsappService.js
 */

/*
 * ---------------------------------------------------------
 * CONSTANTS
 * ---------------------------------------------------------
 */

const WHATSAPP_CHANNEL = 'whatsapp';

const MAX_TEXT_LENGTH = 4096;

/*
 * ---------------------------------------------------------
 * HELPERS
 * ---------------------------------------------------------
 */

function normalizeText(value) {
  return String(value || '')
    .trim()
    .slice(0, MAX_TEXT_LENGTH);
}

function isValidObjectId(value) {
  return mongoose.Types.ObjectId.isValid(value);
}

/**
 * WhatsApp phone numbers should be stored in the normalized
 * international format supplied by Meta whenever possible.
 */
function normalizePhone(phone) {
  return String(phone || '')
    .replace(/[^\d+]/g, '')
    .trim();
}

/**
 * Safely extract the sender's display name from a Meta
 * webhook contact object.
 */
function getContactName(contact) {
  return (
    contact?.profile?.name ||
    contact?.name ||
    ''
  );
}

/*
 * ---------------------------------------------------------
 * WEBHOOK MESSAGE PARSING
 * ---------------------------------------------------------
 *
 * Converts Meta webhook payloads into our internal format.
 *
 * Supported:
 *
 * - text
 * - image
 * - video
 * - audio
 * - document
 * - interactive/button text
 *
 * The service does not assume that every webhook contains
 * a customer message. Status webhooks are ignored.
 */

export function parseWebhookMessages(payload) {
  if (!payload) {
    return [];
  }

  const messages = [];

  const entries = Array.isArray(payload.entry)
    ? payload.entry
    : [];

  for (const entry of entries) {
    const changes = Array.isArray(entry?.changes)
      ? entry.changes
      : [];

    for (const change of changes) {
      const value = change?.value;

      if (!value) {
        continue;
      }

      const contacts = Array.isArray(value.contacts)
        ? value.contacts
        : [];

      const webhookMessages = Array.isArray(value.messages)
        ? value.messages
        : [];

      for (const message of webhookMessages) {
        const contact =
          contacts.find(
            (item) =>
              item?.wa_id === message?.from
          ) ||
          contacts[0] ||
          null;

        const parsed =
          parseIncomingMessage(
            message,
            contact
          );

        if (parsed) {
          messages.push(parsed);
        }
      }
    }
  }

  return messages;
}

/**
 * Parse one Meta WhatsApp message.
 */
export function parseIncomingMessage(
  message,
  contact = null
) {
  if (!message?.from || !message?.id) {
    return null;
  }

  const senderPhone =
    normalizePhone(message.from);

  if (!senderPhone) {
    return null;
  }

  const base = {
    externalMessageId:
      String(message.id),

    phone: senderPhone,

    name:
      getContactName(contact),

    timestamp: message.timestamp
      ? new Date(
          Number(message.timestamp) * 1000
        )
      : new Date(),

    metadata: {
      whatsappMessageId:
        String(message.id),

      contactWaId:
        contact?.wa_id ||
        senderPhone,

      profileName:
        getContactName(contact),
    },
  };

  /*
   * Text message
   */
  if (message.type === 'text') {
    return {
      ...base,

      type: 'text',

      text:
        normalizeText(
          message.text?.body
        ),
    };
  }

  /*
   * Image
   *
   * Meta normally supplies a media ID here.
   * The actual media download can be added later through
   * the integration layer.
   */
  if (message.type === 'image') {
    return {
      ...base,

      type: 'image',

      text:
        normalizeText(
          message.image?.caption
        ),

      media: {
        id:
          message.image?.id ||
          null,

        mimeType:
          message.image?.mime_type ||
          '',

        sha256:
          message.image?.sha256 ||
          '',
      },
    };
  }

  /*
   * Video
   */
  if (message.type === 'video') {
    return {
      ...base,

      type: 'video',

      text:
        normalizeText(
          message.video?.caption
        ),

      media: {
        id:
          message.video?.id ||
          null,

        mimeType:
          message.video?.mime_type ||
          '',

        sha256:
          message.video?.sha256 ||
          '',
      },
    };
  }

  /*
   * Audio
   */
  if (message.type === 'audio') {
    return {
      ...base,

      type: 'audio',

      text: '',

      media: {
        id:
          message.audio?.id ||
          null,

        mimeType:
          message.audio?.mime_type ||
          '',

        sha256:
          message.audio?.sha256 ||
          '',
      },
    };
  }

  /*
   * Document
   */
  if (message.type === 'document') {
    return {
      ...base,

      type: 'document',

      text:
        normalizeText(
          message.document?.caption
        ),

      media: {
        id:
          message.document?.id ||
          null,

        mimeType:
          message.document?.mime_type ||
          '',

        filename:
          message.document?.filename ||
          '',

        sha256:
          message.document?.sha256 ||
          '',
      },
    };
  }

  /*
   * Interactive reply.
   */
  if (message.type === 'interactive') {
    const text =
      message.interactive?.button_reply?.title ||
      message.interactive?.list_reply?.title ||
      '';

    return {
      ...base,

      type: 'text',

      text:
        normalizeText(text),

      metadata: {
        ...base.metadata,

        interactiveType:
          message.interactive?.type ||
          '',

        buttonId:
          message.interactive?.button_reply?.id ||
          '',

        listId:
          message.interactive?.list_reply?.id ||
          '',
      },
    };
  }

  /*
   * Button reply.
   */
  if (message.type === 'button') {
    return {
      ...base,

      type: 'text',

      text:
        normalizeText(
          message.button?.text
        ),

      metadata: {
        ...base.metadata,

        buttonPayload:
          message.button?.payload ||
          '',
      },
    };
  }

  /*
   * Unsupported message type.
   *
   * We return null rather than inventing a representation.
   */
  return null;
}

/*
 * ---------------------------------------------------------
 * CUSTOMER
 * ---------------------------------------------------------
 */

/**
 * Find or create the CRM customer associated with a WhatsApp
 * sender.
 */
export async function getOrCreateWhatsAppCustomer({
  storeId,
  phone,
  name = '',
}) {
  if (!storeId) {
    throw new Error(
      'Store ID is required.'
    );
  }

  const normalizedPhone =
    normalizePhone(phone);

  if (!normalizedPhone) {
    throw new Error(
      'WhatsApp phone number is required.'
    );
  }

  /*
   * customerService currently uses the default store context.
   *
   * For the WhatsApp pipeline we first try to use the existing
   * customer directly so that the supplied storeId remains
   * authoritative.
   */
  let customer =
    await Customer.findOne({
      storeId,
      phone: normalizedPhone,
    });

  if (customer) {
    customer.lastInteractionAt =
      new Date();

    if (
      name &&
      (!customer.name ||
        customer.name !== name)
    ) {
      customer.name = name;
    }

    await customer.save();

    return customer;
  }

  /*
   * Create directly using the explicit storeId.
   *
   * This avoids accidentally creating a WhatsApp customer in
   * another store if the default store context differs.
   */
  try {
    customer =
      await Customer.create({
        storeId,

        name:
          normalizeText(name, 300),

        phone:
          normalizedPhone,

        email: '',

        address: {},

        acquisitionSource:
          'whatsapp',

        acquisitionCampaign:
          '',

        customerStatus:
          'lead',

        lastInteractionAt:
          new Date(),
      });

    return customer;
  } catch (error) {
    /*
     * Two webhook requests can arrive simultaneously.
     *
     * If the unique storeId + phone index rejects the second
     * insert, retrieve the customer created by the first one.
     */
    if (error?.code === 11000) {
      const existing =
        await Customer.findOne({
          storeId,
          phone: normalizedPhone,
        });

      if (existing) {
        return existing;
      }
    }

    throw error;
  }
}

/*
 * ---------------------------------------------------------
 * CONVERSATION
 * ---------------------------------------------------------
 */

/**
 * Find an existing open WhatsApp conversation or create one.
 */
export async function getOrCreateWhatsAppConversation({
  storeId,
  customerId,
}) {
  if (!storeId) {
    throw new Error(
      'Store ID is required.'
    );
  }

  if (
    !customerId ||
    !isValidObjectId(customerId)
  ) {
    throw new Error(
      'Valid customer ID is required.'
    );
  }

  let conversation =
    await Conversation.findOne({
      storeId,
      customerId,
      channel:
        WHATSAPP_CHANNEL,

      status: {
        $in: [
          'open',
          'pending',
        ],
      },
    }).sort({
      lastMessageAt: -1,
    });

  if (conversation) {
    return conversation;
  }

  conversation =
    await Conversation.create({
      storeId,

      customerId,

      channel:
        WHATSAPP_CHANNEL,

      status: 'open',

      mode: 'ai',

      aiSettings: {
        enabled: true,
        autoReply: true,
        humanHandoff: true,
      },

      messages: [],

      lastMessageAt:
        new Date(),

      lastMessagePreview: '',
    });

  return conversation;
}

/*
 * ---------------------------------------------------------
 * DUPLICATE MESSAGE PROTECTION
 * ---------------------------------------------------------
 */

/**
 * Check whether Meta has already delivered this message.
 */
export function hasMessageBeenProcessed(
  conversation,
  externalMessageId
) {
  if (
    !conversation ||
    !externalMessageId ||
    !Array.isArray(
      conversation.messages
    )
  ) {
    return false;
  }

  return conversation.messages.some(
    (message) =>
      String(
        message.externalMessageId ||
          ''
      ) ===
      String(externalMessageId)
  );
}

/*
 * ---------------------------------------------------------
 * SAVE INCOMING MESSAGE
 * ---------------------------------------------------------
 */

/**
 * Store an incoming WhatsApp message inside the conversation.
 */
export async function saveIncomingWhatsAppMessage({
  conversation,
  incoming,
}) {
  if (!conversation) {
    throw new Error(
      'Conversation is required.'
    );
  }

  if (!incoming) {
    throw new Error(
      'Incoming WhatsApp message is required.'
    );
  }

  /*
   * Prevent duplicate webhook deliveries.
   */
  if (
    hasMessageBeenProcessed(
      conversation,
      incoming.externalMessageId
    )
  ) {
    const existing =
      conversation.messages.find(
        (message) =>
          String(
            message.externalMessageId ||
              ''
          ) ===
          String(
            incoming.externalMessageId
          )
      );

    return {
      duplicate: true,
      message: existing,
      conversation,
    };
  }

  const createdAt =
    incoming.timestamp instanceof Date &&
    !Number.isNaN(
      incoming.timestamp.getTime()
    )
      ? incoming.timestamp
      : new Date();

  const message = {
    sender: 'customer',

    type:
      incoming.type ||
      'text',

    text:
      normalizeText(
        incoming.text
      ),

    media:
      incoming.media ||
      null,

    products: [],

    ai: {
      generated: false,

      confidence: null,

      intent: '',

      source: 'whatsapp',

      handoffRequested:
        false,

      toolCalls: [],
    },

    externalMessageId:
      incoming.externalMessageId
        ? String(
            incoming.externalMessageId
          )
        : '',

    metadata:
      incoming.metadata ||
      {},

    createdAt,
  };

  conversation.messages.push(
    message
  );

  conversation.lastMessageAt =
    createdAt;

  conversation.lastMessagePreview =
    message.text ||
    getMediaPreview(
      message.type
    );

  if (
    conversation.status !==
    'closed'
  ) {
    conversation.status =
      'open';
  }

  await conversation.save();

  const savedMessage =
    conversation.messages[
      conversation.messages.length - 1
    ];

  return {
    duplicate: false,

    message:
      savedMessage,

    conversation,
  };
}

function getMediaPreview(type) {
  switch (type) {
    case 'image':
      return 'Image';

    case 'video':
      return 'Video';

    case 'audio':
      return 'Audio';

    case 'document':
      return 'Document';

    default:
      return '';
  }
}

/*
 * ---------------------------------------------------------
 * SEND AI MESSAGE
 * ---------------------------------------------------------
 */

/**
 * Save an AI response and send it through WhatsApp.
 */
export async function sendAIWhatsAppResponse({
  conversation,
  customerPhone,
  aiResponse,
}) {
  if (!conversation) {
    throw new Error(
      'Conversation is required.'
    );
  }

  if (!customerPhone) {
    throw new Error(
      'Customer phone is required.'
    );
  }

  if (!aiResponse?.text) {
    throw new Error(
      'AI response text is required.'
    );
  }

  const text =
    normalizeText(
      aiResponse.text
    );

  /*
   * Send the text through the low-level integration.
   */
  const whatsappResult =
    await sendMessage(
      normalizePhone(
        customerPhone
      ),
      text
    );

  /*
   * Only store the AI message after the WhatsApp provider
   * accepted the outgoing request.
   */
  if (!whatsappResult?.sent) {
    return {
      sent: false,

      whatsapp:
        whatsappResult,

      message: null,
    };
  }

  const message = {
    sender: 'ai',

    type: 'text',

    text,

    media: null,

    products:
      Array.isArray(
        aiResponse.products
      )
        ? aiResponse.products
        : [],

    ai: {
      generated: true,

      confidence:
        aiResponse.confidence ??
        null,

      intent:
        aiResponse.intent ||
        '',

      source:
        aiResponse.source ||
        'ai',

      handoffRequested:
        Boolean(
          aiResponse.handoffRequested
        ),

      toolCalls: [],
    },

    externalMessageId:
      extractWhatsAppMessageId(
        whatsappResult
      ),

    metadata: {
      channel:
        WHATSAPP_CHANNEL,

      direction:
        'outbound',
    },

    createdAt:
      new Date(),
  };

  conversation.messages.push(
    message
  );

  conversation.lastMessageAt =
    message.createdAt;

  conversation.lastMessagePreview =
    text.slice(0, 300);

  await conversation.save();

  return {
    sent: true,

    whatsapp:
      whatsappResult,

    message:
      conversation.messages[
        conversation.messages.length - 1
      ],
  };
}

function extractWhatsAppMessageId(
  result
) {
  return (
    result?.data?.messages?.[0]?.id ||
    ''
  );
}

/*
 * ---------------------------------------------------------
 * SEND PRODUCT RESPONSE
 * ---------------------------------------------------------
 */

/**
 * Send a verified product image when the AI selected one.
 *
 * If the product has no image, the caller should already have
 * a text response and no image is sent.
 */
export async function sendWhatsAppProductResponse({
  conversation,
  customerPhone,
  product,
  caption = '',
}) {
  if (!product) {
    return {
      sent: false,
      reason:
        'Product is required.',
    };
  }

  if (!product.imageUrl) {
    return {
      sent: false,
      reason:
        'Product does not have a verified image.',
    };
  }

  const result =
    await sendImage(
      normalizePhone(
        customerPhone
      ),
      product.imageUrl,
      normalizeText(
        caption
      )
    );

  if (!result?.sent) {
    return {
      sent: false,
      whatsapp: result,
    };
  }

  /*
   * Record the product response in the conversation.
   */
  const message = {
    sender: 'ai',

    type: 'image',

    text:
      normalizeText(
        caption
      ),

    media: {
      url:
        product.imageUrl,
    },

    products: [
      {
        productId:
          product.productId,

        name:
          product.name || '',

        price:
          product.price ??
          product.effectivePrice ??
          null,

        compareAtPrice:
          product.compareAtPrice ??
          null,

        imageUrl:
          product.imageUrl,

        variantId:
          null,

        variantName:
          '',
      },
    ],

    ai: {
      generated: true,

      confidence: null,

      intent:
        'product_enquiry',

      source:
        'storefront',

      handoffRequested:
        false,

      toolCalls: [],
    },

    externalMessageId:
      extractWhatsAppMessageId(
        result
      ),

    metadata: {
      channel:
        WHATSAPP_CHANNEL,

      direction:
        'outbound',
    },

    createdAt:
      new Date(),
  };

  conversation.messages.push(
    message
  );

  conversation.lastMessageAt =
    message.createdAt;

  conversation.lastMessagePreview =
    product.name ||
    'Product';

  await conversation.save();

  return {
    sent: true,

    whatsapp: result,

    message:
      conversation.messages[
        conversation.messages.length - 1
      ],
  };
}

/*
 * ---------------------------------------------------------
 * PROCESS ONE INCOMING MESSAGE
 * ---------------------------------------------------------
 *
 * Main application pipeline.
 *
 * This function is intentionally provider-agnostic.
 *
 * If no AI provider is supplied, the message is saved but
 * no fake AI response is generated.
 */

export async function processIncomingWhatsAppMessage({
  storeId,
  incoming,
  provider = null,
  knowledgeBase = [],
}) {
  if (!storeId) {
    throw new Error(
      'Store ID is required.'
    );
  }

  if (!incoming?.phone) {
    throw new Error(
      'Incoming WhatsApp phone number is required.'
    );
  }

  /*
   * 1. Customer
   */
  const customer =
    await getOrCreateWhatsAppCustomer({
      storeId,

      phone:
        incoming.phone,

      name:
        incoming.name,
    });

  /*
   * 2. Conversation
   */
  const conversation =
    await getOrCreateWhatsAppConversation({
      storeId,

      customerId:
        customer._id,
    });

  /*
   * 3. Save incoming message
   */
  const saved =
    await saveIncomingWhatsAppMessage({
      conversation,

      incoming,
    });

  /*
   * Duplicate webhook:
   *
   * Do not send another AI reply.
   */
  if (saved.duplicate) {
    return {
      success: true,

      duplicate: true,

      customer,

      conversation,

      message:
        saved.message,

      response: null,
    };
  }

  /*
   * 4. Only text messages can currently enter the AI
   *    conversation pipeline.
   */
  const customerMessage =
    normalizeText(
      incoming.text
    );

  if (!customerMessage) {
    return {
      success: true,

      duplicate: false,

      customer,

      conversation,

      message:
        saved.message,

      response: null,

      handledBy:
        'whatsapp',
    };
  }

  /*
   * 5. If the conversation is explicitly human-controlled,
   *    do not invoke AI.
   */
  if (
    conversation.mode ===
    'human'
  ) {
    return {
      success: true,

      customer,

      conversation,

      message:
        saved.message,

      response: null,

      handledBy:
        'human',
    };
  }

  /*
   * 6. No provider yet.
   *
   * The message remains stored and the system does not
   * pretend that an AI response exists.
   */
  if (!provider) {
    return {
      success: true,

      customer,

      conversation,

      message:
        saved.message,

      response: null,

      handledBy:
        'ai_pending_provider',
    };
  }

  /*
   * 7. Prepare grounded AI request.
   */
  const prepared =
    await prepareAIConversationRequest({
      conversationId:
        conversation._id,

      storeId,

      customerMessage,

      knowledgeBase,
    });

  /*
   * 8. Human handoff.
   */
  if (
    prepared.handoffRequired ||
    prepared.responseMode?.mode ===
      'human_handoff'
  ) {
    const fallback =
      buildFallbackResponse({
        handoffRequired:
          true,
      });

    return {
      success: true,

      customer,

      conversation,

      message:
        saved.message,

      response:
        fallback,

      handledBy:
        'human',

      handoffRequired:
        true,
    };
  }

  /*
   * 9. Generate AI response.
   */
  const aiResult =
    await generateAIResponse({
      preparedRequest:
        prepared,

      provider,
    });

  /*
   * 10. AI validation failure.
   *
   * Never send an unsafe response.
   */
  if (!aiResult.success) {
    const fallback =
      aiResult.fallback ||
      buildFallbackResponse({
        handoffRequired:
          false,
      });

    /*
     * Store the fallback as an AI message only if we actually
     * intend to send it.
     */
    const sent =
      await sendAIWhatsAppResponse({
        conversation,

        customerPhone:
          customer.phone,

        aiResponse:
          fallback,
      });

    return {
      success: true,

      customer,

      conversation,

      message:
        saved.message,

      response:
        fallback,

      handledBy:
        'fallback',

      sent:
        sent.sent,

      error:
        aiResult.error ||
        null,
    };
  }

  /*
   * 11. Send validated AI response.
   */
  const response =
    aiResult.response;

  const sent =
    await sendAIWhatsAppResponse({
      conversation,

      customerPhone:
        customer.phone,

      aiResponse:
        response,
    });

  return {
    success:
      sent.sent,

    customer,

    conversation,

    message:
      saved.message,

    response,

    handledBy:
      'ai',

    sent:
      sent.sent,

    whatsapp:
      sent.whatsapp ||
      null,

    outboundMessage:
      sent.message ||
      null,
  };
}

/*
 * ---------------------------------------------------------
 * PROCESS WEBHOOK PAYLOAD
 * ---------------------------------------------------------
 *
 * This is the main function a webhook controller can call.
 *
 * Example:
 *
 * const result =
 *   await processWhatsAppWebhook({
 *     storeId,
 *     payload: req.body,
 *     provider,
 *   });
 */

export async function processWhatsAppWebhook({
  storeId,
  payload,
  provider = null,
  knowledgeBase = [],
}) {
  if (!storeId) {
    throw new Error(
      'Store ID is required.'
    );
  }

  const incomingMessages =
    parseWebhookMessages(
      payload
    );

  if (!incomingMessages.length) {
    return {
      success: true,

      processed: 0,

      results: [],
    };
  }

  const results = [];

  for (
    const incoming of incomingMessages
  ) {
    try {
      const result =
        await processIncomingWhatsAppMessage({
          storeId,

          incoming,

          provider,

          knowledgeBase,
        });

      results.push(result);
    } catch (error) {
      logger.error(
        'WhatsApp message processing failed',
        {
          message:
            error?.message,

          externalMessageId:
            incoming.externalMessageId,

          phone:
            incoming.phone,
        }
      );

      results.push({
        success: false,

        externalMessageId:
          incoming.externalMessageId,

        error:
          error?.message ||
          'Unable to process WhatsApp message.',
      });
    }
  }

  return {
    success: true,

    processed:
      results.length,

    results,
  };
}

/*
 * ---------------------------------------------------------
 * SEND SIMPLE TEXT
 * ---------------------------------------------------------
 *
 * Convenience wrapper for other backend services.
 */

export async function sendWhatsAppText({
  phone,
  text,
}) {
  const normalizedPhone =
    normalizePhone(phone);

  const normalizedText =
    normalizeText(text);

  if (!normalizedPhone) {
    throw new Error(
      'WhatsApp phone number is required.'
    );
  }

  if (!normalizedText) {
    throw new Error(
      'WhatsApp message text is required.'
    );
  }

  return sendMessage(
    normalizedPhone,
    normalizedText
  );
}

/*
 * ---------------------------------------------------------
 * EXPORT
 * ---------------------------------------------------------
 */

export default {
  parseWebhookMessages,

  parseIncomingMessage,

  getOrCreateWhatsAppCustomer,

  getOrCreateWhatsAppConversation,

  hasMessageBeenProcessed,

  saveIncomingWhatsAppMessage,

  sendAIWhatsAppResponse,

  sendWhatsAppProductResponse,

  processIncomingWhatsAppMessage,

  processWhatsAppWebhook,

  sendWhatsAppText,
};