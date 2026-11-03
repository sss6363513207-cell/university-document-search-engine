import { Router } from 'express'

import { authenticateToken } from '../middleware/authenticateToken.js'
import { authorizeRoles } from '../middleware/authorizeRoles.js'
import { validateDocumentMetadata } from '../middleware/validateDocumentMetadata.js'
import { uploadDocument } from '../middleware/documentUpload.js'
import { uploadErrorHandler } from '../middleware/uploadErrorHandler.js'
import {
  uploadDocumentController,
  listDocumentsController,
  previewDocumentController,
  downloadDocumentController,
} from '../controllers/documentController.js'

const router = Router()
router.get(
  '/:id/download',
  authenticateToken,
  downloadDocumentController
)

router.get(
  '/:id/preview',
  authenticateToken,
  previewDocumentController
)

router.get(
  '/',
  authenticateToken,
  listDocumentsController
)


router.post(
  '/upload',
  authenticateToken,
  authorizeRoles('FACULTY', 'ADMIN'),
  uploadDocument,
  validateDocumentMetadata,
  uploadDocumentController,
  uploadErrorHandler
)

export default router