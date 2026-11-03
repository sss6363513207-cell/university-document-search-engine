
import { z } from 'zod'

export const documentMetadataSchema = z.object({
  title: z.string().trim().min(1).max(500),

  description: z
    .string()
    .trim()
    .max(5000)
    .optional()
    .or(z.literal('')),

  documentType: z
    .string()
    .trim()
    .max(100)
    .optional()
    .or(z.literal('')),

  accessLevel: z.enum([
    'PUBLIC',
    'UNIVERSITY',
    'DEPARTMENT',
    'RESTRICTED',
    'PRIVATE',
  ]),

  departmentId: z
    .string()
    .regex(/^[1-9]\d*$/)
    .optional()
    .or(z.literal('')),
})
