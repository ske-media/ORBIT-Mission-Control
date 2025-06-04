import { cn } from '../src/lib/utils'

describe('cn helper', () => {
  it('merges class names and resolves conflicts', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4')
  })
})
