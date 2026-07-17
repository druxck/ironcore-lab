import { resolve } from 'path'
import { beforeAll, describe, expect, it, vi } from 'vitest'

/**
 * Exercises the real WSL bridge — needs a working toolchain inside WSL Ubuntu
 * (see docs/setup-manual.md). Run manually with `npm run test:wsl`; this is
 * deliberately excluded from `npm run test` / CI, since CI has no WSL.
 *
 * runPipeline.ts pulls the error glossary via paths.ts's `app.getAppPath()`,
 * which only exists inside a real Electron process — mock it the same way
 * contentLoader.test.ts does so this can run under plain Node/Vitest.
 */
vi.mock('electron', () => ({
  app: {
    getAppPath: () => resolve(__dirname, '../..')
  }
}))

const { compileAndRun } = await import('../../src/main/wsl/runPipeline')
const { deployRunnerScript } = await import('../../src/main/setup/wslSetup')
type Exercise = import('@shared/content-types').Exercise

beforeAll(async () => {
  // Normally done by verifyAndPrepareEnvironment() on app launch; this suite
  // calls compileAndRun() directly, so it has to deploy the runner itself.
  const { deployed } = await deployRunnerScript()
  if (!deployed) throw new Error('Failed to deploy run-exercise.sh into WSL before running integration tests')
}, 20_000)

function makeExercise(overrides: Partial<Exercise> = {}): Exercise {
  return {
    id: 'integration-hello',
    lessonId: 'integration',
    order: 1,
    title: 'Integration smoke test',
    type: 'write-program',
    prompt: '',
    starterCode: '',
    gradingCriteria: ['stdout-match'],
    baseXp: 0,
    timeoutSeconds: 5,
    memoryLimitMb: 64,
    tests: [
      { id: 'main', stdin: '', expectedStdout: 'hello\n', matchMode: 'exact', hidden: false, description: 'prints hello' }
    ],
    ...overrides
  }
}

describe('compileAndRun (real WSL)', () => {
  it('compiles and runs a correct program', async () => {
    const source = '#include <stdio.h>\nint main(void) { printf("hello\\n"); return 0; }\n'
    const result = await compileAndRun(source, 'test', makeExercise())
    expect(result.outcome).toBe('completed')
    expect(result.testResults?.every((t) => t.passed)).toBe(true)
  })

  it('reports a compile error with parsed diagnostics', async () => {
    const source = '#include <stdio.h>\nint main(void) { printf("hello\\n") return 0; }\n'
    const result = await compileAndRun(source, 'run', makeExercise())
    expect(result.outcome).toBe('compile-error')
    expect(result.diagnostics.length).toBeGreaterThan(0)
  })

  it('times out an infinite loop instead of hanging the app', async () => {
    const source = '#include <stdio.h>\nint main(void) { while (1) {} return 0; }\n'
    const result = await compileAndRun(source, 'run', makeExercise({ timeoutSeconds: 2 }))
    expect(result.outcome).toBe('timed-out')
  }, 20_000)

  it('flags a real memory leak under valgrind', async () => {
    const source = '#include <stdlib.h>\nint main(void) { int *p = malloc(sizeof(int)); *p = 1; return 0; }\n'
    const result = await compileAndRun(source, 'valgrind', makeExercise({ gradingCriteria: ['valgrind-clean'] }))
    expect(result.valgrindSummary?.definitelyLostBytes ?? 0).toBeGreaterThan(0)
  }, 20_000)
})
