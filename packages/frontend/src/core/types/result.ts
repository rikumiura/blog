/** 操作の結果を表す判別共用体型 */
export type Result<T = void> =
  | { status: 'success'; data: T }
  | { status: 'error'; error: string }
