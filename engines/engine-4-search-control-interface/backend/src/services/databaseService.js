import { pool } from '../config/database.js'

export const databaseService = {
  async query(text, params = []) {
    return pool.query(text, params)
  },

  async getRoles() {
    const result = await pool.query(
      'SELECT id, name FROM engine4.roles ORDER BY id',
    )

    return result.rows
  },

  async getDepartments() {
    const result = await pool.query(
      'SELECT id, name, code FROM engine4.departments ORDER BY name',
    )

    return result.rows
  },
}
