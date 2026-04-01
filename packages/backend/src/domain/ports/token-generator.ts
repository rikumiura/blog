/** JWT トークンの生成・検証を行うポート */
export interface TokenGenerator {
  generate(payload: { sub: string }): Promise<string>
  verify(token: string): Promise<{ sub: string } | null>
}
