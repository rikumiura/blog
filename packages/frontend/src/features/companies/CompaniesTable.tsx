import { useAtomValue, useSetAtom } from 'jotai'
import { useEffect } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  companiesAtom,
  companiesErrorAtom,
  companiesLoadingAtom,
  fetchCompaniesAtom,
} from './companies.atom'

export function CompaniesTable() {
  const companies = useAtomValue(companiesAtom)
  const isLoading = useAtomValue(companiesLoadingAtom)
  const error = useAtomValue(companiesErrorAtom)
  const fetchCompanies = useSetAtom(fetchCompaniesAtom)

  useEffect(() => {
    fetchCompanies()
  }, [fetchCompanies])

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16">ID</TableHead>
          <TableHead>会社名</TableHead>
          <TableHead>住所</TableHead>
          <TableHead>電話番号</TableHead>
          <TableHead>郵便番号</TableHead>
          <TableHead>担当者</TableHead>
          <TableHead>作成日</TableHead>
          <TableHead>更新日</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          <TableRow>
            <TableCell
              colSpan={8}
              className="text-center text-muted-foreground"
            >
              読み込み中...
            </TableCell>
          </TableRow>
        ) : error ? (
          <TableRow>
            <TableCell colSpan={8} className="text-center text-destructive">
              {error}
            </TableCell>
          </TableRow>
        ) : companies.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={8}
              className="text-center text-muted-foreground"
            >
              会社データがありません
            </TableCell>
          </TableRow>
        ) : (
          companies.map((company) => (
            <TableRow key={company.id}>
              <TableCell>{company.id}</TableCell>
              <TableCell className="font-medium">{company.name}</TableCell>
              <TableCell>{company.address}</TableCell>
              <TableCell>{company.phone}</TableCell>
              <TableCell>{company.postalCode}</TableCell>
              <TableCell>{company.contactPerson}</TableCell>
              <TableCell>{company.createdAt}</TableCell>
              <TableCell>{company.updatedAt}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}
