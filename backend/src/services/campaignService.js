import mongoose from 'mongoose';

import { Customer } from '../models/Customer.js';
import { Automation } from '../models/Automation.js';
import { AppError } from '../utils/AppError.js';
import { getDefaultStoreId } from './storeContext.js';
import { Campaign } from '../models/Campaign.js';

/**
 * ---------------------------------------------------------
 * CONSTANTS
 * ---------------------------------------------------------
 */

const MAX_PAGE_SIZE = 100;

const ALLOWED_CHANNELS = ['whatsapp'];

const CAMPAIGN_LAUNCH_BLOCKED_STATUSES = [
  'running',
  'completed',
  'cancelled',
];

/**
 * ---------------------------------------------------------
 * BASIC VALIDATION HELPERS
 * ---------------------------------------------------------
 */

function parseFiniteNumber(value, fieldName, options = {}) {
  const { min = null, max = null } = options;

  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    throw AppError.badRequest(
      `${fieldName} must be a valid number`
    );
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    throw AppError.badRequest(
      `${fieldName} must be a valid number`
    );
  }

  if (min !== null && number < min) {
    throw AppError.badRequest(
      `${fieldName} cannot be less than ${min}`
    );
  }

  if (max !== null && number > max) {
    throw AppError.badRequest(
      `${fieldName} cannot be greater than ${max}`
    );
  }

  return number;
}

function parseDate(value, fieldName) {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw AppError.badRequest(
      `Invalid ${fieldName} date`
    );
  }

  return date;
}

function normalizeString(value) {
  return typeof value === 'string'
    ? value.trim()
    : value;
}

function normalizeStringArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return [
    ...new Set(
      value
        .filter(
          (item) =>
            typeof item === 'string'
        )
        .map((item) => item.trim())
        .filter(Boolean)
    ),
  ];
}

function validateObjectId(value, fieldName = 'ID') {
  if (
    !mongoose.Types.ObjectId.isValid(value)
  ) {
    throw AppError.badRequest(
      `Invalid ${fieldName}`
    );
  }

  return value;
}

function validateChannel(channel) {
  if (
    channel !== undefined &&
    channel !== null &&
    !ALLOWED_CHANNELS.includes(channel)
  ) {
    throw AppError.badRequest(
      `Unsupported campaign channel: ${channel}`
    );
  }

  return channel;
}

/**
 * ---------------------------------------------------------
 * NORMALIZE AUDIENCE
 * ---------------------------------------------------------
 *
 * Keeps the stored audience predictable and prevents values
 * such as empty strings, duplicate tags, NaN and negatives
 * from entering campaign definitions.
 */
function normalizeAudience(audience = {}) {
  if (
    !audience ||
    typeof audience !== 'object' ||
    Array.isArray(audience)
  ) {
    throw AppError.badRequest(
      'Campaign audience must be an object'
    );
  }

  const normalized = {};

  /*
   * Customer status
   */
  if (
    Object.prototype.hasOwnProperty.call(
      audience,
      'customerStatus'
    )
  ) {
    const values =
      normalizeStringArray(
        audience.customerStatus
      );

    if (values.length > 0) {
      normalized.customerStatus = values;
    }
  }

  /*
   * Acquisition source
   */
  if (
    Object.prototype.hasOwnProperty.call(
      audience,
      'acquisitionSource'
    )
  ) {
    const values =
      normalizeStringArray(
        audience.acquisitionSource
      );

    if (values.length > 0) {
      normalized.acquisitionSource = values;
    }
  }

  /*
   * Acquisition campaign
   */
  if (
    Object.prototype.hasOwnProperty.call(
      audience,
      'acquisitionCampaign'
    )
  ) {
    const value =
      normalizeString(
        audience.acquisitionCampaign
      );

    if (value) {
      normalized.acquisitionCampaign =
        value;
    }
  }

  /*
   * Tags
   */
  if (
    Object.prototype.hasOwnProperty.call(
      audience,
      'tags'
    )
  ) {
    const values =
      normalizeStringArray(
        audience.tags
      );

    if (values.length > 0) {
      normalized.tags = values;
    }
  }

  /*
   * Minimum orders
   */
  if (
    audience.minTotalOrders !== null &&
    audience.minTotalOrders !== undefined &&
    audience.minTotalOrders !== ''
  ) {
    normalized.minTotalOrders =
      parseFiniteNumber(
        audience.minTotalOrders,
        'minTotalOrders',
        { min: 0 }
      );
  }

  /*
   * Maximum orders
   */
  if (
    audience.maxTotalOrders !== null &&
    audience.maxTotalOrders !== undefined &&
    audience.maxTotalOrders !== ''
  ) {
    normalized.maxTotalOrders =
      parseFiniteNumber(
        audience.maxTotalOrders,
        'maxTotalOrders',
        { min: 0 }
      );
  }

  /*
   * Minimum spent
   */
  if (
    audience.minTotalSpent !== null &&
    audience.minTotalSpent !== undefined &&
    audience.minTotalSpent !== ''
  ) {
    normalized.minTotalSpent =
      parseFiniteNumber(
        audience.minTotalSpent,
        'minTotalSpent',
        { min: 0 }
      );
  }

  /*
   * Maximum spent
   */
  if (
    audience.maxTotalSpent !== null &&
    audience.maxTotalSpent !== undefined &&
    audience.maxTotalSpent !== ''
  ) {
    normalized.maxTotalSpent =
      parseFiniteNumber(
        audience.maxTotalSpent,
        'maxTotalSpent',
        { min: 0 }
      );
  }

  /*
   * Validate logical ranges.
   */
  if (
    normalized.minTotalOrders !== undefined &&
    normalized.maxTotalOrders !== undefined &&
    normalized.minTotalOrders >
      normalized.maxTotalOrders
  ) {
    throw AppError.badRequest(
      'minTotalOrders cannot be greater than maxTotalOrders'
    );
  }

  if (
    normalized.minTotalSpent !== undefined &&
    normalized.maxTotalSpent !== undefined &&
    normalized.minTotalSpent >
      normalized.maxTotalSpent
  ) {
    throw AppError.badRequest(
      'minTotalSpent cannot be greater than maxTotalSpent'
    );
  }

  /*
   * Inactive customers.
   */
  if (
    audience.inactiveSince !== null &&
    audience.inactiveSince !== undefined &&
    audience.inactiveSince !== ''
  ) {
    const inactiveSince =
      parseDate(
        audience.inactiveSince,
        'inactiveSince'
      );

    normalized.inactiveSince =
      inactiveSince.toISOString();
  }

  return normalized;
}

/**
 * ---------------------------------------------------------
 * BUILD CUSTOMER FILTER
 * ---------------------------------------------------------
 *
 * Converts the campaign audience definition into a MongoDB
 * Customer query.
 *
 * The campaign stores criteria rather than a permanent list
 * of customer IDs.
 */
function buildAudienceFilter(audience = {}) {
  const normalized =
    normalizeAudience(audience);

  const filter = {};

  /*
   * Customer status
   */
  if (
    Array.isArray(
      normalized.customerStatus
    ) &&
    normalized.customerStatus.length > 0
  ) {
    filter.customerStatus = {
      $in: normalized.customerStatus,
    };
  }

  /*
   * Acquisition source
   */
  if (
    Array.isArray(
      normalized.acquisitionSource
    ) &&
    normalized.acquisitionSource.length > 0
  ) {
    filter.acquisitionSource = {
      $in: normalized.acquisitionSource,
    };
  }

  /*
   * Acquisition campaign
   */
  if (
    normalized.acquisitionCampaign
  ) {
    filter.acquisitionCampaign =
      normalized.acquisitionCampaign;
  }

  /*
   * Tags
   *
   * Customer must contain ALL selected tags.
   */
  if (
    Array.isArray(normalized.tags) &&
    normalized.tags.length > 0
  ) {
    filter.tags = {
      $all: normalized.tags,
    };
  }

  /*
   * Total orders
   */
  if (
    normalized.minTotalOrders !==
      undefined ||
    normalized.maxTotalOrders !==
      undefined
  ) {
    filter.totalOrders = {};

    if (
      normalized.minTotalOrders !==
      undefined
    ) {
      filter.totalOrders.$gte =
        normalized.minTotalOrders;
    }

    if (
      normalized.maxTotalOrders !==
      undefined
    ) {
      filter.totalOrders.$lte =
        normalized.maxTotalOrders;
    }
  }

  /*
   * Total spent
   */
  if (
    normalized.minTotalSpent !==
      undefined ||
    normalized.maxTotalSpent !==
      undefined
  ) {
    filter.totalSpent = {};

    if (
      normalized.minTotalSpent !==
      undefined
    ) {
      filter.totalSpent.$gte =
        normalized.minTotalSpent;
    }

    if (
      normalized.maxTotalSpent !==
      undefined
    ) {
      filter.totalSpent.$lte =
        normalized.maxTotalSpent;
    }
  }

  /*
   * Inactive customers
   *
   * Customers whose last interaction is
   * on/before the supplied date, plus customers
   * who have never interacted.
   */
  if (normalized.inactiveSince) {
    const inactiveSince =
      new Date(
        normalized.inactiveSince
      );

    filter.$or = [
      {
        lastInteractionAt: {
          $lte: inactiveSince,
        },
      },
      {
        lastInteractionAt: null,
      },
    ];
  }

  return filter;
}

/**
 * ---------------------------------------------------------
 * GET CAMPAIGN
 * ---------------------------------------------------------
 */
async function getCampaign(campaignId) {
  validateObjectId(
    campaignId,
    'campaign ID'
  );

  const storeId =
    await getDefaultStoreId();

  const campaign =
    await Campaign.findOne({
      _id: campaignId,
      storeId,
    });

  if (!campaign) {
    throw AppError.notFound(
      'Campaign not found'
    );
  }

  return campaign;
}

/**
 * ---------------------------------------------------------
 * RECALCULATE CAMPAIGN STATS
 * ---------------------------------------------------------
 *
 * Keeps campaign counters synchronized with the actual
 * campaign automation records.
 */
async function refreshCampaignStats(
  campaign,
  storeId
) {
  const campaignAutomations =
    await Automation.find({
      storeId,
      campaignId: campaign._id,
      type: 'campaign',
    }).select('status');

  campaign.stats =
    campaign.stats || {};

  campaign.stats.queued =
    campaignAutomations.filter(
      (automation) =>
        automation.status === 'pending' ||
        automation.status === 'processing'
    ).length;

  campaign.stats.sent =
    campaignAutomations.filter(
      (automation) =>
        automation.status === 'sent'
    ).length;

  campaign.stats.failed =
    campaignAutomations.filter(
      (automation) =>
        automation.status === 'failed'
    ).length;

  campaign.stats.cancelled =
    campaignAutomations.filter(
      (automation) =>
        automation.status === 'cancelled'
    ).length;

  return campaignAutomations;
}

/**
 * ---------------------------------------------------------
 * PREVIEW CAMPAIGN AUDIENCE
 * ---------------------------------------------------------
 *
 * Returns the number of customers currently matching
 * the campaign audience.
 *
 * This does NOT create automations.
 */
export async function previewCampaignAudience(
  campaignOrAudience
) {
  const storeId =
    await getDefaultStoreId();

  /*
   * UNSAVED CAMPAIGN AUDIENCE PREVIEW
   */
  if (
    campaignOrAudience &&
    typeof campaignOrAudience ===
      'object' &&
    !Array.isArray(
      campaignOrAudience
    ) &&
    Object.prototype.hasOwnProperty.call(
      campaignOrAudience,
      'audience'
    )
  ) {
    const audienceFilter =
      buildAudienceFilter(
        campaignOrAudience.audience ||
          {}
      );

    const count =
      await Customer.countDocuments({
        storeId,
        ...audienceFilter,
      });

    return {
      campaignId: null,
      count,
    };
  }

  /*
   * SAVED CAMPAIGN AUDIENCE PREVIEW
   */
  const campaign =
    await getCampaign(
      campaignOrAudience
    );

  const audienceFilter =
    buildAudienceFilter(
      campaign.audience || {}
    );

  const count =
    await Customer.countDocuments({
      storeId,
      ...audienceFilter,
    });

  return {
    campaignId: campaign._id,
    count,
  };
}

/**
 * ---------------------------------------------------------
 * PREVIEW UNSAVED CAMPAIGN AUDIENCE
 * ---------------------------------------------------------
 */
export async function previewCampaignAudienceFilter(
  audience = {}
) {
  const storeId =
    await getDefaultStoreId();

  const audienceFilter =
    buildAudienceFilter(audience);

  const count =
    await Customer.countDocuments({
      storeId,
      ...audienceFilter,
    });

  return {
    count,
  };
}

/**
 * ---------------------------------------------------------
 * LAUNCH CAMPAIGN
 * ---------------------------------------------------------
 *
 * Finds all matching customers and creates campaign
 * automations for them.
 *
 * No WhatsApp request is made here.
 *
 * The automation processor handles delivery later.
 */
export async function launchCampaign(
  campaignId
) {
  validateObjectId(
    campaignId,
    'campaign ID'
  );

  const storeId =
    await getDefaultStoreId();

  /*
   * First read the campaign.
   */
  const campaign =
    await getCampaign(campaignId);

  /*
   * -------------------------------------------------------
   * STATUS VALIDATION
   * -------------------------------------------------------
   */

  if (
    campaign.status === 'running' ||
    campaign.status === 'completed'
  ) {
    throw AppError.badRequest(
      `Campaign cannot be launched while status is ${campaign.status}`
    );
  }

  if (
    campaign.status === 'cancelled'
  ) {
    throw AppError.badRequest(
      'Cancelled campaign cannot be launched'
    );
  }

  if (!campaign.message?.trim()) {
    throw AppError.badRequest(
      'Campaign message is required'
    );
  }

  validateChannel(
    campaign.channel
  );

  /*
   * -------------------------------------------------------
   * FIND AUDIENCE
   * -------------------------------------------------------
   *
   * We find the audience BEFORE atomically claiming the
   * campaign. This prevents an empty audience from leaving
   * the campaign permanently stuck in "running".
   */
  const audienceFilter =
    buildAudienceFilter(
      campaign.audience || {}
    );

  const customers =
    await Customer.find({
      storeId,
      ...audienceFilter,
    }).select(
      '_id name phone customerStatus'
    );

  if (customers.length === 0) {
    throw AppError.badRequest(
      'No customers match this campaign audience'
    );
  }

  /*
   * -------------------------------------------------------
   * DETERMINE SCHEDULE
   * -------------------------------------------------------
   */

  const now = new Date();

  const campaignSchedule =
    campaign.scheduledFor
      ? new Date(
          campaign.scheduledFor
        )
      : null;

  const scheduledFor =
    campaignSchedule &&
    !Number.isNaN(
      campaignSchedule.getTime()
    ) &&
    campaignSchedule > now
      ? campaignSchedule
      : now;

  /*
   * -------------------------------------------------------
   * ATOMIC CAMPAIGN CLAIM
   * -------------------------------------------------------
   *
   * This prevents two simultaneous launch requests from
   * both launching the same campaign.
   */
  const claimedCampaign =
    await Campaign.findOneAndUpdate(
      {
        _id: campaign._id,
        storeId,
        status: {
          $nin:
            CAMPAIGN_LAUNCH_BLOCKED_STATUSES,
        },
      },
      {
        $set: {
          status: 'running',
          startedAt:
            campaign.startedAt || now,
        },
      },
      {
        new: true,
      }
    );

  if (!claimedCampaign) {
    throw AppError.badRequest(
      'Campaign is no longer available for launch'
    );
  }

  /*
   * Keep the claimed document as the authoritative
   * campaign instance from this point onward.
   */
  const activeCampaign =
    claimedCampaign;

  try {
    /*
     * -----------------------------------------------------
     * CREATE AUTOMATIONS
     * -----------------------------------------------------
     *
     * The unique Automation index plus upsert prevents
     * duplicate campaign/customer automations.
     */
    const operations =
      customers.map(
        (customer) => ({
          updateOne: {
            filter: {
              storeId,
              type: 'campaign',
              campaignId:
                activeCampaign._id,
              customerId:
                customer._id,
            },

            update: {
              $setOnInsert: {
                storeId,
                type: 'campaign',
                customerId:
                  customer._id,
                campaignId:
                  activeCampaign._id,
                channel:
                  activeCampaign.channel,
                status: 'pending',
                scheduledFor,
                recipient:
                  customer.phone,
                message:
                  activeCampaign.message,
                attempts: 0,
                metadata: {
                  campaignName:
                    activeCampaign.name,
                  customerStatus:
                    customer.customerStatus,
                },
              },
            },

            upsert: true,
          },
        })
      );

    let bulkResult = null;

    if (operations.length > 0) {
      bulkResult =
        await Automation.bulkWrite(
          operations,
          {
            ordered: false,
          }
        );
    }

    /*
     * -----------------------------------------------------
     * CAMPAIGN COUNTERS
     * -----------------------------------------------------
     */

    const queued =
      bulkResult?.upsertedCount || 0;

    const existing =
      customers.length - queued;

    activeCampaign.stats =
      activeCampaign.stats || {};

    activeCampaign.stats.targeted =
      customers.length;

    await refreshCampaignStats(
      activeCampaign,
      storeId
    );

    /*
     * -----------------------------------------------------
     * IMPORTANT
     * -----------------------------------------------------
     *
     * "completed" means campaign automations have been
     * created/queued. It does NOT mean WhatsApp delivery
     * has completed.
     */
    activeCampaign.status =
      'completed';

    activeCampaign.completedAt =
      new Date();

    await activeCampaign.save();

    return {
      campaign: activeCampaign,
      targeted: customers.length,
      queued,
      existing,
    };
  } catch (error) {
    /*
     * -----------------------------------------------------
     * ROLLBACK CAMPAIGN STATE
     * -----------------------------------------------------
     *
     * If automation creation fails, don't leave the
     * campaign permanently stuck in "running".
     */
    await Campaign.updateOne(
      {
        _id: activeCampaign._id,
        storeId,
        status: 'running',
      },
      {
        $set: {
          status:
            campaign.status ||
            'draft',
        },
        $unset: {
          completedAt: 1,
        },
      }
    );

    throw error;
  }
}

/**
 * ---------------------------------------------------------
 * LIST CAMPAIGNS
 * ---------------------------------------------------------
 */
export async function listCampaigns(
  query = {}
) {
  const storeId =
    await getDefaultStoreId();

  const filter = {
    storeId,
  };

  if (
    query.status !== undefined &&
    query.status !== ''
  ) {
    filter.status =
      String(query.status).trim();
  }

  const parsedPage =
    query.page === undefined ||
    query.page === ''
      ? 1
      : parseFiniteNumber(
          query.page,
          'page',
          { min: 1 }
        );

  const parsedLimit =
    query.limit === undefined ||
    query.limit === ''
      ? 20
      : parseFiniteNumber(
          query.limit,
          'limit',
          { min: 1, max: MAX_PAGE_SIZE }
        );

  const page =
    Math.floor(parsedPage);

  const limit =
    Math.floor(parsedLimit);

  const skip =
    (page - 1) * limit;

  const [items, total] =
    await Promise.all([
      Campaign.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),

      Campaign.countDocuments(filter),
    ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      pages:
        Math.ceil(
          total / limit
        ),
    },
  };
}

/**
 * ---------------------------------------------------------
 * GET CAMPAIGN BY ID
 * ---------------------------------------------------------
 */
export async function getCampaignById(
  campaignId
) {
  return getCampaign(campaignId);
}

/**
 * ---------------------------------------------------------
 * CREATE CAMPAIGN
 * ---------------------------------------------------------
 */
export async function createCampaign(
  payload = {}
) {
  const storeId =
    await getDefaultStoreId();

  /*
   * Name
   */
  const name =
    normalizeString(payload.name);

  if (!name) {
    throw AppError.badRequest(
      'Campaign name is required'
    );
  }

  /*
   * Message
   */
  const message =
    normalizeString(
      payload.message
    );

  if (!message) {
    throw AppError.badRequest(
      'Campaign message is required'
    );
  }

  /*
   * Channel
   */
  const channel =
    payload.channel ||
    'whatsapp';

  validateChannel(channel);

  /*
   * Audience
   */
  const audience =
    normalizeAudience(
      payload.audience || {}
    );

  const audienceFilter =
    buildAudienceFilter(
      audience
    );

  const targeted =
    await Customer.countDocuments({
      storeId,
      ...audienceFilter,
    });

  /*
   * Scheduled date
   */
  const scheduledFor =
    parseDate(
      payload.scheduledFor,
      'scheduledFor'
    );

  const now = new Date();

  const status =
    scheduledFor &&
    scheduledFor > now
      ? 'scheduled'
      : 'draft';

  const campaign =
    await Campaign.create({
      storeId,

      name,

      description:
        typeof payload.description ===
        'string'
          ? payload.description.trim()
          : '',

      channel,

      audience,

      message,

      status,

      scheduledFor,

      stats: {
        targeted,
        queued: 0,
        sent: 0,
        failed: 0,
        cancelled: 0,
      },

      createdBy:
        payload.createdBy || null,

      metadata:
        payload.metadata &&
        typeof payload.metadata ===
          'object'
          ? payload.metadata
          : {},
    });

  return campaign;
}

/**
 * ---------------------------------------------------------
 * UPDATE CAMPAIGN
 * ---------------------------------------------------------
 */
export async function updateCampaign(
  campaignId,
  payload = {}
) {
  validateObjectId(
    campaignId,
    'campaign ID'
  );

  const storeId =
    await getDefaultStoreId();

  const campaign =
    await Campaign.findOne({
      _id: campaignId,
      storeId,
    });

  if (!campaign) {
    throw AppError.notFound(
      'Campaign not found'
    );
  }

  /*
   * Completed campaigns are immutable.
   */
  if (campaign.status === 'completed') {
    throw AppError.badRequest(
      'Completed campaigns cannot be edited'
    );
  }

  /*
   * Running campaigns cannot be edited.
   */
  if (campaign.status === 'running') {
    throw AppError.badRequest(
      'Running campaigns cannot be edited'
    );
  }

  /*
   * Cancelled campaigns cannot be edited.
   */
  if (
    campaign.status === 'cancelled'
  ) {
    throw AppError.badRequest(
      'Cancelled campaigns cannot be edited'
    );
  }

  const allowedFields = [
    'name',
    'description',
    'channel',
    'audience',
    'message',
    'scheduledFor',
    'metadata',
  ];

  const hasAudienceUpdate =
    Object.prototype.hasOwnProperty.call(
      payload,
      'audience'
    );

  const hasScheduleUpdate =
    Object.prototype.hasOwnProperty.call(
      payload,
      'scheduledFor'
    );

  /*
   * -------------------------------------------------------
   * APPLY ALLOWED FIELDS
   * -------------------------------------------------------
   */

  for (const field of allowedFields) {
    if (
      Object.prototype.hasOwnProperty.call(
        payload,
        field
      )
    ) {
      campaign[field] =
        payload[field];
    }
  }

  /*
   * -------------------------------------------------------
   * NAME
   * -------------------------------------------------------
   */

  if (
    Object.prototype.hasOwnProperty.call(
      payload,
      'name'
    )
  ) {
    const name =
      normalizeString(
        payload.name
      );

    if (!name) {
      throw AppError.badRequest(
        'Campaign name is required'
      );
    }

    campaign.name = name;
  }

  /*
   * -------------------------------------------------------
   * MESSAGE
   * -------------------------------------------------------
   */

  if (
    Object.prototype.hasOwnProperty.call(
      payload,
      'message'
    )
  ) {
    const message =
      normalizeString(
        payload.message
      );

    if (!message) {
      throw AppError.badRequest(
        'Campaign message is required'
      );
    }

    campaign.message =
      message;
  }

  /*
   * -------------------------------------------------------
   * CHANNEL
   * -------------------------------------------------------
   */

  validateChannel(
    campaign.channel
  );

  /*
   * -------------------------------------------------------
   * AUDIENCE
   * -------------------------------------------------------
   *
   * Normalize and recalculate the target count whenever
   * the audience changes.
   */
  if (hasAudienceUpdate) {
    const audience =
      normalizeAudience(
        payload.audience || {}
      );

    campaign.audience =
      audience;

    const audienceFilter =
      buildAudienceFilter(
        audience
      );

    const targeted =
      await Customer.countDocuments({
        storeId,
        ...audienceFilter,
      });

    campaign.stats =
      campaign.stats || {};

    campaign.stats.targeted =
      targeted;
  }

  /*
   * -------------------------------------------------------
   * SCHEDULE
   * -------------------------------------------------------
   */

  if (hasScheduleUpdate) {
    campaign.scheduledFor =
      parseDate(
        payload.scheduledFor,
        'scheduledFor'
      );
  } else if (
    campaign.scheduledFor
  ) {
    /*
     * Re-validate existing date as well.
     */
    campaign.scheduledFor =
      parseDate(
        campaign.scheduledFor,
        'scheduledFor'
      );
  }

  /*
   * -------------------------------------------------------
   * RECALCULATE DRAFT/SCHEDULED STATUS
   * -------------------------------------------------------
   *
   * Editing a scheduled campaign may move its scheduled
   * date into the past or future.
   */
  const now = new Date();

  if (
    campaign.status === 'scheduled' ||
    campaign.status === 'draft'
  ) {
    if (
      campaign.scheduledFor &&
      campaign.scheduledFor > now
    ) {
      campaign.status =
        'scheduled';
    } else {
      campaign.status =
        'draft';
    }
  }

  /*
   * -------------------------------------------------------
   * METADATA
   * -------------------------------------------------------
   */

  if (
    Object.prototype.hasOwnProperty.call(
      payload,
      'metadata'
    )
  ) {
    if (
      payload.metadata === null ||
      typeof payload.metadata !==
        'object' ||
      Array.isArray(
        payload.metadata
      )
    ) {
      throw AppError.badRequest(
        'Campaign metadata must be an object'
      );
    }

    campaign.metadata =
      payload.metadata;
  }

  await campaign.save();

  return campaign;
}

/**
 * ---------------------------------------------------------
 * CANCEL CAMPAIGN
 * ---------------------------------------------------------
 *
 * Cancels pending campaign automations.
 *
 * Already-processing or already-sent messages are not
 * retroactively cancelled.
 */
export async function cancelCampaign(
  campaignId
) {
  validateObjectId(
    campaignId,
    'campaign ID'
  );

  const storeId =
    await getDefaultStoreId();

  const campaign =
    await Campaign.findOne({
      _id: campaignId,
      storeId,
    });

  if (!campaign) {
    throw AppError.notFound(
      'Campaign not found'
    );
  }

  if (
    ['completed', 'cancelled'].includes(
      campaign.status
    )
  ) {
    throw AppError.badRequest(
      `Campaign is already ${campaign.status}`
    );
  }

  /*
   * Cancel pending automations only.
   *
   * Processing/sent automations are intentionally not
   * retroactively cancelled.
   */
  await Automation.updateMany(
    {
      storeId,
      campaignId:
        campaign._id,
      type: 'campaign',
      status: 'pending',
    },
    {
      $set: {
        status: 'cancelled',
        error:
          'Campaign cancelled',
      },
    }
  );

  /*
   * Recalculate all automation counters.
   */
  await refreshCampaignStats(
    campaign,
    storeId
  );

  campaign.status =
    'cancelled';

  await campaign.save();

  return campaign;
}
