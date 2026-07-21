import { existsSync, readdirSync, readFileSync } from 'fs'
import { join } from 'path'
import { z } from 'zod'
import type { Achievement, Arc, ArcOutlineLesson, Exercise, HistoryCard, Lesson } from '@shared/content-types'
import type { ArcWithLessons } from '@shared/ipc-contract'
import { getContentRoot } from '../paths'
import {
  AchievementSchema,
  ArcOutlineLessonSchema,
  ArcSchema,
  ContentManifestSchema,
  ExerciseSchema,
  HistoryCardSchema,
  LessonSchema,
  TestCaseSchema
} from './contentSchema'

interface LoadedContent {
  arcs: ArcWithLessons[]
  lessonsById: Map<string, Lesson>
  exercisesById: Map<string, Exercise>
  historyCardsById: Map<string, HistoryCard>
  achievements: Achievement[]
}

let cache: LoadedContent | null = null

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T
}

function subdirs(path: string): string[] {
  if (!existsSync(path)) return []
  return readdirSync(path, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort()
}

interface LoadedArc {
  arc: Arc
  lessons: Lesson[]
  outlineLessons?: ArcOutlineLesson[]
  exercises: Exercise[]
}

function loadArcDir(contentRoot: string, arcDirName: string): LoadedArc {
  const arcPath = join(contentRoot, 'arcs', arcDirName)
  const arc = ArcSchema.parse(readJson(join(arcPath, 'arc.json')))

  if (arc.status === 'outline') {
    const outlinePath = join(arcPath, 'lessons-outline.json')
    const outlineLessons = z.array(ArcOutlineLessonSchema).parse(readJson(outlinePath))
    return { arc, lessons: [], outlineLessons, exercises: [] }
  }

  const lessonsDir = join(arcPath, 'lessons')
  const lessons: Lesson[] = []
  const exercises: Exercise[] = []

  for (const lessonDirName of subdirs(lessonsDir)) {
    const lessonPath = join(lessonsDir, lessonDirName)
    const lessonJson = readJson<Record<string, unknown>>(join(lessonPath, 'lesson.json'))
    const lesson = LessonSchema.parse({ ...lessonJson, arcId: arc.id })
    lessons.push(lesson)

    const exercisesDir = join(lessonPath, 'exercises')
    for (const exerciseDirName of subdirs(exercisesDir)) {
      const exercisePath = join(exercisesDir, exerciseDirName)
      const exerciseJson = readJson<Record<string, unknown>>(join(exercisePath, 'exercise.json'))
      const testsPath = join(exercisePath, 'tests.json')
      const tests = existsSync(testsPath) ? z.array(TestCaseSchema).parse(readJson(testsPath)) : []
      const exercise = ExerciseSchema.parse({ ...exerciseJson, lessonId: lesson.id, tests })
      exercises.push(exercise)
    }
  }

  lessons.sort((a, b) => a.order - b.order)
  return { arc, lessons, exercises }
}

function loadHistoryCards(contentRoot: string): Map<string, HistoryCard> {
  const path = join(contentRoot, 'trivia', 'history-cards.json')
  if (!existsSync(path)) return new Map()
  const cards = z.array(HistoryCardSchema).parse(readJson(path))
  return new Map(cards.map((c) => [c.id, c]))
}

function loadAchievements(contentRoot: string): Achievement[] {
  const path = join(contentRoot, 'achievements', 'achievements.json')
  if (!existsSync(path)) return []
  return z.array(AchievementSchema).parse(readJson(path))
}

function loadAll(): LoadedContent {
  const contentRoot = getContentRoot()
  const manifest = ContentManifestSchema.parse(readJson(join(contentRoot, 'manifest.json')))

  const arcs: ArcWithLessons[] = []
  const lessonsById = new Map<string, Lesson>()
  const exercisesById = new Map<string, Exercise>()

  for (const arcDirName of manifest.arcs) {
    const { arc, lessons, outlineLessons, exercises } = loadArcDir(contentRoot, arcDirName)
    arcs.push({ ...arc, lessons, outlineLessons })
    for (const lesson of lessons) lessonsById.set(lesson.id, lesson)
    for (const exercise of exercises) exercisesById.set(exercise.id, exercise)
  }

  arcs.sort((a, b) => a.order - b.order)

  return {
    arcs,
    lessonsById,
    exercisesById,
    historyCardsById: loadHistoryCards(contentRoot),
    achievements: loadAchievements(contentRoot)
  }
}

function loadContent(): LoadedContent {
  if (!cache) cache = loadAll()
  return cache
}

/** Dev convenience - content edits normally don't require an app restart. */
export function invalidateContentCache(): void {
  cache = null
}

export function getArcs(): ArcWithLessons[] {
  return loadContent().arcs
}

export function getLesson(lessonId: string): Lesson {
  const lesson = loadContent().lessonsById.get(lessonId)
  if (!lesson) throw new Error(`Unknown lesson: ${lessonId}`)
  return lesson
}

export function getExercise(exerciseId: string): Exercise {
  const exercise = loadContent().exercisesById.get(exerciseId)
  if (!exercise) throw new Error(`Unknown exercise: ${exerciseId}`)
  return exercise
}

export function getHistoryCards(ids: string[]): HistoryCard[] {
  const map = loadContent().historyCardsById
  return ids.map((id) => map.get(id)).filter((c): c is HistoryCard => Boolean(c))
}

export function getAchievements(): Achievement[] {
  return loadContent().achievements
}

export function getExercisesForLesson(lessonId: string): Exercise[] {
  return Array.from(loadContent().exercisesById.values())
    .filter((e) => e.lessonId === lessonId)
    .sort((a, b) => a.order - b.order)
}

export function getExercisesForArc(arcId: string): Exercise[] {
  const arc = loadContent().arcs.find((a) => a.id === arcId)
  const lessonIds = new Set((arc?.lessons ?? []).map((l) => l.id))
  return Array.from(loadContent().exercisesById.values()).filter((e) => lessonIds.has(e.lessonId))
}

export function getLessonNarrative(lesson: Lesson): string {
  const path = join(getContentRoot(), lesson.narrativeContentPath)
  return readFileSync(path, 'utf8')
}
