import { catchAsync } from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/apiResponse.js';
import * as storeService from '../services/storeService.js';

// Public store information
// Used by the storefront for business/contact information,
// social links, opening hours, delivery information, currency,
// and WhatsApp availability.
export const getStoreInfo = catchAsync(async (req, res) => {
  const store = await storeService.getStoreSettings();

  sendSuccess(res, {
    data: store,
  });
});

// Admin — get complete store settings
export const getStoreSettings = catchAsync(async (req, res) => {
  const store = await storeService.getStoreSettings();

  sendSuccess(res, {
    data: store,
  });
});

// Admin — update store settings
export const updateStoreSettings = catchAsync(async (req, res) => {
  const store = await storeService.updateStoreSettings(req.body);

  sendSuccess(res, {
    data: store,
    message: 'Store settings updated successfully',
  });
});