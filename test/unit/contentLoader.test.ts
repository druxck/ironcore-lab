import { resolve } from 'path'
import { beforeAll, describe, expect, it, vi } from 'vitest'

vi.mock('electron', () => ({
  app: {
    getAppPath: () => resolve(__dirname, '../..')
  }
}))

describe('contentLoader', () => {
  let contentLoader: typeof import('../../src/main/content/contentLoader')

  beforeAll(async () => {
    contentLoader = await import('../../src/main/content/contentLoader')
  })

  it('loads every arc from the manifest without throwing schema validation', () => {
    const arcs = contentLoader.getArcs()
    expect(arcs.length).toBeGreaterThan(0)
  })

  it('every authored arc has at least one lesson, every outline arc has outline lessons', () => {
    for (const arc of contentLoader.getArcs()) {
      if (arc.status === 'authored') {
        expect(arc.lessons.length).toBeGreaterThan(0)
      } else {
        expect(arc.outlineLessons?.length ?? 0).toBeGreaterThan(0)
      }
    }
  })

  it('every authored lesson has at least one exercise', () => {
    for (const arc of contentLoader.getArcs()) {
      if (arc.status !== 'authored') continue
      for (const lesson of arc.lessons) {
        expect(contentLoader.getExercisesForLesson(lesson.id).length).toBeGreaterThan(0)
      }
    }
  })

  it('exercise ids are globally unique', () => {
    const seen = new Set<string>()
    for (const arc of contentLoader.getArcs()) {
      if (arc.status !== 'authored') continue
      for (const lesson of arc.lessons) {
        for (const exercise of contentLoader.getExercisesForLesson(lesson.id)) {
          expect(seen.has(exercise.id)).toBe(false)
          seen.add(exercise.id)
        }
      }
    }
  })

  it('write-program and fix-the-bug exercises declare at least one test case', () => {
    for (const arc of contentLoader.getArcs()) {
      if (arc.status !== 'authored') continue
      for (const lesson of arc.lessons) {
        for (const exercise of contentLoader.getExercisesForLesson(lesson.id)) {
          if (exercise.type === 'write-program' || exercise.type === 'fix-the-bug') {
            expect(exercise.tests.length).toBeGreaterThan(0)
          }
        }
      }
    }
  })

  it('predict-output and fill-in-blank exercises declare an expected answer', () => {
    for (const arc of contentLoader.getArcs()) {
      if (arc.status !== 'authored') continue
      for (const lesson of arc.lessons) {
        for (const exercise of contentLoader.getExercisesForLesson(lesson.id)) {
          if (exercise.type === 'predict-output' || exercise.type === 'fill-in-blank') {
            expect(exercise.expectedAnswer?.length ?? 0).toBeGreaterThan(0)
          }
        }
      }
    }
  })

  it('every lesson narrative file exists and is non-empty', () => {
    for (const arc of contentLoader.getArcs()) {
      if (arc.status !== 'authored') continue
      for (const lesson of arc.lessons) {
        expect(contentLoader.getLessonNarrative(lesson).length).toBeGreaterThan(0)
      }
    }
  })

  it('loads achievements', () => {
    expect(contentLoader.getAchievements().length).toBeGreaterThan(0)
  })
})
