/**
 * APIエラーレスポンスのボディから error フィールド（文字列）を取り出す。
 * 取り出せない場合は undefined を返す。
 */
export function extractErrorMessage(data: unknown): string | undefined {
  if (data !== null && typeof data === 'object' && 'error' in data) {
    const error = (data as Record<string, unknown>).error
    if (typeof error === 'string') return error
  }
  return undefined
}

/**
 * 失敗レスポンスから Error を生成して throw する。
 * レスポンスボディに error フィールドがあればそのメッセージを、
 * なければ defaultMessage とステータスコードを組み合わせたメッセージを用いる。
 */
export async function throwApiError(
  res: Response,
  defaultMessage: string,
): Promise<never> {
  const data = await res.json().catch(() => null)
  const message = extractErrorMessage(data) ?? `${defaultMessage}: ${res.status}`
  throw new Error(message)
}
