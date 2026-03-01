import type { AppType } from '@my-blog/backend/src/index'
import { hc } from 'hono/client'
import type { CompanyRepository } from '@/core/ports/company-repository'
import type { Company } from '@/core/types/company'

const client = hc<AppType>(
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8787',
)

/** Hono RPCクライアントによるCompanyRepositoryの実装 */
export const companyApi: CompanyRepository = {
  async findAll(): Promise<Company[]> {
    const res = await client.api.companies.$get()
    if (!res.ok) {
      throw new Error(`会社一覧の取得に失敗しました: ${res.status}`)
    }
    return await res.json()
  },
}
