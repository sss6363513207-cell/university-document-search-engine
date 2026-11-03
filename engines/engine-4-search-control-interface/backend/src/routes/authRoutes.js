import { Router } from 'express'
import { authController } from '../controllers/authController.js'
import { registerController } from '../controllers/registerController.js'
import { validateRequest } from '../middleware/validateRequest.js'
import { loginSchema, registerSchema } from '../validators/authValidator.js'
import { profileController } from '../controllers/profileController.js'
import { authenticateToken } from '../middleware/authenticateToken.js'

const router = Router()

// Student registration
router.post(
  '/register',
  validateRequest(registerSchema),
  registerController.register,
)

// Login
router.post(
  '/login',
  validateRequest(loginSchema),
  authController.login,
)

// Protected profile endpoint
router.get(
  '/me',
  authenticateToken,
  profileController.getProfile,
)


export default router