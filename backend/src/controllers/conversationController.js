import mongoose from 'mongoose';

import {
  processCustomerEnquiry,
  buildAIMessage,
} from '../services/aiConversationService.js';

import claudeProvider from '../services/ai/claudeProvider.js';

import { Conversation } from '../models/Conversation.js';
import { Customer } from '../models/Customer.js';

import { getDefaultStoreId } from '../services/storeContext.js';

/*
 * ---------------------------------------------------------
 * HELPERS
 * ---------------------------------------------------------
 */

async function getStoreId(req) {
  return (
    req.storeId ||
    req.store?._id ||
    req.user?.storeId ||
    req.auth?.storeId ||
    await getDefaultStoreId()
  );
}

function isValidObjectId(value) {
  return mongoose.Types.ObjectId.isValid(value);
}

function normalizePagination(page, limit) {
  const normalizedPage = Math.max(
    Number(page) || 1,
    1
  );

  const normalizedLimit = Math.min(
    Math.max(Number(limit) || 20, 1),
    100
  );

  return {
    page: normalizedPage,
    limit: normalizedLimit,
    skip:
      (normalizedPage - 1) * normalizedLimit,
  };
}

function getMessagePreview(message) {
  if (!message) {
    return '';
  }

  if (message.text) {
    return message.text.slice(0, 300);
  }

  if (message.type === 'image') {
    return 'Image';
  }

  if (message.type === 'video') {
    return 'Video';
  }

  if (message.type === 'audio') {
    return 'Audio';
  }

  if (message.type === 'document') {
    return 'Document';
  }

  if (message.type === 'product') {
    return (
      message.products?.[0]?.name ||
      'Product'
    );
  }

  return '';
}

function sanitizeProductReference(product) {
  if (!product) {
    return null;
  }

  return {
    productId: product.productId,
    name: product.name || '',
    price:
      product.price !== undefined
        ? product.price
        : null,
    compareAtPrice:
      product.compareAtPrice !== undefined
        ? product.compareAtPrice
        : null,
    imageUrl: product.imageUrl || '',
    variantId: product.variantId || null,
    variantName:
      product.variantName || '',
  };
}

function sanitizeMessage(message) {
  if (!message) {
    return null;
  }

  return {
    _id: message._id,
    sender: message.sender,
    type: message.type,
    text: message.text || '',
    media: message.media || null,
    products: Array.isArray(message.products)
      ? message.products.map(
          sanitizeProductReference
        )
      : [],
    ai: message.ai || null,
    externalMessageId:
      message.externalMessageId || '',
    metadata: message.metadata || {},
    createdAt: message.createdAt,
  };
}

/*
 * ---------------------------------------------------------
 * CREATE / FIND CONVERSATION
 * ---------------------------------------------------------
 *
 * Creates a new conversation for a customer or returns the
 * customer's existing open conversation.
 *
 * This is useful when a WhatsApp message arrives:
 *
 * incoming message
 *      ↓
 * findOrCreateConversation()
 *      ↓
 * save customer message
 */

export async function findOrCreateConversation(
  req,
  res
) {
  try {
    const storeId = await getStoreId(req);
    const { customerId, channel = 'whatsapp' } =
      req.body;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'Store ID is required.',
      });
    }

    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: 'Customer ID is required.',
      });
    }

    if (!isValidObjectId(customerId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid customer ID.',
      });
    }

    if (
      ![
        'whatsapp',
        'instagram',
        'facebook',
        'web',
      ].includes(channel)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid conversation channel.',
      });
    }

    /*
     * Verify the customer belongs to this store.
     *
     * This prevents one store from accidentally accessing
     * another store's customers.
     */
    const customer = await Customer.findOne({
      _id: customerId,
      storeId,
    }).lean();

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found.',
      });
    }

    /*
     * Prefer an existing open/pending conversation.
     */
    let conversation =
      await Conversation.findOne({
        storeId,
        customerId,
        channel,
        status: {
          $in: ['open', 'pending'],
        },
      }).sort({
        lastMessageAt: -1,
      });

    if (!conversation) {
      conversation =
        await Conversation.create({
          storeId,
          customerId,
          channel,
          status: 'open',
          mode: 'ai',
          aiSettings: {
            enabled: true,
            autoReply: true,
            humanHandoff: true,
          },
          messages: [],
          lastMessageAt: new Date(),
          lastMessagePreview: '',
        });
    }

    return res.status(200).json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    console.error(
      'findOrCreateConversation error:',
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error?.message ||
        'Unable to create or find conversation.',
    });
  }
}

/*
 * ---------------------------------------------------------
 * CREATE CONVERSATION
 * ---------------------------------------------------------
 */

export async function createConversation(
  req,
  res
) {
  try {
    const storeId = await getStoreId(req);

    const {
      customerId,
      channel = 'whatsapp',
      mode = 'ai',
      status = 'open',
    } = req.body;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'Store ID is required.',
      });
    }

    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: 'Customer ID is required.',
      });
    }

    if (!isValidObjectId(customerId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid customer ID.',
      });
    }

    const customer = await Customer.findOne({
      _id: customerId,
      storeId,
    }).lean();

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found.',
      });
    }

    const conversation =
      await Conversation.create({
        storeId,
        customerId,
        channel,
        mode,
        status,
        messages: [],
        lastMessageAt: new Date(),
        lastMessagePreview: '',
        aiSettings: {
          enabled: mode !== 'human',
          autoReply: mode === 'ai',
          humanHandoff: true,
        },
      });

    return res.status(201).json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    console.error(
      'createConversation error:',
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error?.message ||
        'Unable to create conversation.',
    });
  }
}

/*
 * ---------------------------------------------------------
 * LIST CONVERSATIONS
 * ---------------------------------------------------------
 *
 * Used by the admin conversation inbox.
 */

export async function listConversations(
  req,
  res
) {
  try {
    const storeId = await getStoreId(req);

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'Store ID is required.',
      });
    }

    const {
      page = 1,
      limit = 20,
      search,
      status,
      mode,
      channel,
    } = req.query;

    const pagination =
      normalizePagination(page, limit);

    const filter = {
      storeId,
    };

    if (status) {
      filter.status = status;
    }

    if (mode) {
      filter.mode = mode;
    }

    if (channel) {
      filter.channel = channel;
    }

    /*
     * Customer search is handled separately because customer
     * name/phone/email live in the Customer collection.
     */
    if (search?.trim()) {
      const searchRegex =
        new RegExp(
          search.trim().replace(
            /[.*+?^${}()|[\]\\]/g,
            '\\$&'
          ),
          'i'
        );

      const matchingCustomers =
        await Customer.find({
          storeId,
          $or: [
            {
              name: searchRegex,
            },
            {
              phone: searchRegex,
            },
            {
              email: searchRegex,
            },
          ],
        })
          .select('_id')
          .lean();

      const customerIds =
        matchingCustomers.map(
          (customer) => customer._id
        );

      filter.$or = [
        {
          lastMessagePreview: searchRegex,
        },
      ];

      if (customerIds.length) {
        filter.$or.push({
          customerId: {
            $in: customerIds,
          },
        });
      }
    }

    const [conversations, total] =
      await Promise.all([
        Conversation.find(filter)
          .populate({
            path: 'customerId',
            select:
              'name phone email status tags acquisitionSource',
          })
          .populate({
            path: 'assignedTo',
            select: 'name email',
          })
          .sort({
            lastMessageAt: -1,
          })
          .skip(pagination.skip)
          .limit(pagination.limit)
          .lean(),

        Conversation.countDocuments(
          filter
        ),
      ]);

    return res.status(200).json({
      success: true,

      data: conversations,

      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        pages: Math.ceil(
          total / pagination.limit
        ),
      },
    });
  } catch (error) {
    console.error(
      'listConversations error:',
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error?.message ||
        'Unable to load conversations.',
    });
  }
}

/*
 * ---------------------------------------------------------
 * GET SINGLE CONVERSATION
 * ---------------------------------------------------------
 */

export async function getConversation(
  req,
  res
) {
  try {
    const storeId = await getStoreId(req);
    const { id } = req.params;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'Store ID is required.',
      });
    }

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid conversation ID.',
      });
    }

    const conversation =
      await Conversation.findOne({
        _id: id,
        storeId,
      })
        .populate({
          path: 'customerId',
          select:
            'name phone email status tags acquisitionSource',
        })
        .populate({
          path: 'assignedTo',
          select: 'name email',
        })
        .lean();

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found.',
      });
    }

    return res.status(200).json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    console.error(
      'getConversation error:',
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error?.message ||
        'Unable to load conversation.',
    });
  }
}

/*
 * ---------------------------------------------------------
 * ADD MESSAGE
 * ---------------------------------------------------------
 *
 * This is the basic message ingestion endpoint.
 *
 * IMPORTANT:
 * This function does NOT generate AI replies yet.
 *
 * It simply:
 *
 * customer message
 *      ↓
 * save message
 *      ↓
 * update conversation
 *
 * The AI service will be connected afterward.
 */

export async function addMessage(
  req,
  res
) {
  try {
    const storeId = await getStoreId(req);
    const { id } = req.params;
   
console.log('ADD MESSAGE PARAMS:', req.params);
console.log('ADD MESSAGE ID:', id);
console.log('ADD MESSAGE ID TYPE:', typeof id);
console.log(
  'ADD MESSAGE ID VALID:',
  mongoose.Types.ObjectId.isValid(id)
);

    const {
      sender,
      type = 'text',
      text = '',
      media = null,
      products = [],
      ai = {},
      externalMessageId = '',
      metadata = {},
    } = req.body;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'Store ID is required.',
      });
    }

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid conversation ID.',
      });
    }

    if (
      ![
        'customer',
        'business',
        'ai',
      ].includes(sender)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid message sender.',
      });
    }

    if (
      ![
        'text',
        'image',
        'video',
        'audio',
        'document',
        'product',
      ].includes(type)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid message type.',
      });
    }

    if (
      type === 'text' &&
      !String(text).trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Text is required for a text message.',
      });
    }

    const conversation =
      await Conversation.findOne({
        _id: id,
        storeId,
      });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found.',
      });
    }

    /*
     * Prevent duplicate webhook messages.
     */
    if (externalMessageId?.trim()) {
      const duplicate =
        conversation.messages.find(
          (message) =>
            message.externalMessageId ===
            externalMessageId.trim()
        );

      if (duplicate) {
        return res.status(200).json({
          success: true,
          duplicate: true,
          data: {
            conversationId:
              conversation._id,
            message:
              sanitizeMessage(duplicate),
          },
        });
      }
    }

    /*
     * Validate product references.
     *
     * We only accept product IDs here.
     * The actual product information should come from the
     * Product model when the AI/product service is built.
     */
    const normalizedProducts =
      Array.isArray(products)
        ? products
            .filter(
              (product) =>
                product?.productId &&
                isValidObjectId(
                  product.productId
                )
            )
            .map(
              sanitizeProductReference
            )
        : [];

    const message = {
      sender,
      type,
      text: String(text || '').trim(),
      media,
      products:
        normalizedProducts,
      ai: {
        generated:
          Boolean(ai?.generated),
        confidence:
          ai?.confidence ?? null,
        intent:
          ai?.intent || '',
        source:
          ai?.source || 'none',
        handoffRequested:
          Boolean(
            ai?.handoffRequested
          ),
        toolCalls:
          Array.isArray(
            ai?.toolCalls
          )
            ? ai.toolCalls
            : [],
      },
      externalMessageId:
        externalMessageId
          ? String(
              externalMessageId
            ).trim()
          : '',
      metadata:
        metadata || {},
      createdAt: new Date(),
    };

    conversation.messages.push(
      message
    );

    conversation.lastMessageAt =
      message.createdAt;

    conversation.lastMessagePreview =
      getMessagePreview(message);

    /*
     * If a customer sends a message, the conversation should
     * become open again unless it has explicitly been closed.
     */
    if (
      sender === 'customer' &&
      conversation.status !==
        'closed'
    ) {
      conversation.status = 'open';
    }

    await conversation.save();

    const savedMessage =
      conversation.messages[
        conversation.messages.length - 1
      ];

    return res.status(201).json({
      success: true,

      data: {
        conversationId:
          conversation._id,

        message:
          sanitizeMessage(
            savedMessage
          ),

        shouldAutoReply:
          sender === 'customer' &&
          conversation.mode ===
            'ai' &&
          conversation.aiSettings
            ?.enabled === true &&
          conversation.aiSettings
            ?.autoReply === true,
      },
    });
  } catch (error) {
    console.error(
      'addMessage error:',
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error?.message ||
        'Unable to add conversation message.',
    });
  }
}


/*
 * ---------------------------------------------------------
 * PROCESS CUSTOMER MESSAGE WITH AI
 * ---------------------------------------------------------
 *
 * Flow:
 *
 * customer message
 *      ↓
 * existing conversation
 *      ↓
 * AI context preparation
 *      ↓
 * product retrieval
 *      ↓
 * Claude
 *      ↓
 * response validation
 *      ↓
 * save AI message
 *
 * IMPORTANT:
 *
 * This function is intentionally separate from addMessage().
 *
 * addMessage() is responsible for storing messages.
 * processConversationWithAI() is responsible for AI handling.
 */

export async function processConversationWithAI(
  req,
  res
) {
  try {
    const storeId = await getStoreId(req);
    const { id } = req.params;

    const {
      customerMessage,
      knowledgeBase = [],
    } = req.body;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'Store ID is required.',
      });
    }

    if (!isValidObjectId(storeId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid store ID.',
      });
    }

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid conversation ID.',
      });
    }

    if (
      !String(customerMessage || '').trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Customer message is required.',
      });
    }

    /*
     * Verify the conversation belongs to this store.
     */
    const conversation =
      await Conversation.findOne({
        _id: id,
        storeId,
      });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found.',
      });
    }

    /*
     * -----------------------------------------------------
     * PROCESS THROUGH AI SERVICE
     * -----------------------------------------------------
     */

    const result =
      await processCustomerEnquiry({
        conversationId:
          conversation._id,

        storeId,

        customerMessage,

        knowledgeBase,

        provider:
          claudeProvider,
      });

    /*
     * -----------------------------------------------------
     * HUMAN HANDOFF
     * -----------------------------------------------------
     */

    if (
      result.handoffRequired ||
      result.handledBy === 'human'
    ) {
      return res.status(200).json({
        success: true,

        handledBy: 'human',

        handoffRequired: true,

        response:
          result.response,

        conversation:
          result.conversation,
      });
    }

    /*
     * -----------------------------------------------------
     * AI RESPONSE
     * -----------------------------------------------------
     */

    if (
      result.handledBy !== 'ai' ||
      !result.response
    ) {
      return res.status(200).json({
        success: true,

        handledBy:
          result.handledBy,

        handoffRequired:
          Boolean(
            result.handoffRequired
          ),

        response:
          result.response || null,

        context:
          result.context || null,
      });
    }

    /*
     * -----------------------------------------------------
     * BUILD SAFE AI MESSAGE
     * -----------------------------------------------------
     *
     * This is important.
     *
     * We do NOT directly save Claude's response.
     *
     * buildAIMessage() validates the product references
     * against the products retrieved from MongoDB.
     */

    const aiMessage =
      buildAIMessage({
        response:
          result.response,

        verifiedProducts:
          result.context
            ?.products || [],
      });

    if (
      !aiMessage.success
    ) {
      console.error(
        'AI message validation failed:',
        aiMessage.error
      );

      return res.status(200).json({
        success: true,

        handledBy:
          'fallback',

        handoffRequired:
          false,

        response:
          result.response,

        validationFailed:
          true,

        error:
          aiMessage.error,
      });
    }

    /*
     * -----------------------------------------------------
     * SAVE AI MESSAGE
     * -----------------------------------------------------
     */

    const savedConversation =
      await Conversation.findOne({
        _id: id,
        storeId,
      });

    if (!savedConversation) {
      return res.status(404).json({
        success: false,
        message:
          'Conversation no longer exists.',
      });
    }

    savedConversation.messages.push(
      aiMessage.message
    );

    const savedMessage =
      savedConversation.messages[
        savedConversation.messages.length - 1
      ];

    savedConversation.lastMessageAt =
      savedMessage.createdAt;

    savedConversation.lastMessagePreview =
      savedMessage.text ||
      '';

    /*
     * AI has replied, so the conversation remains open.
     */
    if (
      savedConversation.status !==
      'closed'
    ) {
      savedConversation.status =
        'open';
    }

    /*
     * If AI requested human handoff, mark the
     * conversation appropriately.
     */
    if (
      aiMessage.message.ai
        ?.handoffRequested
    ) {
      savedConversation.mode =
        'human';

      savedConversation.aiSettings.enabled =
        false;

      savedConversation.aiSettings.autoReply =
        false;
    }

    await savedConversation.save();

    return res.status(200).json({
      success: true,

      handledBy: 'ai',

      handoffRequired:
        Boolean(
          aiMessage.message.ai
            ?.handoffRequested
        ),

      conversationId:
        savedConversation._id,

      message:
        sanitizeMessage(
          savedMessage
        ),

      context: {
        products:
          result.context
            ?.products || [],
      },
    });
  } catch (error) {
    console.error(
      'processConversationWithAI error:',
      error
    );

    return res.status(500).json({
      success: false,

      message:
        error?.message ||
        'Unable to process conversation with AI.',
    });
  }
}
/*
 * ---------------------------------------------------------
 * UPDATE CONVERSATION
 * ---------------------------------------------------------
 *
 * Used by the admin interface to:
 *
 * - resolve conversation
 * - reopen conversation
 * - switch AI/human/hybrid
 * - assign staff
 * - change AI settings
 */

export async function updateConversation(
  req,
  res
) {
  try {
    const storeId = await getStoreId(req);
    const { id } = req.params;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'Store ID is required.',
      });
    }

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid conversation ID.',
      });
    }

    const conversation =
      await Conversation.findOne({
        _id: id,
        storeId,
      });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found.',
      });
    }

    const {
      status,
      mode,
      assignedTo,
      aiSettings,
      summary,
      context,
      metadata,
    } = req.body;

    if (
      status !== undefined
    ) {
      if (
        ![
          'open',
          'pending',
          'resolved',
          'closed',
        ].includes(status)
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Invalid conversation status.',
        });
      }

      conversation.status =
        status;
    }

    if (
      mode !== undefined
    ) {
      if (
        ![
          'ai',
          'human',
          'hybrid',
        ].includes(mode)
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Invalid conversation mode.',
        });
      }

      conversation.mode =
        mode;
    }

    if (
      assignedTo !== undefined
    ) {
      if (
        assignedTo !== null &&
        !isValidObjectId(
          assignedTo
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Invalid assigned user ID.',
        });
      }

      conversation.assignedTo =
        assignedTo;
    }

    if (
      aiSettings !== undefined
    ) {
      conversation.aiSettings = {
        ...conversation.aiSettings?.toObject?.(),
        ...conversation.aiSettings,
        ...aiSettings,
      };
    }

    if (
      summary !== undefined
    ) {
      conversation.summary =
        String(summary).trim();
    }

    if (
      context !== undefined
    ) {
      conversation.context = {
        ...conversation.context?.toObject?.(),
        ...conversation.context,
        ...context,
      };
    }

    if (
      metadata !== undefined
    ) {
      conversation.metadata = {
        ...conversation.metadata,
        ...metadata,
      };
    }

    /*
     * Keep AI settings consistent with handling mode.
     */
    if (mode === 'human') {
      conversation.aiSettings.enabled =
        false;

      conversation.aiSettings.autoReply =
        false;
    }

    if (mode === 'ai') {
      conversation.aiSettings.enabled =
        true;

      conversation.aiSettings.autoReply =
        true;
    }

    await conversation.save();

    return res.status(200).json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    console.error(
      'updateConversation error:',
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error?.message ||
        'Unable to update conversation.',
    });
  }
}

/*
 * ---------------------------------------------------------
 * MARK AS READ / RESOLVED
 * ---------------------------------------------------------
 */

export async function resolveConversation(
  req,
  res
) {
  try {
    const storeId = await getStoreId(req);
    const { id } = req.params;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'Store ID is required.',
      });
    }

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid conversation ID.',
      });
    }

    const conversation =
      await Conversation.findOneAndUpdate(
        {
          _id: id,
          storeId,
        },
        {
          $set: {
            status: 'resolved',
          },
        },
        {
          new: true,
        }
      );

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found.',
      });
    }

    return res.status(200).json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    console.error(
      'resolveConversation error:',
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error?.message ||
        'Unable to resolve conversation.',
    });
  }
}

/*
 * ---------------------------------------------------------
 * REOPEN CONVERSATION
 * ---------------------------------------------------------
 */

export async function reopenConversation(
  req,
  res
) {
  try {
    const storeId = await getStoreId(req);
    const { id } = req.params;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'Store ID is required.',
      });
    }

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid conversation ID.',
      });
    }

    const conversation =
      await Conversation.findOneAndUpdate(
        {
          _id: id,
          storeId,
        },
        {
          $set: {
            status: 'open',
          },
        },
        {
          new: true,
        }
      );

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found.',
      });
    }

    return res.status(200).json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    console.error(
      'reopenConversation error:',
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error?.message ||
        'Unable to reopen conversation.',
    });
  }
}

/*
 * ---------------------------------------------------------
 * DELETE / CLOSE CONVERSATION
 * ---------------------------------------------------------
 *
 * We don't physically delete conversations here.
 * Closing preserves the conversation history.
 */

export async function closeConversation(
  req,
  res
) {
  try {
    const storeId = await getStoreId(req);
    const { id } = req.params;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'Store ID is required.',
      });
    }

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid conversation ID.',
      });
    }

    const conversation =
      await Conversation.findOneAndUpdate(
        {
          _id: id,
          storeId,
        },
        {
          $set: {
            status: 'closed',
          },
        },
        {
          new: true,
        }
      );

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found.',
      });
    }

    return res.status(200).json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    console.error(
      'closeConversation error:',
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error?.message ||
        'Unable to close conversation.',
    });
  }
}