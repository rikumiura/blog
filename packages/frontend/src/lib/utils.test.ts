import { describe, expect, it } from 'vitest'
import { cn } from './utils'

describe('cn', () => {
  it('単一のクラス名をそのまま返す', () => {
    expect(cn('text-red-500')).toBe('text-red-500')
  })

  it('複数のクラス名を結合する', () => {
    expect(cn('p-4', 'mt-2')).toBe('p-4 mt-2')
  })

  it('falsy な値を無視する', () => {
    expect(cn('p-4', false && 'hidden', null, undefined, 'mt-2')).toBe(
      'p-4 mt-2',
    )
  })

  it('条件付きクラスを処理する', () => {
    const isActive = true
    expect(cn('btn', isActive && 'btn-active')).toBe('btn btn-active')
  })

  it('Tailwind の競合するクラスを後者で上書きする', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2')
  })

  it('異なるプロパティの Tailwind クラスはマージする', () => {
    expect(cn('p-4', 'mt-2')).toBe('p-4 mt-2')
  })

  it('引数なしで空文字列を返す', () => {
    expect(cn()).toBe('')
  })
})
