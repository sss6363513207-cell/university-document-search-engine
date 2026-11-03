import { unlink } from 'node:fs/promises'
import { documentMetadataSchema } from '../validators/documentValidator.js'

export const validateDocumentMetadata = async (req, res, next) => {
  const result = documentMetadataSchema.safeParse(req.body)

  if (!result.success) {
    // Remove the uploaded file if metadata validation fails.
    if (req.file?.path) {
      await unlink(req.file.path).catch(() => {})
    }

    return res.status(400).json({
      success: false,
      message: 'Invalid document metadata',
      errors: result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    })
  }

  req.validatedBody = result.data

  return next()
}