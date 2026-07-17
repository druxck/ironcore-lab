import type { CompilerDiagnostic } from '@shared/run-types'

const DIAG_LINE = /^(.+?):(\d+):(\d+):\s+(error|warning|note):\s+(.*)$/

/**
 * Parses gcc/clang -Wall -Wextra output into structured diagnostics.
 * The compiler is invoked against a file literally named `source.c` inside
 * the run directory, so `file` here is always that basename.
 */
export function parseGccOutput(compileLog: string): CompilerDiagnostic[] {
  const diagnostics: CompilerDiagnostic[] = []
  const lines = compileLog.split(/\r?\n/)

  for (const line of lines) {
    const match = DIAG_LINE.exec(line.trim())
    if (!match) continue
    const [, file, lineNo, colNo, severity, message] = match
    diagnostics.push({
      file,
      line: Number(lineNo),
      column: Number(colNo),
      severity: severity as CompilerDiagnostic['severity'],
      message: message.trim()
    })
  }

  return diagnostics
}
