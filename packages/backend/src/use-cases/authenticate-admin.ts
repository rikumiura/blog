import type { PasswordHasher } from '../domain/ports/password-hasher'
import type { TokenGenerator } from '../domain/ports/token-generator'

type AuthenticateInput = {
  username: string
  password: string
}

type AuthenticateResult =
  | { status: 'authenticated'; token: string }
  | { status: 'invalid_credentials' }

type Dependencies = {
  passwordHasher: PasswordHasher
  tokenGenerator: TokenGenerator
  adminUsername: string
  adminPasswordHash: string
}

export async function authenticateAdmin(
  input: AuthenticateInput,
  deps: Dependencies,
): Promise<AuthenticateResult> {
  if (!input.username || !input.password) {
    return { status: 'invalid_credentials' }
  }

  if (input.username !== deps.adminUsername) {
    return { status: 'invalid_credentials' }
  }

  const isValid = await deps.passwordHasher.verify(
    input.password,
    deps.adminPasswordHash,
  )

  if (!isValid) {
    return { status: 'invalid_credentials' }
  }

  const token = await deps.tokenGenerator.generate({ sub: input.username })
  return { status: 'authenticated', token }
}
