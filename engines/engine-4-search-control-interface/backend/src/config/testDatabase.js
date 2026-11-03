import { pool } from './database.js'

try {
  const result = await pool.query(
    'SELECT current_database(), current_user, NOW() AS server_time',
  )

  console.log('PostgreSQL connection successful:')
  console.table(result.rows)
} catch (error) {
  console.error('PostgreSQL connection failed:', error.message)
  process.exitCode = 1
} finally {
  await pool.end()
}
