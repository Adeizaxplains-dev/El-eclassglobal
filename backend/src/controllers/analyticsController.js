import { catchAsync } from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/apiResponse.js';
import * as analyticsService from '../services/analyticsService.js';

export const getOverview = catchAsync(async (req, res) => {
  const data = await analyticsService.getDashboardOverview();

  sendSuccess(res, { data });
});

export const getSalesOverTime = catchAsync(async (req, res) => {
  const data = await analyticsService.getSalesOverTime({
    days: Number(req.query.days) || 30,
  });

  sendSuccess(res, { data });
});

export const getTopProducts = catchAsync(async (req, res) => {
  const data = await analyticsService.getTopProducts({
    limit: Number(req.query.limit) || 10,
  });

  sendSuccess(res, { data });
});

export const getAcquisitionSources = catchAsync(async (req, res) => {
  const data = await analyticsService.getAcquisitionSourceBreakdown();

  sendSuccess(res, { data });
});

export const getConversionFunnel = catchAsync(async (req, res) => {
  const data = await analyticsService.getConversionFunnel({
    days: Number(req.query.days) || 30,
  });

  sendSuccess(res, { data });
});