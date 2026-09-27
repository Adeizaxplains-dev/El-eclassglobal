import { catchAsync } from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/apiResponse.js';

import * as automationAdminService from '../services/automationAdminService.js';

export const getOverview = catchAsync(async (req, res) => {
  const data = await automationAdminService.getAutomationOverview();

  sendSuccess(res, { data });
});

export const list = catchAsync(async (req, res) => {
  const result = await automationAdminService.listAutomations({
    page: req.query.page,
    limit: req.query.limit,
    type: req.query.type,
    status: req.query.status,
    channel: req.query.channel,
    customerId: req.query.customerId,
    campaignId: req.query.campaignId,
    orderId: req.query.orderId,
  });

  sendSuccess(res, {
    data: result.items,
    pagination: result.pagination,
  });
});

export const getById = catchAsync(async (req, res) => {
  const data = await automationAdminService.getAutomationById(
    req.params.id
  );

  sendSuccess(res, { data });
});

export const cancel = catchAsync(async (req, res) => {
  const data = await automationAdminService.cancelAutomation(
    req.params.id
  );

  sendSuccess(res, { data });
});

export const retry = catchAsync(async (req, res) => {
  const data = await automationAdminService.retryAutomation(
    req.params.id
  );

  sendSuccess(res, { data });
});