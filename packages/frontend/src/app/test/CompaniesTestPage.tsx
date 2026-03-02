import { CompaniesTable } from '@/features/companies/CompaniesTable'

export function CompaniesTestPage() {
  return (
    <div className="mx-auto max-w-4xl p-5 font-sans">
      <h1 className="mb-6 text-2xl font-bold">会社一覧（テスト）</h1>
      <CompaniesTable />
    </div>
  )
}
