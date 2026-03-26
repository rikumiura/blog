import { describe, expect, it } from 'vitest'
import { formatDate } from '@/lib/format'

describe('formatDate', () => {
  it('ISO文字列を「年月日」形式にフォーマットする', () => {
    expect(formatDate('2025-01-01T00:00:00.000Z')).toBe('2025年1月1日')
  })

  it('月・日がゼロ埋めされない', () => {
    expect(formatDate('2025-03-05T00:00:00.000Z')).toBe('2025年3月5日')
  })

  it('年末の日付を正しくフォーマットする', () => {
    expect(formatDate('2025-12-31T15:00:00.000Z')).toBe('2026年1月1日')
  })

  it('日本時間で日付が変わる境界値を正しく処理する', () => {
    // UTC 14:59 = JST 23:59 → まだ同日
    expect(formatDate('2025-06-15T14:59:00.000Z')).toBe('2025年6月15日')
    // UTC 15:00 = JST 00:00 → 翌日
    expect(formatDate('2025-06-15T15:00:00.000Z')).toBe('2025年6月16日')
  })
})
