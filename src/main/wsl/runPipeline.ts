import { randomUUID } from 'crypto'
import type { PipelineMode, ProcessOutcome, RunResult, TestCaseResult } from '@shared/run-types'
import type { Exercise, TestCase } from '@shared/content-types'
import { base64Decode, base64Encode, execInWsl, getWslHomeDir } from './wslBridge'
import { parseGccOutput } from './diagnostics/parseGcc'
import { parseSanitizerOutput } from './diagnostics/parseSanitizer'
import { isValgrindClean, parseValgrindOutput } from './diagnostics/parseValgrind'
import { annotateWithGlossary } from './errorGlossary'

const MAX_RETAINED_RUNS = 20

/** Resolved (not literal "$HOME") — see getWslHomeDir's doc comment for why. */
async function getLabHome(): Promise<string> {
  const home = await getWslHomeDir()
  return `${home}/.ironcore-lab`
}

const SIGNAL_NAMES: Record<number, string> = {
  4: 'SIGILL',
  6: 'SIGABRT',
  8: 'SIGFPE',
  9: 'SIGKILL',
  11: 'SIGSEGV',
  13: 'SIGPIPE',
  15: 'SIGTERM'
}

interface CaseSpec {
  id: string
  stdin: string
}

function buildCases(mode: PipelineMode, exercise: Exercise): CaseSpec[] {
  if (mode === 'gdb-batch') return []
  if (mode === 'run') {
    const first = exercise.tests[0]
    return [{ id: 'main', stdin: first?.stdin ?? '' }]
  }
  return exercise.tests.map((t) => ({ id: t.id, stdin: t.stdin }))
}

function matchesExpected(actual: string, expected: string, matchMode: TestCase['matchMode']): boolean {
  switch (matchMode) {
    case 'exact':
      return actual === expected
    case 'trim':
      return actual.trim() === expected.trim()
    case 'normalize-whitespace':
      return actual.trim().replace(/\s+/g, ' ') === expected.trim().replace(/\s+/g, ' ')
    default:
      return actual === expected
  }
}

function parseFileDump(output: string): Record<string, string> {
  const files: Record<string, string> = {}
  for (const line of output.split(/\r?\n/)) {
    const match = /^FILE:(.*?):([A-Za-z0-9+/=]*)$/.exec(line)
    if (!match) continue
    const [, filename, b64] = match
    files[filename] = base64Decode(b64)
  }
  return files
}

function classifyExitCode(exitCode: number): { outcome: ProcessOutcome; signal: string | null } {
  if (exitCode === 124) return { outcome: 'timed-out', signal: null }
  if (exitCode > 128 && exitCode < 128 + 65) {
    const signalNum = exitCode - 128
    return { outcome: 'crashed', signal: SIGNAL_NAMES[signalNum] ?? `signal ${signalNum}` }
  }
  return { outcome: 'completed', signal: null }
}

function buildFriendlyMessage(
  mode: PipelineMode,
  outcome: ProcessOutcome,
  signal: string | null,
  testResults: TestCaseResult[] | undefined,
  valgrindClean: boolean | undefined,
  sanitizerCount: number
): string {
  if (outcome === 'compile-error') {
    return "Your code didn't compile. Check the Problems panel for the exact line and what the compiler expected."
  }
  if (outcome === 'timed-out') {
    return "Your program didn't finish in time — check for an infinite loop, an infinite recursion, or a blocking read with no input."
  }
  if (outcome === 'crashed') {
    if (signal === 'SIGSEGV') {
      return 'Your program crashed with a segmentation fault — it touched memory it had no right to touch. Common causes: a null or dangling pointer, or an out-of-bounds array access.'
    }
    if (signal === 'SIGABRT') {
      return 'Your program aborted — often from a failed assertion, a detected heap corruption, or a sanitizer catching undefined behavior.'
    }
    return `Your program crashed (${signal ?? 'unknown signal'}).`
  }

  if (sanitizerCount > 0) {
    return `AddressSanitizer/UBSan flagged ${sanitizerCount} issue${sanitizerCount === 1 ? '' : 's'} — your program ran, but it triggered undefined behavior along the way.`
  }

  if (valgrindClean === false) {
    return 'Valgrind found memory issues — see the Memory Report for the leak trace.'
  }
  if (valgrindClean === true) {
    return 'Clean run under Valgrind — no leaks, no errors.'
  }

  if (mode === 'test' && testResults) {
    const passed = testResults.filter((t) => t.passed).length
    if (passed === testResults.length) return `All ${testResults.length} tests passed.`
    return `${passed} of ${testResults.length} tests passed.`
  }

  return 'Program ran to completion.'
}

async function cleanupOldRuns(): Promise<void> {
  const labHome = await getLabHome()
  const script = `cd '${labHome}/runs' 2>/dev/null && ls -1t | tail -n +${MAX_RETAINED_RUNS + 1} | xargs -r rm -rf --`
  await execInWsl(script, { timeoutMs: 10_000 }).catch(() => undefined)
}

export async function compileAndRun(sourceCode: string, mode: PipelineMode, exercise: Exercise): Promise<RunResult> {
  const startedAt = Date.now()
  const labHome = await getLabHome()
  const runnerPath = `${labHome}/bin/run-exercise.sh`
  const collectPath = `${labHome}/bin/collect-output.sh`
  const runId = randomUUID()
  const rundir = `${labHome}/runs/${runId}`
  const cases = buildCases(mode, exercise)

  const setup: string[] = []
  setup.push(`mkdir -p '${rundir}/stdin' '${rundir}/out'`)
  setup.push(`echo '${base64Encode(sourceCode)}' | base64 -d > '${rundir}/source.c'`)
  setup.push(`printf '%s' '${mode}' > '${rundir}/mode.txt'`)
  setup.push(`printf '%s\\n%s\\n' '${exercise.timeoutSeconds}' '${exercise.memoryLimitMb}' > '${rundir}/limits.txt'`)

  if (mode === 'gdb-batch') {
    const gdbScript = exercise.gdbCommands ?? 'run\nbt\n'
    setup.push(`echo '${base64Encode(gdbScript)}' | base64 -d > '${rundir}/gdb-commands.txt'`)
  } else {
    // Trailing newline matters: run-exercise.sh reads this with `while read`,
    // which silently skips the final line if the file doesn't end in \n —
    // fatal when there's exactly one case (a lone line with no newline at all).
    const caseIds = cases.map((c) => c.id).join('\n') + '\n'
    setup.push(`echo '${base64Encode(caseIds)}' | base64 -d > '${rundir}/cases.txt'`)
    for (const c of cases) {
      setup.push(`echo '${base64Encode(c.stdin)}' | base64 -d > '${rundir}/stdin/${c.id}.txt'`)
    }
  }
  setup.push(`bash '${runnerPath}' '${rundir}'`)

  const perCaseBudgetMs = (exercise.timeoutSeconds + 5) * 1000
  const totalBudgetMs = perCaseBudgetMs * Math.max(cases.length, 1) + 20_000
  const execResult = await execInWsl(setup.join('\n'), { timeoutMs: totalBudgetMs })

  if (execResult.timedOut) {
    return emptyResult(mode, 'internal-error', startedAt, "The lab bridge to WSL didn't respond in time. Try again — if this keeps happening, reopen the app.")
  }

  // Delegates to a deployed script file rather than inline `-c` text: a
  // `find | while read` loop passed as inline text through wsl.exe's
  // Windows->Linux argument handoff has been observed to arrive corrupted
  // (empty loop variables, or a bash syntax error quoting one of the loop's
  // own values) even though the identical logic works reliably as a real
  // file — see collect-output.sh's own header comment for the full story.
  const retrieveResult = await execInWsl(`bash '${collectPath}' '${rundir}'`, { timeoutMs: 15_000 })
  const files = parseFileDump(retrieveResult.stdout)

  void cleanupOldRuns()

  const compileLog = files['out/compile.log'] ?? execResult.stderr
  const compileExitCode = Number(files['out/compile.exitcode'] ?? '1')
  const diagnostics = annotateWithGlossary(parseGccOutput(compileLog))

  if (compileExitCode !== 0) {
    return {
      mode,
      outcome: 'compile-error',
      exitCode: compileExitCode,
      signal: null,
      stdout: '',
      stderr: '',
      compileLog,
      diagnostics,
      sanitizerFindings: [],
      durationMs: Date.now() - startedAt,
      friendlyMessage: buildFriendlyMessage(mode, 'compile-error', null, undefined, undefined, 0)
    }
  }

  if (mode === 'gdb-batch') {
    const gdbLog = files['out/gdb.log'] ?? ''
    return {
      mode,
      outcome: 'completed',
      exitCode: Number(files['out/gdb.exitcode'] ?? '0'),
      signal: null,
      stdout: gdbLog,
      stderr: '',
      compileLog,
      diagnostics,
      sanitizerFindings: [],
      durationMs: Date.now() - startedAt,
      friendlyMessage: 'Debugger session complete — read the trace above.'
    }
  }

  let overallOutcome: ProcessOutcome = 'completed'
  let overallSignal: string | null = null
  let combinedStdout = ''
  let combinedStderr = ''
  const testResults: TestCaseResult[] = []
  const sanitizerFindings = []
  let valgrindSummary
  let anySanitizerCount = 0

  for (const c of cases) {
    const exitCode = Number(files[`out/${c.id}.exitcode`] ?? '0')
    const stdout = files[`out/${c.id}.stdout`] ?? ''
    const stderr = files[`out/${c.id}.stderr`] ?? ''
    const { outcome, signal } = classifyExitCode(exitCode)

    combinedStdout += stdout
    combinedStderr += stderr

    if (outcome === 'timed-out') overallOutcome = 'timed-out'
    else if (outcome === 'crashed' && overallOutcome !== 'timed-out') {
      overallOutcome = 'crashed'
      overallSignal = signal
    }

    const findings = parseSanitizerOutput(stderr)
    sanitizerFindings.push(...findings)
    anySanitizerCount += findings.length

    if (mode === 'valgrind') {
      const vlog = files[`out/${c.id}.valgrind.log`] ?? ''
      const parsed = parseValgrindOutput(vlog)
      valgrindSummary = valgrindSummary
        ? {
            definitelyLostBytes: valgrindSummary.definitelyLostBytes + parsed.definitelyLostBytes,
            indirectlyLostBytes: valgrindSummary.indirectlyLostBytes + parsed.indirectlyLostBytes,
            possiblyLostBytes: valgrindSummary.possiblyLostBytes + parsed.possiblyLostBytes,
            stillReachableBytes: valgrindSummary.stillReachableBytes + parsed.stillReachableBytes,
            errorCount: valgrindSummary.errorCount + parsed.errorCount,
            raw: `${valgrindSummary.raw}\n${parsed.raw}`
          }
        : parsed
    }

    const testDef = exercise.tests.find((t) => t.id === c.id)
    if (testDef) {
      const passed =
        outcome === 'completed' && matchesExpected(stdout, testDef.expectedStdout, testDef.matchMode)
      testResults.push({
        testId: testDef.id,
        passed,
        hidden: testDef.hidden,
        actualStdout: testDef.hidden ? undefined : stdout,
        expectedStdout: testDef.hidden ? undefined : testDef.expectedStdout,
        description: testDef.description
      })
    }
  }

  const valgrindClean = mode === 'valgrind' && valgrindSummary ? isValgrindClean(valgrindSummary) : undefined

  return {
    mode,
    outcome: overallOutcome,
    exitCode: null,
    signal: overallSignal,
    stdout: combinedStdout,
    stderr: combinedStderr,
    compileLog,
    diagnostics,
    sanitizerFindings,
    valgrindSummary,
    testResults: mode === 'run' ? undefined : testResults,
    durationMs: Date.now() - startedAt,
    friendlyMessage: buildFriendlyMessage(
      mode,
      overallOutcome,
      overallSignal,
      mode === 'run' ? undefined : testResults,
      valgrindClean,
      anySanitizerCount
    )
  }
}

function emptyResult(mode: PipelineMode, outcome: ProcessOutcome, startedAt: number, message: string): RunResult {
  return {
    mode,
    outcome,
    exitCode: null,
    signal: null,
    stdout: '',
    stderr: '',
    compileLog: '',
    diagnostics: [],
    sanitizerFindings: [],
    durationMs: Date.now() - startedAt,
    friendlyMessage: message
  }
}
