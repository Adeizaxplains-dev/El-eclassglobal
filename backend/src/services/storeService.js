import { Store } from '../models/Store.js';
import { AppError } from '../utils/AppError.js';
import { getDefaultStoreId } from './storeContext.js';

const STORE_FIELDS = [
  'name',
  'slug',
  'logoUrl',
  'contact',
  'social',
  'hours',
  'whatsapp',
  'automationSettings',
  'orderSettings',
  'paymentSettings',
  'deliverySettings',
  'currency',
  'locations',
  'sourcingCountries',
  'status',
].join(' ');

/**
 * Safely parse boolean values coming from API requests.
 *
 * Accepts:
 * - true / false
 * - "true" / "false"
 * - 1 / 0
 * - "1" / "0"
 *
 * Throws on invalid values instead of silently converting them.
 */
function parseBoolean(value, fieldName) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (value === 1 || value === '1' || value === 'true') {
    return true;
  }

  if (value === 0 || value === '0' || value === 'false') {
    return false;
  }

  throw AppError.badRequest(`${fieldName} must be a boolean`);
}

/**
 * Safely parse numeric values.
 */
function parseNumber(value, fieldName) {
  if (value === '' || value === null || value === undefined) {
    throw AppError.badRequest(`${fieldName} must be a valid number`);
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    throw AppError.badRequest(`${fieldName} must be a valid number`);
  }

  return parsed;
}

export async function getStoreSettings() {
  const storeId = await getDefaultStoreId();

  const store = await Store.findById(storeId).select(STORE_FIELDS);

  if (!store) {
    throw AppError.notFound('Store not found');
  }

  return store;
}

export async function updateStoreSettings(payload = {}) {
  const storeId = await getDefaultStoreId();

  const update = {};

  // Basic store information
  if (payload.name !== undefined) {
    update.name = String(payload.name).trim();
  }

  if (payload.slug !== undefined) {
    update.slug = String(payload.slug).trim().toLowerCase();
  }

  if (payload.logoUrl !== undefined) {
    update.logoUrl = String(payload.logoUrl).trim();
  }

  if (payload.currency !== undefined) {
    update.currency = String(payload.currency).trim().toUpperCase();
  }

  if (payload.status !== undefined) {
    update.status = payload.status;
  }

  if (payload.locations !== undefined) {
    if (!Array.isArray(payload.locations)) {
      throw AppError.badRequest('locations must be an array of strings');
    }
    update.locations = payload.locations.map((l) => String(l).trim()).filter(Boolean);
  }

  if (payload.sourcingCountries !== undefined) {
    if (!Array.isArray(payload.sourcingCountries)) {
      throw AppError.badRequest('sourcingCountries must be an array of strings');
    }
    update.sourcingCountries = payload.sourcingCountries.map((c) => String(c).trim()).filter(Boolean);
  }

  // Contact information
  if (payload.contact !== undefined) {
    if (payload.contact.email !== undefined) {
      update['contact.email'] = String(payload.contact.email)
        .trim()
        .toLowerCase();
    }

    if (payload.contact.phone !== undefined) {
      update['contact.phone'] = String(payload.contact.phone).trim();
    }

    if (payload.contact.address !== undefined) {
      update['contact.address'] = String(payload.contact.address).trim();
    }
  }

  // Social media
  if (payload.social !== undefined) {
    const socialFields = [
      'instagram',
      'facebook',
      'tiktok',
      'twitter',
      'youtube',
    ];

    for (const field of socialFields) {
      if (payload.social[field] !== undefined) {
        update[`social.${field}`] = String(payload.social[field]).trim();
      }
    }
  }

  // Opening hours
  if (payload.hours !== undefined) {
    const days = [
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
      'sunday',
    ];

    for (const day of days) {
      if (payload.hours[day] !== undefined) {
        update[`hours.${day}`] = String(payload.hours[day]).trim();
      }
    }
  }

  // WhatsApp settings
  if (payload.whatsapp !== undefined) {
    if (payload.whatsapp.number !== undefined) {
      update['whatsapp.number'] = String(payload.whatsapp.number).trim();
    }

    if (payload.whatsapp.enabled !== undefined) {
      update['whatsapp.enabled'] = parseBoolean(
        payload.whatsapp.enabled,
        'whatsapp.enabled'
      );
    }

    if (payload.whatsapp.orderNotifications !== undefined) {
      update['whatsapp.orderNotifications'] = parseBoolean(
        payload.whatsapp.orderNotifications,
        'whatsapp.orderNotifications'
      );
    }

    if (payload.whatsapp.customerEnquiries !== undefined) {
      update['whatsapp.customerEnquiries'] = parseBoolean(
        payload.whatsapp.customerEnquiries,
        'whatsapp.customerEnquiries'
      );
    }

    if (payload.whatsapp.abandonedCartMessages !== undefined) {
      update['whatsapp.abandonedCartMessages'] = parseBoolean(
        payload.whatsapp.abandonedCartMessages,
        'whatsapp.abandonedCartMessages'
      );
    }
  }

  // Automation settings
  if (payload.automationSettings !== undefined) {
    const automationSettings = payload.automationSettings;

    if (automationSettings.enabled !== undefined) {
      update['automationSettings.enabled'] = parseBoolean(
        automationSettings.enabled,
        'automationSettings.enabled'
      );
    }

    if (automationSettings.abandonedCart !== undefined) {
      if (automationSettings.abandonedCart.enabled !== undefined) {
        update['automationSettings.abandonedCart.enabled'] = parseBoolean(
          automationSettings.abandonedCart.enabled,
          'automationSettings.abandonedCart.enabled'
        );
      }

      if (automationSettings.abandonedCart.delayMinutes !== undefined) {
        update['automationSettings.abandonedCart.delayMinutes'] = parseNumber(
          automationSettings.abandonedCart.delayMinutes,
          'automationSettings.abandonedCart.delayMinutes'
        );
      }
    }

    if (automationSettings.paymentFollowUp !== undefined) {
      if (automationSettings.paymentFollowUp.enabled !== undefined) {
        update['automationSettings.paymentFollowUp.enabled'] = parseBoolean(
          automationSettings.paymentFollowUp.enabled,
          'automationSettings.paymentFollowUp.enabled'
        );
      }

      if (automationSettings.paymentFollowUp.delayMinutes !== undefined) {
        update[
          'automationSettings.paymentFollowUp.delayMinutes'
        ] = parseNumber(
          automationSettings.paymentFollowUp.delayMinutes,
          'automationSettings.paymentFollowUp.delayMinutes'
        );
      }
    }

    if (automationSettings.orderConfirmation !== undefined) {
      if (automationSettings.orderConfirmation.enabled !== undefined) {
        update['automationSettings.orderConfirmation.enabled'] = parseBoolean(
          automationSettings.orderConfirmation.enabled,
          'automationSettings.orderConfirmation.enabled'
        );
      }
    }

    if (automationSettings.shippingUpdate !== undefined) {
      if (automationSettings.shippingUpdate.enabled !== undefined) {
        update['automationSettings.shippingUpdate.enabled'] = parseBoolean(
          automationSettings.shippingUpdate.enabled,
          'automationSettings.shippingUpdate.enabled'
        );
      }
    }

    if (automationSettings.deliveryUpdate !== undefined) {
      if (automationSettings.deliveryUpdate.enabled !== undefined) {
        update['automationSettings.deliveryUpdate.enabled'] = parseBoolean(
          automationSettings.deliveryUpdate.enabled,
          'automationSettings.deliveryUpdate.enabled'
        );
      }
    }

    if (automationSettings.postPurchase !== undefined) {
      if (automationSettings.postPurchase.enabled !== undefined) {
        update['automationSettings.postPurchase.enabled'] = parseBoolean(
          automationSettings.postPurchase.enabled,
          'automationSettings.postPurchase.enabled'
        );
      }

      if (automationSettings.postPurchase.delayHours !== undefined) {
        update['automationSettings.postPurchase.delayHours'] = parseNumber(
          automationSettings.postPurchase.delayHours,
          'automationSettings.postPurchase.delayHours'
        );
      }
    }
  }

  // Order settings
  if (payload.orderSettings !== undefined) {
    if (payload.orderSettings.allowGuestCheckout !== undefined) {
      update['orderSettings.allowGuestCheckout'] = parseBoolean(
        payload.orderSettings.allowGuestCheckout,
        'orderSettings.allowGuestCheckout'
      );
    }

    if (payload.orderSettings.minimumOrderAmount !== undefined) {
      update['orderSettings.minimumOrderAmount'] = parseNumber(
        payload.orderSettings.minimumOrderAmount,
        'orderSettings.minimumOrderAmount'
      );
    }

    if (payload.orderSettings.allowOrderCancellation !== undefined) {
      update['orderSettings.allowOrderCancellation'] = parseBoolean(
        payload.orderSettings.allowOrderCancellation,
        'orderSettings.allowOrderCancellation'
      );
    }
  }

  // Payment settings
  if (payload.paymentSettings !== undefined) {
    if (payload.paymentSettings.paystackEnabled !== undefined) {
      update['paymentSettings.paystackEnabled'] = parseBoolean(
        payload.paymentSettings.paystackEnabled,
        'paymentSettings.paystackEnabled'
      );
    }

    if (payload.paymentSettings.cashOnDelivery !== undefined) {
      update['paymentSettings.cashOnDelivery'] = parseBoolean(
        payload.paymentSettings.cashOnDelivery,
        'paymentSettings.cashOnDelivery'
      );
    }

    if (payload.paymentSettings.bankTransfer !== undefined) {
      update['paymentSettings.bankTransfer'] = parseBoolean(
        payload.paymentSettings.bankTransfer,
        'paymentSettings.bankTransfer'
      );
    }
  }

  // Delivery settings
  if (payload.deliverySettings !== undefined) {
    if (payload.deliverySettings.deliveryFee !== undefined) {
      update['deliverySettings.deliveryFee'] = parseNumber(
        payload.deliverySettings.deliveryFee,
        'deliverySettings.deliveryFee'
      );
    }

    if (payload.deliverySettings.freeDeliveryThreshold !== undefined) {
      update['deliverySettings.freeDeliveryThreshold'] =
        payload.deliverySettings.freeDeliveryThreshold === null
          ? null
          : parseNumber(
              payload.deliverySettings.freeDeliveryThreshold,
              'deliverySettings.freeDeliveryThreshold'
            );
    }
  }

  if (Object.keys(update).length === 0) {
    throw AppError.badRequest('No valid store settings provided');
  }

  const store = await Store.findByIdAndUpdate(
    storeId,
    { $set: update },
    {
      new: true,
      runValidators: true,
    }
  ).select(STORE_FIELDS);

  if (!store) {
    throw AppError.notFound('Store not found');
  }

  return store;
}

