import type { PasswordHasher } from '../../domain/ports/password-hasher'

/** Web Crypto API を使った SHA-256 パスワードハッシャー */
export class Sha256PasswordHasher implements PasswordHasher {
  async hash(password: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(password)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
  }

  async verify(password: string, hash: string): Promise<boolean> {
    const passwordHash = await this.hash(password)
    return passwordHash === hash
  }
}
