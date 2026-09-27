// backend/src/services/conversationService.js

import mongoose from 'mongoose';

import { Conversation } from '../models/Conversation.js';
import { Product } from '../models/Product.js';

/*
 * ---------------------------------------------------------
 * CONVERSATION SERVICE
 * ---------------------------------------------------------
 *
 * Responsibilities:
 *
 * 1. Read conversation history
 * 2. Retrieve verified storefront products
 * 3. Calculate effective product pricing
 * 4. Handle product variants correctly
 * 5. Prepare grounded AI context
 * 6. Detect possible human handoff
 *
 * IMPORTANT:
 *
 * This service does NOT call Claude/OpenAI/Gemini.
 *
 * It only prepares verified information for the AI layer.
 *
 * The AI must never invent:
 *
 * - products
 * - prices
 * - stock
 * - variants
 * - images
 *
 * ---------------------------------------------------------
 */


/*
 * ---------------------------------------------------------
 * CONSTANTS
 * ---------------------------------------------------------
 */

const MAX_HISTORY_MESSAGES = 20;
const MAX_PRODUCT_RESULTS = 8;
const MAX_TEXT_LENGTH = 4096;


/*
 * ---------------------------------------------------------
 * HELPERS
 * ---------------------------------------------------------
 */

function isValidObjectId(value) {
  return mongoose.Types.ObjectId.isValid(value);
}


function normalizeText(value, maxLength = MAX_TEXT_LENGTH) {
  return String(value ?? '')
    .trim()
    .slice(0, maxLength);
}


function escapeRegex(value) {
  return String(value || '').replace(
    /[.*+?^${}()|[\]\\]/g,
    '\\$&'
  );
}


/*
 * ---------------------------------------------------------
 * VARIANT PRICE
 * ---------------------------------------------------------
 *
 * Variant pricing follows this rule:
 *
 * 1. If variant.priceOverride exists,
 *    use it.
 *
 * 2. Otherwise use product effective price.
 *
 * Product effective price:
 *
 * salePrice
 *      ↓
 * if valid sale
 *      ↓
 * otherwise basePrice
 *
 * ---------------------------------------------------------
 */

export function getProductEffectivePrice(product) {
  if (!product) {
    return null;
  }

  const basePrice =
    Number(product.basePrice);

  const salePrice =
    product.salePrice !== null &&
    product.salePrice !== undefined
      ? Number(product.salePrice)
      : null;

  if (
    Number.isFinite(salePrice) &&
    Number.isFinite(basePrice) &&
    salePrice < basePrice
  ) {
    return salePrice;
  }

  return Number.isFinite(basePrice)
    ? basePrice
    : null;
}


export function getVariantEffectivePrice(
  product,
  variant
) {
  if (!variant) {
    return getProductEffectivePrice(product);
  }

  const priceOverride =
    variant.priceOverride !== null &&
    variant.priceOverride !== undefined
      ? Number(variant.priceOverride)
      : null;

  if (
    Number.isFinite(priceOverride)
  ) {
    return priceOverride;
  }

  return getProductEffectivePrice(product);
}


/*
 * ---------------------------------------------------------
 * VARIANT NAME
 * ---------------------------------------------------------
 *
 * ProductVariant does not have a "name" field.
 *
 * We construct a human-readable name from:
 *
 * color + size
 *
 * Example:
 *
 * Black / XL
 * Red / 42
 * Large
 * Black
 *
 * SKU is kept separately.
 * ---------------------------------------------------------
 */

export function getVariantName(variant) {
  if (!variant) {
    return '';
  }

  const parts = [];

  if (variant.color) {
    parts.push(String(variant.color).trim());
  }

  if (variant.size) {
    parts.push(String(variant.size).trim());
  }

  return parts.join(' / ');
}


/*
 * ---------------------------------------------------------
 * SANITIZE PRODUCT IMAGE
 * ---------------------------------------------------------
 */

function sanitizeProductImages(images) {
  if (!Array.isArray(images)) {
    return [];
  }

  return images
    .filter((image) => image)
    .map((image) => ({
      url: image.url || '',
      publicId: image.publicId || '',
    }))
    .filter((image) => image.url);
}


/*
 * ---------------------------------------------------------
 * SANITIZE VARIANT
 * ---------------------------------------------------------
 *
 * This uses the REAL ProductVariant schema.
 * ---------------------------------------------------------
 */

export function serializeProductVariant(
  product,
  variant
) {
  if (!variant) {
    return null;
  }

  const price =
    getVariantEffectivePrice(
      product,
      variant
    );

  const variantName =
    getVariantName(variant);

  return {
    variantId: variant._id,

    sku: variant.sku || '',

    name: variantName,

    color:
      variant.color || '',

    size:
      variant.size || '',

    priceOverride:
      variant.priceOverride ?? null,

    price,

    stock:
      Number(variant.stock) || 0,

    imageUrl:
      variant.imageUrl || '',

    inStock:
      Number(variant.stock) > 0,
  };
}


/*
 * ---------------------------------------------------------
 * SERIALIZE PRODUCT
 * ---------------------------------------------------------
 *
 * IMPORTANT:
 *
 * This is the single source of truth for product information
 * exposed to the conversation/AI layer.
 *
 * Only information retrieved from MongoDB is returned.
 * ---------------------------------------------------------
 */

export function serializeProduct(product) {
  if (!product) {
    return null;
  }

  const basePrice =
    Number(product.basePrice);

  const salePrice =
    product.salePrice !== null &&
    product.salePrice !== undefined
      ? Number(product.salePrice)
      : null;

  const hasSale =
    Number.isFinite(salePrice) &&
    Number.isFinite(basePrice) &&
    salePrice < basePrice;

  const effectivePrice =
    hasSale
      ? salePrice
      : basePrice;

  const images =
    sanitizeProductImages(
      product.images
    );

  const variants =
    Array.isArray(product.variants)
      ? product.variants
          .map((variant) =>
            serializeProductVariant(
              product,
              variant
            )
          )
          .filter(Boolean)
      : [];

  const availableVariants =
    variants.filter(
      (variant) =>
        variant.stock > 0
    );

  const hasVariants =
    variants.length > 0;

  const isInStock =
    hasVariants
      ? availableVariants.length > 0
      : Number(product.stock) > 0;

  return {
    productId:
      product._id,

    name:
      product.name || '',

    slug:
      product.slug || '',

    description:
      product.description || '',

    /*
     * Product-level pricing.
     */
    basePrice:
      Number.isFinite(basePrice)
        ? basePrice
        : null,

    salePrice:
      Number.isFinite(salePrice)
        ? salePrice
        : null,

    effectivePrice,

    compareAtPrice:
      hasSale
        ? basePrice
        : null,

    /*
     * Product images.
     */
    images,

    imageUrl:
      images[0]?.url || '',

    /*
     * Product-level stock.
     *
     * This is relevant only when there are no variants.
     */
    stock:
      Number(product.stock) || 0,

    /*
     * Variant information.
     */
    hasVariants,

    variants,

    availableVariants,

    /*
     * Actual availability.
     */
    isInStock,

    /*
     * Category may be populated or may only contain an ID.
     */
    category:
      product.categoryId
        ? {
            _id:
              product.categoryId._id ||
              product.categoryId,

            name:
              product.categoryId.name ||
              '',

            slug:
              product.categoryId.slug ||
              '',
          }
        : null,
  };
}


/*
 * ---------------------------------------------------------
 * SANITIZE MESSAGE PRODUCT REFERENCE
 * ---------------------------------------------------------
 */

function sanitizeProductReference(
  product
) {
  if (!product) {
    return null;
  }

  return {
    productId:
      product.productId,

    name:
      product.name || '',

    price:
      product.price !== undefined
        ? product.price
        : null,

    compareAtPrice:
      product.compareAtPrice !== undefined
        ? product.compareAtPrice
        : null,

    imageUrl:
      product.imageUrl || '',

    variantId:
      product.variantId || null,

    variantName:
      product.variantName || '',
  };
}


/*
 * ---------------------------------------------------------
 * MESSAGE PREVIEW
 * ---------------------------------------------------------
 */

export function getMessagePreview(
  message
) {
  if (!message) {
    return '';
  }

  if (message.text) {
    return normalizeText(
      message.text,
      300
    );
  }

  switch (message.type) {
    case 'image':
      return 'Image';

    case 'video':
      return 'Video';

    case 'audio':
      return 'Audio';

    case 'document':
      return 'Document';

    case 'product':
      return (
        message.products?.[0]?.name ||
        'Product'
      );

    default:
      return '';
  }
}


/*
 * ---------------------------------------------------------
 * MESSAGE SERIALIZATION
 * ---------------------------------------------------------
 */

export function sanitizeMessage(
  message
) {
  if (!message) {
    return null;
  }

  return {
    _id:
      message._id,

    sender:
      message.sender,

    type:
      message.type,

    text:
      message.text || '',

    media:
      message.media || null,

    products:
      Array.isArray(message.products)
        ? message.products
            .map(
              sanitizeProductReference
            )
            .filter(Boolean)
        : [],

    ai:
      message.ai || null,

    externalMessageId:
      message.externalMessageId || '',

    metadata:
      message.metadata || {},

    createdAt:
      message.createdAt,
  };
}


/*
 * ---------------------------------------------------------
 * CONVERSATION HISTORY
 * ---------------------------------------------------------
 */

export function getConversationHistory(
  conversation,
  limit = MAX_HISTORY_MESSAGES
) {
  if (
    !conversation ||
    !Array.isArray(
      conversation.messages
    )
  ) {
    return [];
  }

  const safeLimit = Math.min(
    Math.max(
      Number(limit) || MAX_HISTORY_MESSAGES,
      1
    ),
    MAX_HISTORY_MESSAGES
  );

  return conversation.messages
    .slice(-safeLimit)
    .map((message) => ({
      sender:
        message.sender,

      type:
        message.type,

      text:
        message.text || '',

      products:
        Array.isArray(
          message.products
        )
          ? message.products
              .map(
                sanitizeProductReference
              )
              .filter(Boolean)
          : [],

      createdAt:
        message.createdAt,
    }));
}


/*
 * ---------------------------------------------------------
 * PRODUCT SELECT
 * ---------------------------------------------------------
 *
 * We explicitly select only fields needed by the AI layer.
 * ---------------------------------------------------------
 */

const PRODUCT_AI_FIELDS = [
  'name',
  'slug',
  'description',
  'images',
  'basePrice',
  'salePrice',
  'stock',
  'variants',
  'categoryId',
].join(' ');


/*
 * ---------------------------------------------------------
 * PRODUCT SEARCH
 * ---------------------------------------------------------
 *
 * Primary search uses MongoDB text index.
 * ---------------------------------------------------------
 */

export async function searchProducts(
  storeId,
  query,
  limit = MAX_PRODUCT_RESULTS
) {
  if (
    !storeId ||
    !isValidObjectId(storeId)
  ) {
    return [];
  }

  const searchText =
    normalizeText(query);

  if (!searchText) {
    return [];
  }

  const safeLimit = Math.min(
    Math.max(Number(limit) || 1, 1),
    MAX_PRODUCT_RESULTS
  );

  const products =
    await Product.find({
      storeId,
      status: 'active',
      $text: {
        $search: searchText,
      },
    })
      .select(
        PRODUCT_AI_FIELDS
      )
      .populate(
        'categoryId',
        'name slug'
      )
      .sort({
        score: {
          $meta: 'textScore',
        },
        createdAt: -1,
      })
      .limit(safeLimit)
      .lean();

  return products
    .map(serializeProduct)
    .filter(Boolean);
}


/*
 * ---------------------------------------------------------
 * PRODUCT NAME SEARCH
 * ---------------------------------------------------------
 *
 * Fallback for cases where Mongo text search does not return
 * anything useful.
 * ---------------------------------------------------------
 */

export async function searchProductsByName(
  storeId,
  query,
  limit = MAX_PRODUCT_RESULTS
) {
  if (
    !storeId ||
    !isValidObjectId(storeId)
  ) {
    return [];
  }

  const searchText =
    normalizeText(query);

  if (!searchText) {
    return [];
  }

  const escaped =
    escapeRegex(searchText);

  const safeLimit = Math.min(
    Math.max(Number(limit) || 1, 1),
    MAX_PRODUCT_RESULTS
  );

  const products =
    await Product.find({
      storeId,
      status: 'active',

      name: {
        $regex: escaped,
        $options: 'i',
      },
    })
      .select(
        PRODUCT_AI_FIELDS
      )
      .populate(
        'categoryId',
        'name slug'
      )
      .sort({
        createdAt: -1,
      })
      .limit(safeLimit)
      .lean();

  return products
    .map(serializeProduct)
    .filter(Boolean);
}


/*
 * ---------------------------------------------------------
 * DESCRIPTION SEARCH FALLBACK
 * ---------------------------------------------------------
 *
 * Useful when a customer asks for something described in the
 * product description rather than using the exact product
 * name.
 * ---------------------------------------------------------
 */

export async function searchProductsByDescription(
  storeId,
  query,
  limit = MAX_PRODUCT_RESULTS
) {
  if (
    !storeId ||
    !isValidObjectId(storeId)
  ) {
    return [];
  }

  const searchText =
    normalizeText(query);

  if (!searchText) {
    return [];
  }

  const escaped =
    escapeRegex(searchText);

  const safeLimit = Math.min(
    Math.max(Number(limit) || 1, 1),
    MAX_PRODUCT_RESULTS
  );

  const products =
    await Product.find({
      storeId,
      status: 'active',

      description: {
        $regex: escaped,
        $options: 'i',
      },
    })
      .select(
        PRODUCT_AI_FIELDS
      )
      .populate(
        'categoryId',
        'name slug'
      )
      .sort({
        createdAt: -1,
      })
      .limit(safeLimit)
      .lean();

  return products
    .map(serializeProduct)
    .filter(Boolean);
}


/*
 * ---------------------------------------------------------
 * GET PRODUCT BY ID
 * ---------------------------------------------------------
 */

export async function getProductForConversation(
  storeId,
  productId
) {
  if (
    !storeId ||
    !isValidObjectId(storeId) ||
    !isValidObjectId(productId)
  ) {
    return null;
  }

  const product =
    await Product.findOne({
      _id: productId,
      storeId,
      status: 'active',
    })
      .select(
        PRODUCT_AI_FIELDS
      )
      .populate(
        'categoryId',
        'name slug'
      )
      .lean();

  return serializeProduct(
    product
  );
}


/*
 * ---------------------------------------------------------
 * BUILD PRODUCT CONTEXT
 * ---------------------------------------------------------
 *
 * Search strategy:
 *
 * 1. Mongo text search
 * 2. Product-name search
 * 3. Description search
 *
 * The result is deduplicated.
 * ---------------------------------------------------------
 */

export async function buildProductContext(
  storeId,
  customerMessage
) {
  const query =
    normalizeText(
      customerMessage
    );

  if (!query) {
    return [];
  }

  let products =
    await searchProducts(
      storeId,
      query
    );

  if (!products.length) {
    products =
      await searchProductsByName(
        storeId,
        query
      );
  }

  if (!products.length) {
    products =
      await searchProductsByDescription(
        storeId,
        query
      );
  }

  /*
   * Deduplicate products by ID.
   */
  const seen = new Set();

  return products.filter(
    (product) => {
      const id =
        String(
          product.productId
        );

      if (seen.has(id)) {
        return false;
      }

      seen.add(id);

      return true;
    }
  );
}


/*
 * ---------------------------------------------------------
 * BUILD CONVERSATION CONTEXT
 * ---------------------------------------------------------
 */

export async function buildConversationContext(
  conversation,
  customerMessage
) {
  if (!conversation) {
    throw new Error(
      'Conversation is required.'
    );
  }

  const storeId =
    conversation.storeId;

  if (
    !storeId ||
    !isValidObjectId(storeId)
  ) {
    throw new Error(
      'Conversation does not contain a valid store ID.'
    );
  }

  const message =
    normalizeText(
      customerMessage
    );

  const history =
    getConversationHistory(
      conversation
    );

  const products =
    await buildProductContext(
      storeId,
      message
    );

  return {
    conversation: {
      conversationId:
        conversation._id,

      storeId,

      customerId:
        conversation.customerId,

      channel:
        conversation.channel,

      mode:
        conversation.mode,

      status:
        conversation.status,

      summary:
        conversation.summary || '',
    },

    customerMessage:
      message,

    history,

    products,

    rules: {
      neverInventProduct:
        true,

      neverInventPrice:
        true,

      neverInventImage:
        true,

      neverInventStock:
        true,

      neverInventVariant:
        true,

      useStorefrontPrice:
        true,

      useStorefrontProductName:
        true,

      useStorefrontImage:
        true,

      useStorefrontVariant:
        true,

      mentionOnlyRetrievedProducts:
        true,
    },
  };
}


/*
 * ---------------------------------------------------------
 * BUILD PRODUCT RESPONSE
 * ---------------------------------------------------------
 *
 * This is the clean format used by the AI layer and
 * WhatsApp response builder.
 * ---------------------------------------------------------
 */

export function buildProductResponse(
  product
) {
  if (!product) {
    return null;
  }

  return {
    productId:
      product.productId,

    name:
      product.name,

    slug:
      product.slug,

    price:
      product.effectivePrice,

    basePrice:
      product.basePrice,

    salePrice:
      product.salePrice,

    compareAtPrice:
      product.compareAtPrice,

    imageUrl:
      product.imageUrl,

    images:
      product.images || [],

    inStock:
      product.isInStock,

    stock:
      product.stock,

    hasVariants:
      product.hasVariants,

    variants:
      Array.isArray(
        product.variants
      )
        ? product.variants
        : [],

    availableVariants:
      Array.isArray(
        product.availableVariants
      )
        ? product.availableVariants
        : [],
  };
}


/*
 * ---------------------------------------------------------
 * HUMAN HANDOFF
 * ---------------------------------------------------------
 */

export function shouldRequestHumanHandoff(
  conversation,
  customerMessage
) {
  if (!conversation) {
    return false;
  }

  if (
    conversation.mode ===
    'human'
  ) {
    return true;
  }

  if (
    conversation.aiSettings
      ?.humanHandoff !== true
  ) {
    return false;
  }

  const text =
    normalizeText(
      customerMessage
    ).toLowerCase();

  if (!text) {
    return false;
  }

  const handoffPhrases = [
    'talk to a human',
    'speak to a human',
    'talk to someone',
    'speak to someone',
    'talk to an agent',
    'speak to an agent',
    'human agent',
    'real person',
    'actual person',
    'customer service agent',
    'contact the owner',
    'contact the business owner',
    'i want the owner',
    'speak with the owner',
    'talk with the owner',
    'call me',
  ];

  return handoffPhrases.some(
    (phrase) =>
      text.includes(phrase)
  );
}


/*
 * ---------------------------------------------------------
 * PREPARE CUSTOMER ENQUIRY
 * ---------------------------------------------------------
 *
 * Main service entry point used by:
 *
 * - conversation controller
 * - WhatsApp webhook
 * - AI conversation service
 *
 * ---------------------------------------------------------
 */

export async function prepareCustomerEnquiry({
  conversationId,
  storeId,
  customerMessage,
}) {
  if (
    !conversationId ||
    !isValidObjectId(
      conversationId
    )
  ) {
    throw new Error(
      'Valid conversation ID is required.'
    );
  }

  if (
    !storeId ||
    !isValidObjectId(storeId)
  ) {
    throw new Error(
      'Valid store ID is required.'
    );
  }

  const message =
    normalizeText(
      customerMessage
    );

  if (!message) {
    throw new Error(
      'Customer message is required.'
    );
  }

  const conversation =
    await Conversation.findOne({
      _id: conversationId,
      storeId,
    });

  if (!conversation) {
    throw new Error(
      'Conversation not found.'
    );
  }

  const context =
    await buildConversationContext(
      conversation,
      message
    );

  const handoff =
    shouldRequestHumanHandoff(
      conversation,
      message
    );

  return {
    conversation,

    context,

    handoffRequired:
      handoff,

    response: null,
  };
}


/*
 * ---------------------------------------------------------
 * EXPORT
 * ---------------------------------------------------------
 */

export default {
  getProductEffectivePrice,

  getVariantEffectivePrice,

  getVariantName,

  serializeProductVariant,

  serializeProduct,

  getMessagePreview,

  sanitizeMessage,

  getConversationHistory,

  searchProducts,

  searchProductsByName,

  searchProductsByDescription,

  getProductForConversation,

  buildProductContext,

  buildConversationContext,

  buildProductResponse,

  shouldRequestHumanHandoff,

  prepareCustomerEnquiry,
};