export type PipelineMode = 'run' | 'test' | 'sanitize' | 'valgrind' | 'gdb-batch'

export type DiagnosticSeverity = 'error' | 'warning' | 'note'

export interface CompilerDiagnostic {
  file: string
  line: number
  column: number
  severity: DiagnosticSeverity
  message: string
  /** Populated by errorGlossary.ts when a curated explanation matches. */
  friendlyExplanation?: string
  relatedLessonId?: string
}

export interface SanitizerFinding {
  kind: 'AddressSanitizer' | 'LeakSanitizer' | 'UndefinedBehaviorSanitizer'
  summary: string
  raw: string
}

export interface ValgrindSummary {
  definitelyLostBytes: number
  indirectlyLostBytes: number
  possiblyLostBytes: number
  stillReachableBytes: number
  errorCount: number
  raw: string
}

export type ProcessOutcome =
  | 'completed'
  | 'timed-out'
  | 'crashed'
  | 'compile-error'
  | 'internal-error'

export interface TestCaseResult {
  testId: string
  passed: boolean
  hidden: boolean
  actualStdout?: string
  expectedStdout?: string
  description: string
}

export interface RunResult {
  mode: PipelineMode
  outcome: ProcessOutcome
  exitCode: number | null
  signal: string | null
  stdout: string
  stderr: string
  compileLog: string
  diagnostics: CompilerDiagnostic[]
  sanitizerFindings: SanitizerFinding[]
  valgrindSummary?: ValgrindSummary
  testResults?: TestCaseResult[]
  durationMs: number
  friendlyMessage: string
}

export interface RunOptions {
  exerciseId: string
  sourceCode: string
  mode: PipelineMode
  timeoutSeconds: number
  memoryLimitMb: number
}
