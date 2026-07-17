import type { ValgrindSummary } from '@shared/run-types'

function extractBytes(log: string, label: string): number {
  const match = new RegExp(`${label}:\\s*([\\d,]+) bytes`).exec(log)
  if (!match) return 0
  return Number(match[1].replace(/,/g, ''))
}

export function parseValgrindOutput(log: string): ValgrindSummary {
  const errorMatch = /ERROR SUMMARY:\s*(\d+) errors?/.exec(log)

  return {
    definitelyLostBytes: extractBytes(log, 'definitely lost'),
    indirectlyLostBytes: extractBytes(log, 'indirectly lost'),
    possiblyLostBytes: extractBytes(log, 'possibly lost'),
    stillReachableBytes: extractBytes(log, 'still reachable'),
    errorCount: errorMatch ? Number(errorMatch[1]) : 0,
    raw: log
  }
}

export function isValgrindClean(summary: ValgrindSummary): boolean {
  return (
    summary.errorCount === 0 &&
    summary.definitelyLostBytes === 0 &&
    summary.indirectlyLostBytes === 0 &&
    summary.possiblyLostBytes === 0
  )
}
