import type { Company } from '@/core/types/company'

/** 会社データ取得のポートインターフェース（依存関係逆転） */
export interface CompanyRepository {
  findAll(): Promise<Company[]>
}
