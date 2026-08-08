import { Router } from 'express';
import { register, login, logout, getMe } from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { registerSchema, loginSchema } from '../validators/auth.validator.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// Frontend se aaya registration data pehle registerSchema se validate hoga;
// data valid hone par hi register controller chalega, warna 400 error milega.
router.post('/register', validate(registerSchema), register);

// Login request ke email aur password ko loginSchema validate karta hai;
// validation pass hone ke baad login controller credentials check karega.
router.post('/login', validate(loginSchema), login);

// Logout route current authentication cookie/token ko clear karta hai;
// is request mein body data nahi hai, isliye validation schema ki zarurat nahi hai.
router.post('/logout', logout);

// Pehle authenticate middleware token verify karega;
// valid user hone par hi getMe controller current user ki details bhejega.
router.get('/me', authenticate, getMe);

export default router;
