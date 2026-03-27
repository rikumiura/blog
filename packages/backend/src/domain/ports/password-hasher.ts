/** パスワードのハッシュ化・検証を行うポート */
export interface PasswordHasher {
  hash(password: string): Promise<string>
  verify(password: string, hash: string): Promise<boolean>
}
