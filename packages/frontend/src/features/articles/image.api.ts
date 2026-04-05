import { TOKEN_STORAGE_KEY } from '@/features/auth/constants'

const API_BASE_URL =
  (import.meta as { env?: { VITE_API_BASE_URL?: string } }).env
    ?.VITE_API_BASE_URL ?? 'http://localhost:8787'

export type UploadImageResult = {
  key: string
  url: string
}

function getToken(): string {
  try {
    return globalThis.localStorage?.getItem(TOKEN_STORAGE_KEY) ?? ''
  } catch {
    return ''
  }
}

export async function uploadImage(file: File): Promise<UploadImageResult> {
  const token = getToken()

  const formData = new FormData()
  formData.append('image', file)

  const res = await fetch(`${API_BASE_URL}/api/images`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  })

  if (!res.ok) {
    const data = await res.json().catch(() => null)
    const message =
      data !== null &&
      typeof data === 'object' &&
      'error' in data &&
      typeof data.error === 'string'
        ? data.error
        : `画像のアップロードに失敗しました: ${res.status}`
    throw new Error(message)
  }

  return res.json() as Promise<UploadImageResult>
}

export function toAbsoluteImageUrl(url: string): string {
  if (url.startsWith('http')) return url
  return `${API_BASE_URL}${url}`
}
