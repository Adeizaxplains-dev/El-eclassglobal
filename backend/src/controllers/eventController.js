import { catchAsync } from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { recordEvent } from '../services/eventService.js';

export const trackEvent = catchAsync(async (req, res) => {
  const event = await recordEvent(req.body);

  sendSuccess(res, {
    data: event,
    statusCode: 201,
    message: 'Event recorded',
  });
});