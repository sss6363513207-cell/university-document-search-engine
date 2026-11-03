import { z } from 'zod'

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email('Enter a valid email address')
    .max(255),

  password: z
    .string()
    .min(1, 'Password is required')
    .max(128),
})

export const registerSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Full name must contain at least 2 characters')
    .max(150),

  email: z
    .string()
    .trim()
    .email('Enter a valid email address')
    .max(255),

  password: z
    .string()
    .min(12, 'Password must contain at least 12 characters')
    .max(128),

  departmentId: z
    .number()
    .int()
    .positive()
    .optional(),
})
