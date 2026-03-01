import type { Company } from '../models/company'

export interface CompanyRepository {
  findAll(): Promise<Company[]>
}
