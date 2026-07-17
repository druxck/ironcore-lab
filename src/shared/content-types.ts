export type ArcStatus = 'authored' | 'outline'

export interface ArcUnlockRequirement {
  arcId: string
  minRestorationPct: number
}

export interface Arc {
  id: string
  title: string
  roomName: string
  shortDescription: string
  longDescription: string
  order: number
  unlockRequires: ArcUnlockRequirement[]
  theme: {
    accentColor: string
    motif: string
  }
  status: ArcStatus
}

/** Present only for outline-only arcs — a lightweight preview of what's coming. */
export interface ArcOutlineLesson {
  workingTitle: string
  summary: string
}

export interface Lesson {
  id: string
  arcId: string
  order: number
  title: string
  objectives: string[]
  prerequisites: string[]
  narrativeContentPath: string
  estXp: number
  historyCardIds?: string[]
}

export type ExerciseType =
  | 'write-program'
  | 'fix-the-bug'
  | 'predict-output'
  | 'fill-in-blank'
  | 'debug-with-gdb'

export type GradingCriterion =
  | 'stdout-match'
  | 'no-warnings'
  | 'sanitizer-clean'
  | 'valgrind-clean'

export interface TestCase {
  id: string
  stdin: string
  expectedStdout: string
  matchMode: 'exact' | 'trim' | 'normalize-whitespace'
  hidden: boolean
  description: string
}

export interface Exercise {
  id: string
  lessonId: string
  order: number
  title: string
  type: ExerciseType
  prompt: string
  starterCode: string
  /** Only used by predict-output / fill-in-blank; graded client-side, no WSL round-trip. */
  expectedAnswer?: string
  /** Only used by debug-with-gdb; a canned `gdb -batch -x` script run against a fixed buggy binary. */
  gdbCommands?: string
  gradingCriteria: GradingCriterion[]
  baseXp: number
  timeoutSeconds: number
  memoryLimitMb: number
  tests: TestCase[]
}

export interface HistoryCard {
  id: string
  title: string
  body: string
  year?: string
  tags: string[]
}

export interface ContentManifest {
  schemaVersion: number
  arcs: string[]
}

export type AchievementTriggerType =
  | 'first-compile'
  | 'first-fixed-error'
  | 'first-valgrind-clean-fix'
  | 'lesson-completed-clean'
  | 'first-crash-diagnosed'
  | 'first-gdb-session'
  | 'arc-completed'
  | 'all-arcs-completed'

export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  trigger: {
    type: AchievementTriggerType
    arcId?: string
    lessonId?: string
  }
}
