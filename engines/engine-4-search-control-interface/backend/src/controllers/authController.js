import { authService } from '../services/authService.js'

export const authController = {
  async login(req, res) {
    try {
      const result = await authService.login(req.validatedBody)

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result,
      })
    } catch (error) {
      if (error.message === 'Invalid email or password') {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        })
      }

      console.error('Login error:', error.message)

      return res.status(500).json({
        success: false,
        message: 'Unable to complete login',
      })
    }
  },
}