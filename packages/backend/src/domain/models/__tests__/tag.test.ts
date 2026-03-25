import { describe, expect, it } from 'vitest'
import { createTagName } from '../tag'

describe('createTagName', () => {
  it('有効なタグ名が作成できる', () => {
    const result = createTagName('TypeScript')
    expect(result).toEqual({ ok: true, value: 'TypeScript' })
  })

  it('前後の空白がトリミングされる', () => {
    const result = createTagName('  React  ')
    expect(result).toEqual({ ok: true, value: 'React' })
  })

  it('空文字の場合エラーが返る', () => {
    const result = createTagName('')
    expect(result).toEqual({ ok: false, message: 'タグ名は空にできません' })
  })

  it('空白のみの場合エラーが返る', () => {
    const result = createTagName('   ')
    expect(result).toEqual({ ok: false, message: 'タグ名は空にできません' })
  })

  it('31文字以上の場合エラーが返る', () => {
    const result = createTagName('a'.repeat(31))
    expect(result).toEqual({
      ok: false,
      message: 'タグ名は30文字以内にしてください',
    })
  })

  it('ちょうど30文字の場合は作成できる', () => {
    const name = 'a'.repeat(30)
    const result = createTagName(name)
    expect(result).toEqual({ ok: true, value: name })
  })
})
