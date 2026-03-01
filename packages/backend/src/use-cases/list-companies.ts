import type { CompanyRepository } from '../domain/repositories/company-repository'

export function listCompanies(repository: CompanyRepository) {
  return repository.findAll()
}
