import type { Exercise, GradingCriterion } from '@shared/content-types'
import type { RunResult } from '@shared/run-types'
import type { RankTitle } from '@shared/save-types'
import { isValgrindClean } from '../wsl/diagnostics/parseValgrind'

/** What a given run actually achieved, independent of what the exercise requires. */
export function evaluateGradingCriteria(runResult: RunResult): GradingCriterion[] {
  const met: GradingCriterion[] = []

  if (runResult.testResults && runResult.testResults.length > 0) {
    if (runResult.testResults.every((t) => t.passed)) met.push('stdout-match')
  }

  const hasWarnings = runResult.diagnostics.some((d) => d.severity === 'warning' || d.severity === 'error')
  if (!hasWarnings) met.push('no-warnings')

  if (runResult.sanitizerFindings.length === 0) met.push('sanitizer-clean')

  if (runResult.valgrindSummary && isValgrindClean(runResult.valgrindSummary)) {
    met.push('valgrind-clean')
  }

  return met
}

export function meetsRequiredCriteria(exercise: Exercise, criteriaMet: GradingCriterion[]): boolean {
  return exercise.gradingCriteria.every((required) => criteriaMet.includes(required))
}

const OPTIONAL_BONUS_XP: Record<GradingCriterion, number> = {
  'stdout-match': 0,
  'no-warnings': 10,
  'sanitizer-clean': 15,
  'valgrind-clean': 20
}

export interface XpAward {
  xp: number
  breakdown: string[]
}

/** Bonuses only apply to criteria the exercise didn't already require — going beyond spec. */
export function computeXpAward(exercise: Exercise, criteriaMet: GradingCriterion[], attemptNumber: number): XpAward {
  const breakdown = [`Base: ${exercise.baseXp} XP`]
  let xp = exercise.baseXp

  for (const criterion of criteriaMet) {
    const bonus = OPTIONAL_BONUS_XP[criterion]
    if (bonus > 0 && !exercise.gradingCriteria.includes(criterion)) {
      xp += bonus
      breakdown.push(`Bonus — ${criterion} (not required): +${bonus} XP`)
    }
  }

  if (attemptNumber === 1) {
    const firstTryBonus = Math.round(exercise.baseXp * 0.25)
    if (firstTryBonus > 0) {
      xp += firstTryBonus
      breakdown.push(`First-try bonus: +${firstTryBonus} XP`)
    }
  }

  return { xp, breakdown }
}

const RANK_THRESHOLDS: Array<[number, RankTitle]> = [
  [0, 'New Hire'],
  [200, 'Apprentice Technician'],
  [600, 'Journeyman Engineer'],
  [1200, 'Systems Engineer'],
  [2200, 'Senior Engineer'],
  [3600, 'Principal Engineer'],
  [5400, 'Distinguished Engineer'],
  [8000, 'Lab Director']
]

export function computeRank(totalXp: number): RankTitle {
  let rank: RankTitle = 'New Hire'
  for (const [threshold, title] of RANK_THRESHOLDS) {
    if (totalXp >= threshold) rank = title
  }
  return rank
}
