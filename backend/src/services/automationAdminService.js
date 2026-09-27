import mongoose from 'mongoose';

import { Automation } from '../models/Automation.js';
import { getDefaultStoreId } from './storeContext.js';
import { AppError } from '../utils/AppError.js';

const AUTOMATION_TYPES = [
  'abandoned_cart',
  'payment_followup',
  'order_confirmation',
  'shipping_update',
  'delivery_update',
  'post_purchase',
  'campaign',
];

const AUTOMATION_STATUSES = [
  'pending',
  'processing',
  'sent',
  'failed',
  'cancelled',
];

const AUTOMATION_CHANNELS = ['whatsapp'];

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function parsePositiveInt(value, fallback) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback;
  }

  return parsed;
}

function normalizeFilter(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim();

  return normalized || null;
}

function validateEnumFilter(value, allowedValues, fieldName) {
  if (!value) {
    return null;
  }

  if (!allowedValues.includes(value)) {
    throw AppError.badRequest(`Invalid ${fieldName}`, [
      {
        field: fieldName,
        message: `Expected one of: ${allowedValues.join(', ')}`,
      },
    ]);
  }

  return value;
}

function validateObjectId(value, fieldName) {
  if (!value) {
    return null;
  }

  if (!mongoose.isValidObjectId(value)) {
    throw AppError.badRequest(`Invalid ${fieldName}`, [
      {
        field: fieldName,
        message: `${fieldName} must be a valid ID`,
      },
    ]);
  }

  return new mongoose.Types.ObjectId(value);
}

function buildAutomationFilter({
  storeId,
  type,
  status,
  channel,
  customerId,
  campaignId,
  orderId,
}) {
  const filter = { storeId };

  const normalizedType = normalizeFilter(type);
  const normalizedStatus = normalizeFilter(status);
  const normalizedChannel = normalizeFilter(channel);
  const normalizedCustomerId = normalizeFilter(customerId);
  const normalizedCampaignId = normalizeFilter(campaignId);
  const normalizedOrderId = normalizeFilter(orderId);

  if (normalizedType) {
    filter.type = validateEnumFilter(
      normalizedType,
      AUTOMATION_TYPES,
      'type'
    );
  }

  if (normalizedStatus) {
    filter.status = validateEnumFilter(
      normalizedStatus,
      AUTOMATION_STATUSES,
      'status'
    );
  }

  if (normalizedChannel) {
    filter.channel = validateEnumFilter(
      normalizedChannel,
      AUTOMATION_CHANNELS,
      'channel'
    );
  }

  if (normalizedCustomerId) {
    filter.customerId = validateObjectId(
      normalizedCustomerId,
      'customerId'
    );
  }

  if (normalizedCampaignId) {
    filter.campaignId = validateObjectId(
      normalizedCampaignId,
      'campaignId'
    );
  }

  if (normalizedOrderId) {
    filter.orderId = validateObjectId(
      normalizedOrderId,
      'orderId'
    );
  }

  return filter;
}

/**
 * Return a high-level view of the automation engine for the
 * current store.
 */
export async function getAutomationOverview() {
  const storeId = await getDefaultStoreId();
  const now = new Date();

  const [
    total,
    statusRows,
    typeRows,
    channelRows,
    duePending,
    failed,
    sentToday,
  ] = await Promise.all([
    Automation.countDocuments({ storeId }),

    Automation.aggregate([
      {
        $match: { storeId },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]),

    Automation.aggregate([
      {
        $match: { storeId },
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
        },
      },
      {
        $sort: {
          count: -1,
          _id: 1,
        },
      },
    ]),

    Automation.aggregate([
      {
        $match: { storeId },
      },
      {
        $group: {
          _id: '$channel',
          count: { $sum: 1 },
        },
      },
      {
        $sort: {
          count: -1,
          _id: 1,
        },
      },
    ]),

    Automation.countDocuments({
      storeId,
      status: 'pending',
      scheduledFor: { $lte: now },
    }),

    Automation.countDocuments({
      storeId,
      status: 'failed',
    }),

    Automation.countDocuments({
      storeId,
      status: 'sent',
      sentAt: {
        $gte: new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        ),
      },
    }),
  ]);

  const byStatus = statusRows.reduce((acc, row) => {
    acc[row._id] = row.count;
    return acc;
  }, {});

  const byType = typeRows.reduce((acc, row) => {
    acc[row._id] = row.count;
    return acc;
  }, {});

  const byChannel = channelRows.reduce((acc, row) => {
    acc[row._id] = row.count;
    return acc;
  }, {});

  return {
    total,
    duePending,
    failed,
    sentToday,
    byStatus,
    byType,
    byChannel,
  };
}

/**
 * List automation records for the current store.
 */
export async function listAutomations({
  page = DEFAULT_PAGE,
  limit = DEFAULT_LIMIT,
  type,
  status,
  channel,
  customerId,
  campaignId,
  orderId,
} = {}) {
  const storeId = await getDefaultStoreId();

  const safePage = parsePositiveInt(page, DEFAULT_PAGE);

  const safeLimit = Math.min(
    parsePositiveInt(limit, DEFAULT_LIMIT),
    MAX_LIMIT
  );

  const filter = buildAutomationFilter({
    storeId,
    type,
    status,
    channel,
    customerId,
    campaignId,
    orderId,
  });

  const [items, total] = await Promise.all([
    Automation.find(filter)
      .sort({
        scheduledFor: -1,
        createdAt: -1,
      })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .populate('customerId', 'name phone status')
      .populate('campaignId', 'name status')
      .populate(
        'orderId',
        'orderNumber total paymentStatus orderStatus'
      )
      .lean(),

    Automation.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / safeLimit);

  return {
    items,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages,
      hasNextPage: safePage < totalPages,
      hasPreviousPage: safePage > 1,
    },
  };
}

/**
 * Get one automation record belonging to the current store.
 */
export async function getAutomationById(automationId) {
  if (!automationId) {
    throw AppError.badRequest('Automation ID is required');
  }

  const validAutomationId = validateObjectId(
    automationId,
    'automationId'
  );

  const storeId = await getDefaultStoreId();

  const automation = await Automation.findOne({
    _id: validAutomationId,
    storeId,
  })
    .populate('customerId', 'name phone status')
    .populate('campaignId', 'name status')
    .populate(
      'orderId',
      'orderNumber total paymentStatus orderStatus'
    )
    .lean();

  if (!automation) {
    throw AppError.notFound('Automation not found');
  }

  return automation;
}

/**
 * Cancel an automation that has not completed yet.
 */
export async function cancelAutomation(automationId) {
  if (!automationId) {
    throw AppError.badRequest('Automation ID is required');
  }

  const validAutomationId = validateObjectId(
    automationId,
    'automationId'
  );

  const storeId = await getDefaultStoreId();

  const automation = await Automation.findOne({
    _id: validAutomationId,
    storeId,
  });

  if (!automation) {
    throw AppError.notFound('Automation not found');
  }

  if (!['pending', 'processing'].includes(automation.status)) {
    throw AppError.badRequest(
      `Automation cannot be cancelled while it is ${automation.status}`
    );
  }

  automation.status = 'cancelled';
  automation.error = 'Cancelled by an administrator';

  await automation.save();

  return automation;
}

/**
 * Retry a failed automation immediately.
 *
 * The existing automation processor will pick it up because the
 * record is returned to pending status with a due scheduledFor time.
 */
export async function retryAutomation(automationId) {
  if (!automationId) {
    throw AppError.badRequest('Automation ID is required');
  }

  const validAutomationId = validateObjectId(
    automationId,
    'automationId'
  );

  const storeId = await getDefaultStoreId();

  const automation = await Automation.findOne({
    _id: validAutomationId,
    storeId,
  });

  if (!automation) {
    throw AppError.notFound('Automation not found');
  }

  if (automation.status !== 'failed') {
    throw AppError.badRequest(
      `Only failed automations can be retried; current status is ${automation.status}`
    );
  }

  automation.status = 'pending';
  automation.scheduledFor = new Date();
  automation.error = '';
  automation.failedAt = null;
  automation.lastAttemptAt = null;
  automation.attempts = 0;

  await automation.save();

  return automation;
}