import { v4 as uuidv4 } from 'uuid'
import { MediaType } from '@prisma/client'

/**
 * Extract file extension from original filename
 */
export function extractFileExtension(originalName: string): string {
  const lastDotIndex = originalName.lastIndexOf('.')
  if (lastDotIndex === -1 || lastDotIndex === originalName.length - 1) {
    return ''
  }
  return originalName.substring(lastDotIndex + 1).toLowerCase()
}

/**
 * Generate a UUID-based filename with extension
 */
export function generateUuidFilename(extension: string): string {
  const uuid = uuidv4()
  return extension ? `${uuid}.${extension}` : uuid
}

/**
 * Generate logical storage path for media files
 * Format: projects/{projectId}/{mediaType}/{uuid}.{ext}
 */
export function generateStoragePath(
  projectId: string,
  mediaType: MediaType,
  extension: string
): string {
  const uuid = uuidv4()
  const filename = extension ? `${uuid}.${extension}` : uuid
  return `projects/${projectId}/${mediaType.toLowerCase()}/${filename}`
}

/**
 * Generate storage path from existing filename (for updates/overwrites)
 * Format: projects/{projectId}/{mediaType}/{existingFilename}
 */
export function generateStoragePathForUpdate(
  projectId: string,
  mediaType: MediaType,
  existingFilename: string
): string {
  return `projects/${projectId}/${mediaType.toLowerCase()}/${existingFilename}`
}

/**
 * Parse storage path to extract components
 */
export function parseStoragePath(storagePath: string): {
  projectId: string
  mediaType: string
  filename: string
} | null {
  const match = storagePath.match(/^projects\/([^\/]+)\/([^\/]+)\/(.+)$/)
  if (!match) {
    return null
  }

  return {
    projectId: match[1],
    mediaType: match[2],
    filename: match[3]
  }
}

/**
 * Sanitize original filename for storage
 */
export function sanitizeOriginalName(originalName: string): string {
  // Remove path separators and limit length
  return originalName
    .replace(/[\/\\]/g, '_')
    .substring(0, 255)
    .trim()
}
