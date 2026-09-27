import { catchAsync } from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/apiResponse.js';
import * as productService from '../services/productService.js';
import { recordEvent } from '../services/eventService.js';
import { Store } from '../models/Store.js';
import {
  buildWhatsAppLink,
  buildProductEnquiryMessage,
} from '../utils/whatsappLink.js';

// ============================================================
// PUBLIC STOREFRONT
// ============================================================

export const listProducts = catchAsync(async (req, res) => {
  const result = await productService.listProducts(req.query);

  sendSuccess(res, {
    data: {
      items: result.items,
      pagination: result.pagination,
    },
  });
});

export const getProduct = catchAsync(async (req, res) => {
  const product = await productService.getProductBySlug(req.params.slug);

  const related = await productService.getRelatedProducts(product);

  // Record product view when a session ID is provided
  if (req.query.sessionId) {
    await recordEvent({
      type: 'product_view',
      sessionId: req.query.sessionId,
      metadata: {
        productId: product._id.toString(),
        slug: product.slug,
      },
    });
  }

  // Build WhatsApp enquiry link
  const store = await Store.findById(product.storeId);

  const whatsappLink =
  store?.whatsapp?.number
    ? buildWhatsAppLink(
        store.whatsapp.number,
        buildProductEnquiryMessage({
          storeName: store.name,
          productName: product.name,
          price: product.getEffectivePrice(),
        })
      )
    : null;

  sendSuccess(res, {
    data: {
      product,
      related,
      whatsappLink,
    },
  });
});

// ============================================================
// ADMIN
// ============================================================

export const listProductsAdmin = catchAsync(async (req, res) => {
  const result = await productService.listProductsForAdmin(req.query);

  sendSuccess(res, {
    data: result,
  });
});

export const getProductAdmin = catchAsync(async (req, res) => {
  const product = await productService.getProductForAdmin(req.params.id);

  sendSuccess(res, {
    data: product,
  });
});

export const createProduct = catchAsync(async (req, res) => {
  const product = await productService.createProduct(req.body);

  sendSuccess(res, {
    data: product,
    statusCode: 201,
    message: 'Product created',
  });
});

export const updateProduct = catchAsync(async (req, res) => {
  const product = await productService.updateProduct(
    req.params.id,
    req.body
  );

  sendSuccess(res, {
    data: product,
    message: 'Product updated',
  });
});

export const archiveProduct = catchAsync(async (req, res) => {
  await productService.archiveProduct(req.params.id);

  sendSuccess(res, {
    message: 'Product archived',
  });
});

export const lowStockProducts = catchAsync(async (req, res) => {
  const threshold = Number(req.query.threshold) || 5;

  const products = await productService.listLowStockProducts(threshold);

  sendSuccess(res, {
    data: products,
  });
});