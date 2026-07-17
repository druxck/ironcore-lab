import { describe, expect, it } from 'vitest'
import { parseGccOutput } from '../../src/main/wsl/diagnostics/parseGcc'

describe('parseGccOutput', () => {
  it('parses a single error line', () => {
    const log = "source.c:5:12: error: expected ';' before 'return'"
    const diags = parseGccOutput(log)
    expect(diags).toHaveLength(1)
    expect(diags[0]).toMatchObject({ file: 'source.c', line: 5, column: 12, severity: 'error' })
    expect(diags[0].message).toContain("expected ';' before 'return'")
  })

  it('parses multiple lines including warnings', () => {
    const log = [
      "source.c:3:9: warning: unused variable 'x' [-Wunused-variable]",
      'source.c:7:1: error: expected declaration or statement at end of input'
    ].join('\n')
    const diags = parseGccOutput(log)
    expect(diags).toHaveLength(2)
    expect(diags[0].severity).toBe('warning')
    expect(diags[1].severity).toBe('error')
  })

  it('ignores non-diagnostic lines', () => {
    const log = 'In file included from source.c:1:\nsome other compiler noise'
    expect(parseGccOutput(log)).toHaveLength(0)
  })

  it('returns an empty array for a clean compile log', () => {
    expect(parseGccOutput('')).toHaveLength(0)
  })
})
