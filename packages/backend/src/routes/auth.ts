import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import type { AppEnv } from '../env'
import { JwtTokenGenerator } from '../infrastructure/auth/jwt-token-generator'
import { Pbkdf2PasswordHasher } from '../infrastructure/auth/pbkdf2-password-hasher'
import { loginSchema } from '../presentation/schemas/auth-schemas'
import { authenticateAdmin } from '../use-cases/authenticate-admin'

export const authRoutes = new Hono<AppEnv>()
  .post('/login', zValidator('json', loginSchema), async (c) => {
    const input = c.req.valid('json')
    const passwordHasher = new Pbkdf2PasswordHasher()
    const tokenGenerator = new JwtTokenGenerator(c.env.JWT_SECRET)

    const result = await authenticateAdmin(input, {
      passwordHasher,
      tokenGenerator,
      adminUsername: c.env.ADMIN_USERNAME,
      adminPasswordHash: c.env.ADMIN_PASSWORD_HASH,
    })

    switch (result.status) {
      case 'authenticated':
        return c.json({ token: result.token })
      case 'invalid_credentials':
        return c.json(
          { error: 'ユーザー名またはパスワードが正しくありません' },
          401,
        )
    }
  })
  .get('/me', (c) => {
    const user = c.get('user')
    return c.json({ username: user.sub })
  })
