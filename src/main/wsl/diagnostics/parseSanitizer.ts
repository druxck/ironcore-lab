import type { SanitizerFinding } from '@shared/run-types'

/**
 * ASan, LeakSanitizer, and UBSan all write to stderr. ASan/LSan blocks start
 * with an `==<pid>==ERROR: AddressSanitizer: ...` or
 * `==<pid>==ERROR: LeakSanitizer: detected memory leaks` line and run until a
 * blank line — LSan runs automatically as part of `-fsanitize=address` at
 * program exit, so a plain "forgot to free" leak (no overflow, no
 * use-after-free) reports under the LeakSanitizer banner, not
 * AddressSanitizer's. UBSan blocks are a single
 * `file:line:col: runtime error: ...` line (sometimes followed by a SUMMARY
 * line) with no `==pid==` framing.
 */
export function parseSanitizerOutput(stderr: string): SanitizerFinding[] {
  const findings: SanitizerFinding[] = []
  const lines = stderr.split(/\r?\n/)
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    const asanOrLsanMatch = /==\d+==ERROR: (AddressSanitizer|LeakSanitizer)/.exec(line)
    if (asanOrLsanMatch) {
      const block: string[] = []
      while (i < lines.length && lines[i].trim() !== '') {
        block.push(lines[i])
        i++
      }
      const summaryLine = block.find((l) => l.includes('SUMMARY:')) ?? block[0]
      findings.push({
        kind: asanOrLsanMatch[1] === 'LeakSanitizer' ? 'LeakSanitizer' : 'AddressSanitizer',
        summary: summaryLine.trim(),
        raw: block.join('\n')
      })
      continue
    }

    if (/runtime error:/.test(line)) {
      const block: string[] = [line]
      i++
      if (i < lines.length && /SUMMARY:/.test(lines[i])) {
        block.push(lines[i])
        i++
      }
      findings.push({
        kind: 'UndefinedBehaviorSanitizer',
        summary: line.trim(),
        raw: block.join('\n')
      })
      continue
    }

    i++
  }

  return findings
}
