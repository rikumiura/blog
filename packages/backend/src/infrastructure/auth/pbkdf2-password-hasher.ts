import type { PasswordHasher } from '../../domain/ports/password-hasher'

const ITERATIONS = 100_000
const KEY_LENGTH = 32
const SALT_LENGTH = 16

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function fromHex(hex: string): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = Number.parseInt(hex.slice(i, i + 2), 16)
  }
  return bytes
}

/**
 * Web Crypto API を使った PBKDF2 パスワードハッシャー
 *
 * Cloudflare Workers 環境では bcrypt / scrypt が利用できないため、
 * Web Crypto API の PBKDF2 を採用している。
 * ソルト付き・10万回イテレーションにより、レインボーテーブル攻撃やブルートフォースを緩和する。
 */
export class Pbkdf2PasswordHasher implements PasswordHasher {
  async hash(password: string): Promise<string> {
    const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
    const key = await this.deriveKey(password, salt)
    return `${toHex(salt.buffer)}:${toHex(key)}`
  }

  async verify(password: string, hash: string): Promise<boolean> {
    const [saltHex, expectedKeyHex] = hash.split(':')
    if (!saltHex || !expectedKeyHex) return false
    const salt = fromHex(saltHex)
    const key = await this.deriveKey(password, salt)
    const actualKeyHex = toHex(key)
    return this.timingSafeEqual(actualKeyHex, expectedKeyHex)
  }

  private async deriveKey(
    password: string,
    salt: Uint8Array<ArrayBuffer>,
  ): Promise<ArrayBuffer> {
    const encoder = new TextEncoder()
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits'],
    )
    return crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt,
        iterations: ITERATIONS,
        hash: 'SHA-256',
      },
      keyMaterial,
      KEY_LENGTH * 8,
    )
  }

  private timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) return false
    let result = 0
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i)
    }
    return result === 0
  }
}
