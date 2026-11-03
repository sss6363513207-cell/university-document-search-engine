import { databaseService } from './databaseService.js'

export const documentService = {
  async createDocument(document) {
    const {
      title,
      description,
      originalFilename,
      storedFilename,
      storagePath,
      mimeType,
      fileSizeBytes,
      checksumSha256,
      documentType,
      accessLevel,
      departmentId,
      uploadedBy,
    } = document

    const query = `
      INSERT INTO engine4.documents (
        title,
        description,
        original_filename,
        stored_filename,
        storage_path,
        mime_type,
        file_size_bytes,
        checksum_sha256,
        document_type,
        access_level,
        department_id,
        uploaded_by
      )
      VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11, $12
      )
      RETURNING
        id,
        title,
        original_filename,
        mime_type,
        file_size_bytes,
        document_type,
        access_level,
        department_id,
        uploaded_by,
        created_at
    `

    const values = [
      title,
      description || null,
      originalFilename,
      storedFilename,
      storagePath,
      mimeType,
      fileSizeBytes,
      checksumSha256,
      documentType || null,
      accessLevel,
      departmentId ? Number(departmentId) : null,
      uploadedBy,
    ]

    const result = await databaseService.query(query, values)

    return result.rows[0]
  },

  async listDocuments(user) {
    const query = `
      SELECT
        id,
        title,
        description,
        original_filename,
        mime_type,
        file_size_bytes,
        document_type,
        access_level,
        department_id,
        uploaded_by,
        created_at
      FROM engine4.documents
      WHERE is_active = TRUE
        AND (
          access_level IN ('PUBLIC', 'UNIVERSITY')
          OR (
            access_level = 'DEPARTMENT'
            AND department_id = $1
          )
          OR (
            access_level = 'RESTRICTED'
            AND (uploaded_by = $2 OR $3 = 'ADMIN')
          )
          OR $3 = 'ADMIN'
        )
      ORDER BY created_at DESC, id DESC
    `

    const values = [
      user.departmentId ? Number(user.departmentId) : null,
      Number(user.id),
      user.role,
    ]

    const result = await databaseService.query(query, values)

    return result.rows
  },

  async getDocumentById(documentId, user) {
    const query = `
      SELECT
        id,
        title,
        original_filename,
        stored_filename,
        storage_path,
        mime_type,
        file_size_bytes,
        access_level,
        department_id,
        uploaded_by
      FROM engine4.documents
      WHERE id = $1
        AND is_active = TRUE
        AND (
          access_level IN ('PUBLIC', 'UNIVERSITY')
          OR (
            access_level = 'DEPARTMENT'
            AND department_id = $2
          )
          OR (
            access_level IN ('RESTRICTED', 'PRIVATE')
            AND uploaded_by = $3
          )
          OR $4 = 'ADMIN'
        )
      LIMIT 1
    `

    const values = [
      Number(documentId),
      user.departmentId ? Number(user.departmentId) : null,
      Number(user.id),
      user.role,
    ]

    const result = await databaseService.query(query, values)

    return result.rows[0] || null
  },

}