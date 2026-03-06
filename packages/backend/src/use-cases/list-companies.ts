import type { CompanyRepository } from '../domain/ports/company-repository'

export function listCompanies(repository: CompanyRepository) {
  return repository.findAll()
}
