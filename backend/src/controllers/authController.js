import { catchAsync } from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/apiResponse.js';
import {
  loginAdmin,
  changeAdminPassword,
} from '../services/authService.js';

export const login = catchAsync(async (req, res) => {
  const { token, user } = await loginAdmin(req.body);

  sendSuccess(res, {
    data: { token, user },
    message: 'Login successful',
  });
});

export const me = catchAsync(async (req, res) => {
  sendSuccess(res, {
    data: { user: req.user },
  });
});

export const changePassword = catchAsync(async (req, res) => {
  const user = await changeAdminPassword(req.user.id, req.body);

  sendSuccess(res, {
    data: { user },
    message: 'Password changed successfully',
  });
});