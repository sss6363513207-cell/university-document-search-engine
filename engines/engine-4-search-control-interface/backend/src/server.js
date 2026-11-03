
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import { pool } from './config/database.js'
import authRoutes from './routes/authRoutes.js'
import documentRoutes from './routes/documentRoutes.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5001

// Security middleware
app.use(helmet())

// CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  }),
)

// Request body parser
app.use(express.json({ limit: '1mb' }))

// Rate limiting
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
  }),
)

// Authentication routes
app.use('/api/auth', authRoutes)
app.use('/api/documents', documentRoutes)

// Database health check
app.get('/api/v1/health', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT current_database() AS database, NOW() AS time',
    )

    return res.status(200).json({
      success: true,
      message: 'E4 Backend API is running',
      database: result.rows[0].database,
      timestamp: result.rows[0].time,
    })
  } catch (error) {
    console.error('Health check failed:', error.message)

    return res.status(503).json({
      success: false,
      message: 'Database connection unavailable',
    })
  }
})

// 404 handler — keep this after all routes
app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: 'Route not found',
  })
})

// Start server
app.listen(PORT, () => {
  console.log(`E4 Backend running at http://localhost:${PORT}`)
})
