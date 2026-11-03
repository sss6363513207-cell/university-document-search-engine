import { createHash } from 'node:crypto'
import { readFile, unlink } from 'node:fs/promises'
import path from 'node:path'

import { documentService } from '../services/documentService.js'

const FACULTY_ACCESS_LEVELS = new Set([
  'PUBLIC',
  'UNIVERSITY',
  'DEPARTMENT',
  'RESTRICTED',
])

export const uploadDocumentController = async (req, res, next) => {
  const uploadedFile = req.file

  try {
    if (!uploadedFile) {
      return res.status(400).json({
        success: false,
        message: 'A PDF document is required',
      })
    }

    const metadata = req.validatedBody
    const user = req.user

    // Enforce access-level authorization.
    if (
      user.role === 'FACULTY' &&
      !FACULTY_ACCESS_LEVELS.has(metadata.accessLevel)
    ) {
      await unlink(uploadedFile.path).catch(() => {})

      return res.status(403).json({
        success: false,
        message: 'Faculty cannot upload documents with this access level',
      })
    }

    // Faculty may upload only to their own department.
    if (user.role === 'FACULTY') {
      if (!user.departmentId) {
        await unlink(uploadedFile.path).catch(() => {})

        return res.status(403).json({
          success: false,
          message: 'Your account is not assigned to a department',
        })
      }

      if (
        metadata.departmentId &&
        metadata.departmentId !== user.departmentId
      ) {
        await unlink(uploadedFile.path).catch(() => {})

        return res.status(403).json({
          success: false,
          message: 'You can upload documents only to your own department',
        })
      }
    }

    // Resolve the department from the authenticated user's identity
    // for Faculty. Admin may choose a department.
    const departmentId =
      user.role === 'FACULTY'
        ? user.departmentId
        : metadata.departmentId || null

    const fileBuffer = await readFile(uploadedFile.path)

    // Check the PDF file signature.
    const pdfSignature = fileBuffer.subarray(0, 5).toString()

    if (pdfSignature !== '%PDF-') {
      await unlink(uploadedFile.path).catch(() => {})

      return res.status(400).json({
        success: false,
        message: 'The uploaded file is not a valid PDF',
      })
    }

    const checksumSha256 = createHash('sha256')
      .update(fileBuffer)
      .digest('hex')

    const document = await documentService.createDocument({
      title: metadata.title,
      description: metadata.description,
      originalFilename: path.basename(uploadedFile.originalname),
      storedFilename: uploadedFile.filename,
      storagePath: uploadedFile.path,
      mimeType: uploadedFile.mimetype,
      fileSizeBytes: uploadedFile.size,
      checksumSha256,
      documentType: metadata.documentType,
      accessLevel: metadata.accessLevel,
      departmentId,
      uploadedBy: user.id,
    })

    return res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      document,
    })
  } catch (error) {
    if (uploadedFile?.path) {
      await unlink(uploadedFile.path).catch(() => {})
    }

    return next(error)
  }
}


export const listDocumentsController = async (req, res, next) => {
  try {
    const documents = await documentService.listDocuments(req.user)

    return res.status(200).json({
      success: true,
      count: documents.length,
      documents,
    })
  } catch (error) {
    return next(error)
  }
}


export const previewDocumentController = async (req, res, next) => {
  try {
    const document = await documentService.getDocumentById(
      req.params.id,
      req.user
    )

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
      })
    }

    res.setHeader('Content-Type', document.mime_type)
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${path.basename(document.original_filename)}"`
    )
    res.setHeader('X-Content-Type-Options', 'nosniff')

    return res.sendFile(path.resolve(document.storage_path))
  } catch (error) {
    return next(error)
  }
}


export const downloadDocumentController = async (req, res, next) => {
  try {
    const document = await documentService.getDocumentById(
      req.params.id,
      req.user
    )

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
      })
    }

    res.setHeader('Content-Type', document.mime_type)
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${path.basename(document.original_filename)}"`
    )
    res.setHeader('X-Content-Type-Options', 'nosniff')

    return res.sendFile(path.resolve(document.storage_path))
  } catch (error) {
    return next(error)
  }
}
