
import multer from 'multer'

export const uploadErrorHandler = (err, _req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        message: 'File size must not exceed 20 MB',
      })
    }

    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Only one document can be uploaded at a time',
      })
    }

    return res.status(400).json({
      success: false,
      message: 'Document upload failed',
      error: err.message,
    })
  }

  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message || 'Invalid document upload',
    })
  }

  next()
}
