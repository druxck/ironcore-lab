import type { Achievement, GradingCriterion } from '@shared/content-types'
import type { RunResult } from '@shared/run-types'
import type { SaveData } from '@shared/save-types'
import { isValgrindClean } from '../wsl/diagnostics/parseValgrind'

/**
 * "Fixed it" achievements (first-fixed-error, first-valgrind-clean-fix) need
 * to know an exercise was previously broken. That's session-local, in-memory
 * state rather than something persisted to save.json - losing it across app
 * restarts just means an occasional missed achievement on a resumed exercise,
 * an acceptable tradeoff for what's flavor rather than core progression.
 */
const hadCompileOrCrashErrorThisSession = new Set<string>()
const hadValgrindDirtyThisSession = new Set<string>()

export function recordRunForAchievementTracking(exerciseId: string, runResult: RunResult): void {
  if (runResult.outcome === 'compile-error' || runResult.outcome === 'crashed') {
    hadCompileOrCrashErrorThisSession.add(exerciseId)
  }
  if (runResult.mode === 'valgrind' && runResult.valgrindSummary && !isValgrindClean(runResult.valgrindSummary)) {
    hadValgrindDirtyThisSession.add(exerciseId)
  }
}

export interface AchievementCheckContext {
  exerciseId: string
  runResult: RunResult
  criteriaMet: GradingCriterion[]
  lessonCompleted: boolean
  lessonId?: string
  arcId?: string
  arcRestorationPct?: number
  allArcsCompleted?: boolean
}

function isTriggered(achievement: Achievement, ctx: AchievementCheckContext): boolean {
  const { trigger } = achievement
  switch (trigger.type) {
    case 'first-compile':
      return ctx.runResult.outcome !== 'internal-error'

    case 'first-fixed-error':
      return ctx.runResult.outcome === 'completed' && hadCompileOrCrashErrorThisSession.has(ctx.exerciseId)

    case 'first-valgrind-clean-fix':
      return (
        ctx.runResult.mode === 'valgrind' &&
        !!ctx.runResult.valgrindSummary &&
        isValgrindClean(ctx.runResult.valgrindSummary) &&
        hadValgrindDirtyThisSession.has(ctx.exerciseId)
      )

    case 'lesson-completed-clean':
      return (
        ctx.lessonCompleted &&
        ctx.criteriaMet.includes('sanitizer-clean') &&
        ctx.criteriaMet.includes('valgrind-clean') &&
        (!trigger.lessonId || trigger.lessonId === ctx.lessonId)
      )

    case 'first-crash-diagnosed':
      return ctx.runResult.outcome === 'crashed' && ctx.runResult.signal === 'SIGSEGV'

    case 'first-gdb-session':
      return ctx.runResult.mode === 'gdb-batch' && ctx.runResult.outcome === 'completed'

    case 'arc-completed':
      return Boolean(trigger.arcId) && trigger.arcId === ctx.arcId && ctx.arcRestorationPct === 100

    case 'all-arcs-completed':
      return ctx.allArcsCompleted === true

    default:
      return false
  }
}

export function evaluateAchievements(
  save: SaveData,
  achievements: Achievement[],
  ctx: AchievementCheckContext
): string[] {
  const newlyUnlocked: string[] = []
  for (const achievement of achievements) {
    if (save.achievements.unlocked[achievement.id]) continue
    if (isTriggered(achievement, ctx)) newlyUnlocked.push(achievement.id)
  }
  return newlyUnlocked
}
