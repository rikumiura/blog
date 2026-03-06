import { companies } from '@my-blog/db'
import type { Company } from '../../domain/models/company'
import type { CompanyRepository } from '../../domain/ports/company-repository'
import type { DbClient } from '../database'

export class DrizzleCompanyRepository implements CompanyRepository {
  private db: DbClient

  constructor(db: DbClient) {
    this.db = db
  }

  async findAll(): Promise<Company[]> {
    const rows = await this.db.select().from(companies)
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      address: row.address,
      phone: row.phone,
      postalCode: row.postalCode,
      contactPerson: row.contactPerson,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }))
  }
}
