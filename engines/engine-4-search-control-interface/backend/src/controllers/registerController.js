import argon2 from 'argon2'
import { databaseService } from '../services/databaseService.js'

export const registerController = {
  async register(req, res) {
    try {
      const { fullName, email, password, departmentId } = req.validatedBody

      const existingUser = await databaseService.query(
        `SELECT id
         FROM engine4.users
         WHERE LOWER(email) = LOWER($1)
         LIMIT 1`,
        [email],
      )

      if (existingUser.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'An account with this email already exists',
        })
      }

      const studentRole = await databaseService.query(
        `SELECT id
         FROM engine4.roles
         WHERE name = 'STUDENT'
         LIMIT 1`,
      )

      if (studentRole.rows.length === 0) {
        return res.status(500).json({
          success: false,
          message: 'Student role is not configured',
        })
      }

      const passwordHash = await argon2.hash(password, {
        type: argon2.argon2id,
      })

      const result = await databaseService.query(
        `INSERT INTO engine4.users
          (full_name, email, password_hash, role_id, department_id)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, full_name, email`,
        [
          fullName,
          email,
          passwordHash,
          studentRole.rows[0].id,
          departmentId ?? null,
        ],
      )

      const user = result.rows[0]

      return res.status(201).json({
        success: true,
        message: 'Student account created successfully',
        data: {
          id: String(user.id),
          fullName: user.full_name,
          email: user.email,
          role: 'STUDENT',
        },
      })
    } catch (error) {
      console.error('Registration error:', error.message)

      return res.status(500).json({
        success: false,
        message: 'Unable to create account',
      })
    }
  },
}