const ALLOWED_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
] as const

export type AllowedImageContentType = (typeof ALLOWED_CONTENT_TYPES)[number]

export type ImageGetResult =
  | { found: true; data: ArrayBuffer; contentType: string }
  | { found: false }

export function isAllowedImageContentType(
  contentType: string,
): contentType is AllowedImageContentType {
  return (ALLOWED_CONTENT_TYPES as readonly string[]).includes(contentType)
}

export const IMAGE_PREFIX = 'images/'
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024 // 5MB

export class R2ImageStorage {
  private bucket: R2Bucket

  constructor(bucket: R2Bucket) {
    this.bucket = bucket
  }

  async save(
    key: string,
    data: ArrayBuffer,
    contentType: string,
  ): Promise<void> {
    await this.bucket.put(`${IMAGE_PREFIX}${key}`, data, {
      httpMetadata: { contentType },
    })
  }

  async get(key: string): Promise<ImageGetResult> {
    const object = await this.bucket.get(`${IMAGE_PREFIX}${key}`)
    if (!object) return { found: false }
    const data = await object.arrayBuffer()
    const contentType =
      object.httpMetadata?.contentType ?? 'application/octet-stream'
    return { found: true, data, contentType }
  }

  async delete(key: string): Promise<void> {
    await this.bucket.delete(`${IMAGE_PREFIX}${key}`)
  }
}
