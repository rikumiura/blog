import type { CompanyRepository } from '@/core/ports/company-repository'
import type { Company } from '@/core/types/company'
import { apiClient } from '@/lib/api-client'

/** Hono RPCクライアントによるCompanyRepositoryの実装 */
export const companyApi: CompanyRepository = {
  async findAll(): Promise<Company[]> {
    const res = await apiClient.api.companies.$get()
    if (!res.ok) {
      throw new Error(`会社一覧の取得に失敗しました: ${res.status}`)
    }
    return await res.json()
  },
}
