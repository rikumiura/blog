import { atom } from 'jotai'
import type { Company } from '@/core/types/company'
import { companyApi } from './companies.api'

/** 会社一覧の状態 */
export const companiesAtom = atom<Company[]>([])

/** ローディング状態 */
export const companiesLoadingAtom = atom(false)

/** エラー状態 */
export const companiesErrorAtom = atom<string | null>(null)

/** 会社一覧を取得して状態を更新するアクション */
export const fetchCompaniesAtom = atom(null, async (_get, set) => {
  set(companiesLoadingAtom, true)
  set(companiesErrorAtom, null)
  try {
    const companies = await companyApi.findAll()
    set(companiesAtom, companies)
  } catch (error) {
    set(
      companiesErrorAtom,
      error instanceof Error ? error.message : '会社一覧の取得に失敗しました',
    )
  } finally {
    set(companiesLoadingAtom, false)
  }
})
