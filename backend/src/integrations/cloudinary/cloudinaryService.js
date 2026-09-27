import { v2 as cloudinary } from 'cloudinary';
import { env } from '../../config/env.js';
import { AppError } from '../../utils/AppError.js';
import { logger } from '../../utils/logger.js';

cloudinary.config({
  cloud_name: env.cloudinary.cloudName,
  api_key: env.cloudinary.apiKey,
  api_secret: env.cloudinary.apiSecret,
});

function isConfigured() {
  return Boolean(env.cloudinary.cloudName && env.cloudinary.apiKey && env.cloudinary.apiSecret);
}

/**
 * Product images are uploaded through this service (base64 or a file
 * buffer from multipart form data) — never stored as binaries in MongoDB,
 * only the resulting secure URL + publicId.
 */
export async function uploadProductImage(fileDataUri, folder = 'stores/{storeId}/products') {
  if (!isConfigured()) {
    throw AppError.badRequest('Image upload is not configured on this server yet');
  }

  try {
    const result = await cloudinary.uploader.upload(fileDataUri, { folder });
    return { url: result.secure_url, publicId: result.public_id };
  } catch (err) {
    logger.error('Cloudinary upload failed', { message: err.message });
    throw AppError.badRequest('Image upload failed');
  }
}

export async function deleteProductImage(publicId) {
  if (!isConfigured() || !publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    logger.error('Cloudinary delete failed', { message: err.message, publicId });
  }
}
