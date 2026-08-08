import { registerUser, loginUser, getUserById } from '../services/auth.service.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { config } from '../config/env.js';

export const register = asyncHandler(async (req, res) => {
  const user = await registerUser(req.body);
  return sendSuccess(res, 201, 'User registered successfully', { user });
});

export const login = asyncHandler(async (req, res) => {
  const { user, token } = await loginUser(req.body);

  // Set HTTP-only cookie
  res.cookie('token', token, {
    httpOnly: true,
    secure: config.jwt.cookieSecure,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return sendSuccess(res, 200, 'Login successful', { user, token });
});

export const logout = asyncHandler(async (req, res) => {
  res.clearCookie('token');
  return sendSuccess(res, 200, 'Logout successful');
});

export const getMe = asyncHandler(async (req, res) => {
  const user = await getUserById(req.user.id);
  return sendSuccess(res, 200, 'Current user retrieved', { user });
});
