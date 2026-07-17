import { describe, expect, it } from 'vitest'
import {
  computeRank,
  computeXpAward,
  evaluateGradingCriteria,
  meetsRequiredCriteria
} from '../../src/main/save/xpEngine'
import type { Exercise, GradingCriterion } from '@shared/content-types'
import type { RunResult } from '@shared/run-types'

function makeExercise(overrides: Partial<Exercise> = {}): Exercise {
  return {
    id: 'ex1',
    lessonId: 'lesson1',
    order: 1,
    title: 'Test',
    type: 'write-program',
    prompt: '',
    starterCode: '',
    gradingCriteria: ['stdout-match'],
    baseXp: 40,
    timeoutSeconds: 5,
    memoryLimitMb: 64,
    tests: [],
    ...overrides
  }
}

function makeRunResult(overrides: Partial<RunResult> = {}): RunResult {
  return {
    mode: 'test',
    outcome: 'completed',
    exitCode: null,
    signal: null,
    stdout: '',
    stderr: '',
    compileLog: '',
    diagnostics: [],
    sanitizerFindings: [],
    durationMs: 10,
    friendlyMessage: '',
    ...overrides
  }
}

describe('evaluateGradingCriteria', () => {
  it('includes stdout-match when every test passes', () => {
    const result = makeRunResult({
      testResults: [{ testId: 't1', passed: true, hidden: false, description: '' }]
    })
    expect(evaluateGradingCriteria(result)).toContain('stdout-match')
  })

  it('omits stdout-match when any test fails', () => {
    const result = makeRunResult({
      testResults: [
        { testId: 't1', passed: true, hidden: false, description: '' },
        { testId: 't2', passed: false, hidden: false, description: '' }
      ]
    })
    expect(evaluateGradingCriteria(result)).not.toContain('stdout-match')
  })

  it('includes no-warnings only when diagnostics are empty', () => {
    expect(evaluateGradingCriteria(makeRunResult())).toContain('no-warnings')
    const withWarning = makeRunResult({
      diagnostics: [{ file: 'a.c', line: 1, column: 1, severity: 'warning', message: 'x' }]
    })
    expect(evaluateGradingCriteria(withWarning)).not.toContain('no-warnings')
  })

  it('includes sanitizer-clean only when there are no findings', () => {
    expect(evaluateGradingCriteria(makeRunResult())).toContain('sanitizer-clean')
    const withFinding = makeRunResult({
      sanitizerFindings: [{ kind: 'AddressSanitizer', summary: 'x', raw: 'x' }]
    })
    expect(evaluateGradingCriteria(withFinding)).not.toContain('sanitizer-clean')
  })

  it('includes valgrind-clean only when the summary is clean', () => {
    const clean = makeRunResult({
      valgrindSummary: {
        definitelyLostBytes: 0,
        indirectlyLostBytes: 0,
        possiblyLostBytes: 0,
        stillReachableBytes: 0,
        errorCount: 0,
        raw: ''
      }
    })
    expect(evaluateGradingCriteria(clean)).toContain('valgrind-clean')

    const dirty = makeRunResult({
      valgrindSummary: {
        definitelyLostBytes: 40,
        indirectlyLostBytes: 0,
        possiblyLostBytes: 0,
        stillReachableBytes: 0,
        errorCount: 1,
        raw: ''
      }
    })
    expect(evaluateGradingCriteria(dirty)).not.toContain('valgrind-clean')
  })
})

describe('meetsRequiredCriteria', () => {
  it('passes when every required criterion is met', () => {
    const exercise = makeExercise({ gradingCriteria: ['stdout-match', 'no-warnings'] })
    const met: GradingCriterion[] = ['stdout-match', 'no-warnings', 'sanitizer-clean']
    expect(meetsRequiredCriteria(exercise, met)).toBe(true)
  })

  it('fails when a required criterion is missing', () => {
    const exercise = makeExercise({ gradingCriteria: ['stdout-match', 'valgrind-clean'] })
    expect(meetsRequiredCriteria(exercise, ['stdout-match'])).toBe(false)
  })
})

describe('computeXpAward', () => {
  it('awards base xp plus a first-try bonus', () => {
    const exercise = makeExercise({ baseXp: 40 })
    const award = computeXpAward(exercise, ['stdout-match'], 1)
    expect(award.xp).toBe(40 + Math.round(40 * 0.25))
  })

  it('awards no first-try bonus on a later attempt', () => {
    const exercise = makeExercise({ baseXp: 40 })
    const award = computeXpAward(exercise, ['stdout-match'], 2)
    expect(award.xp).toBe(40)
  })

  it('awards bonus xp for meeting a criterion beyond what was required', () => {
    const exercise = makeExercise({ baseXp: 40, gradingCriteria: ['stdout-match'] })
    const award = computeXpAward(exercise, ['stdout-match', 'no-warnings'], 2)
    expect(award.xp).toBe(50)
  })

  it('does not double-award bonus xp for a criterion that was already required', () => {
    const exercise = makeExercise({ baseXp: 40, gradingCriteria: ['stdout-match', 'no-warnings'] })
    const award = computeXpAward(exercise, ['stdout-match', 'no-warnings'], 2)
    expect(award.xp).toBe(40)
  })
})

describe('computeRank', () => {
  it('starts at New Hire', () => {
    expect(computeRank(0)).toBe('New Hire')
  })

  it('reaches Lab Director at the top threshold', () => {
    expect(computeRank(8000)).toBe('Lab Director')
  })

  it('picks the highest threshold not exceeding the total', () => {
    expect(computeRank(700)).toBe('Journeyman Engineer')
  })
})
