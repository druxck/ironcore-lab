import { z } from 'zod'

export const ArcStatusSchema = z.enum(['authored', 'outline'])

export const ArcSchema = z.object({
  id: z.string(),
  title: z.string(),
  roomName: z.string(),
  shortDescription: z.string(),
  longDescription: z.string(),
  order: z.number(),
  unlockRequires: z.array(z.object({ arcId: z.string(), minRestorationPct: z.number() })),
  theme: z.object({ accentColor: z.string(), motif: z.string() }),
  status: ArcStatusSchema
})

export const ArcOutlineLessonSchema = z.object({
  workingTitle: z.string(),
  summary: z.string()
})

export const LessonSchema = z.object({
  id: z.string(),
  arcId: z.string(),
  order: z.number(),
  title: z.string(),
  objectives: z.array(z.string()),
  prerequisites: z.array(z.string()),
  narrativeContentPath: z.string(),
  estXp: z.number(),
  historyCardIds: z.array(z.string()).optional()
})

export const TestCaseSchema = z.object({
  id: z.string(),
  stdin: z.string(),
  expectedStdout: z.string(),
  matchMode: z.enum(['exact', 'trim', 'normalize-whitespace']),
  hidden: z.boolean(),
  description: z.string()
})

export const ExerciseSchema = z.object({
  id: z.string(),
  lessonId: z.string(),
  order: z.number(),
  title: z.string(),
  type: z.enum(['write-program', 'fix-the-bug', 'predict-output', 'fill-in-blank', 'debug-with-gdb']),
  prompt: z.string(),
  starterCode: z.string(),
  expectedAnswer: z.string().optional(),
  gdbCommands: z.string().optional(),
  gradingCriteria: z.array(z.enum(['stdout-match', 'no-warnings', 'sanitizer-clean', 'valgrind-clean'])),
  baseXp: z.number(),
  timeoutSeconds: z.number(),
  memoryLimitMb: z.number(),
  tests: z.array(TestCaseSchema)
})

export const HistoryCardSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string(),
  year: z.string().optional(),
  tags: z.array(z.string())
})

export const ContentManifestSchema = z.object({
  schemaVersion: z.number(),
  arcs: z.array(z.string())
})

export const AchievementSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  icon: z.string(),
  trigger: z.object({
    type: z.enum([
      'first-compile',
      'first-fixed-error',
      'first-valgrind-clean-fix',
      'lesson-completed-clean',
      'first-crash-diagnosed',
      'first-gdb-session',
      'arc-completed',
      'all-arcs-completed'
    ]),
    arcId: z.string().optional(),
    lessonId: z.string().optional()
  })
})

export const ErrorGlossaryEntrySchema = z.object({
  match: z.string(),
  explanation: z.string(),
  relatedLessonId: z.string().optional()
})
