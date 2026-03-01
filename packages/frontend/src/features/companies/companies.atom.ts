import { atom } from 'jotai'
import type { Company } from '@/core/types/company'
import { companyApi } from './companies.api'

/** 会社一覧の状態 */
export const companiesAtom = atom<Company[]>([])

/** 会社一覧を取得して状態を更新するアクション */
export const fetchCompaniesAtom = atom(null, async (_get, set) => {
  const companies = await companyApi.findAll()
  set(companiesAtom, companies)
})
