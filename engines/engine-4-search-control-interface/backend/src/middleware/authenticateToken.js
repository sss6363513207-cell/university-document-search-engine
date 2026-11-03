
import jwt from 'jsonwebtoken'
import { databaseService } from '../services/databaseService.js'

export async function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    })
  }

  const token = authHeader.slice(7).trim()

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    })
  }

  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is not configured')

    return res.status(500).json({
      success: false,
      message: 'Authentication service unavailable',
    })
  }

  let decoded

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: 'university-search-e4',
      audience: 'university-search-e4-client',
    })
  } catch {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired access token',
    })
  }

  try {
    const result = await databaseService.query(
      `SELECT
         u.id,
         u.full_name,
         u.email,
         u.is_active,
         u.department_id,
         r.name AS role,
         d.name AS department
       FROM engine4.users u
       JOIN engine4.roles r ON r.id = u.role_id
       LEFT JOIN engine4.departments d ON d.id = u.department_id
       WHERE u.id = $1
       LIMIT 1`,
      [decoded.sub],
    )

    const user = result.rows[0]

    if (!user || !user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'User account is inactive or no longer exists',
      })
    }

    req.user = {
      id: String(user.id),
      fullName: user.full_name,
      email: user.email,
      role: user.role,
      departmentId: user.department_id
        ? String(user.department_id)
        : null,
      department: user.department,
    }

    return next()
  } catch (error) {
    console.error('Authentication database error:', error.message)

    return res.status(503).json({
      success: false,
      message: 'Authentication service temporarily unavailable',
    })
  }
}
