import type { BodyKey } from '../../domain/models/article'
import type { BodyStorage } from '../../domain/repositories/body-storage'

export class R2BodyStorage implements BodyStorage {
  private bucket: R2Bucket

  constructor(bucket: R2Bucket) {
    this.bucket = bucket
  }

  async save(key: BodyKey, content: string): Promise<void> {
    await this.bucket.put(key, content)
  }

  async get(key: BodyKey): Promise<string | null> {
    const object = await this.bucket.get(key)
    if (!object) return null
    return await object.text()
  }

  async delete(key: BodyKey): Promise<void> {
    await this.bucket.delete(key)
  }
}
