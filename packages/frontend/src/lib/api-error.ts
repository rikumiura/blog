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
 * 失敗レスポンスから Error を生成して返す（throw はしない）。
 * レスポンスボディに error フィールドがあればそのメッセージを、
 * なければ defaultMessage とステータスコードを組み合わせたメッセージを用いる。
 *
 * 呼び出し側で `throw await createApiError(...)` と明示的に throw することで、
 * TypeScript の到達不能解析が働き、後続の res.json() が成功型へ絞り込まれる。
 */
export async function createApiError(
  res: Response,
  defaultMessage: string,
): Promise<Error> {
  const data = await res.json().catch(() => null)
  const message =
    extractErrorMessage(data) ?? `${defaultMessage}: ${res.status}`
  return new Error(message)
}
