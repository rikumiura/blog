import { describe, expect, it } from 'vitest'
import { add } from './math'

describe('add', () => {
  it('2つの正の数を足せる', () => {
    expect(add(1, 2)).toBe(3)
  })

  it('負の数を扱える', () => {
    expect(add(-1, -2)).toBe(-3)
  })

  it('0を足すと元の値を返す', () => {
    expect(add(5, 0)).toBe(5)
  })
})
