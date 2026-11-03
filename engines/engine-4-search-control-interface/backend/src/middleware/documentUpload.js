
import multer from 'multer'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const uploadDirectory = path.resolve(__dirname, '../../storage/documents')

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, uploadDirectory)
  },

  filename: (_req, file, callback) => {
    const storedFilename = `${randomUUID()}.pdf`
    callback(null, storedFilename)
  },
})

const fileFilter = (_req, file, callback) => {
  if (file.mimetype !== 'application/pdf') {
    return callback(
      new Error('Only PDF documents are allowed'),
      false
    )
  }

  callback(null, true)
}

export const uploadDocument = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024,
    files: 1,
  },
}).single('document')
