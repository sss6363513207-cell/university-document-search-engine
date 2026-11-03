import argon2 from 'argon2'
import jwt from 'jsonwebtoken'
import { databaseService } from './databaseService.js'

export const authService = {
  async login({ email, password }) {
    const result = await databaseService.query(
      `SELECT
         u.id,
         u.full_name,
         u.email,
         u.password_hash,
         u.is_active,
         r.name AS role,
         d.name AS department
       FROM engine4.users u
       JOIN engine4.roles r ON r.id = u.role_id
       LEFT JOIN engine4.departments d ON d.id = u.department_id
       WHERE LOWER(u.email) = LOWER($1)
       LIMIT 1`,
      [email],
    )

    const user = result.rows[0]

    if (!user || !user.is_active) {
      throw new Error('Invalid email or password')
    }

    const passwordMatches = await argon2.verify(
      user.password_hash,
      password,
    )

    if (!passwordMatches) {
      throw new Error('Invalid email or password')
    }

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not configured')
    }

    const accessToken = jwt.sign(
      {
        sub: String(user.id),
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '15m',
        issuer: 'university-search-e4',
        audience: 'university-search-e4-client',
      },
    )

    return {
      accessToken,
      user: {
        id: String(user.id),
        fullName: user.full_name,
        email: user.email,
        role: user.role,
        department: user.department,
      },
    }
  },
}
