import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import { config } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

export const hashPassword = async (password) => {
  return bcrypt.hash(password, 10);
};

export const comparePassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

export const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
};

export const verifyToken = (token) => {
  return jwt.verify(token, config.jwt.secret);
};

export const registerUser = async ({ name, email, password, role, walletAddress }) => {
  const existing = await User.findOne({ where: { email } });
  if (existing) {
    throw new ApiError(400, 'User with this email already exists');
  }

  const passwordHash = await hashPassword(password);
  const user = await User.create({
    name,
    email,
    passwordHash,
    role,
    walletAddress,
  });

  const userJson = user.toJSON();
  delete userJson.passwordHash;
  return userJson;
};

export const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ where: { email } });
  if (!user || !user.isActive) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const isMatch = await comparePassword(password, user.passwordHash);
  if (!isMatch) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const token = generateToken(user);
  const userJson = user.toJSON();
  delete userJson.passwordHash;

  return { user: userJson, token };
};

export const getUserById = async (id) => {
  const user = await User.findByPk(id, {
    attributes: { exclude: ['passwordHash'] },
  });
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  return user;
};
