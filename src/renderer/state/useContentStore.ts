import { create } from 'zustand'
import type { ArcWithLessons } from '@shared/ipc-contract'
import type { Achievement, Exercise, HistoryCard, Lesson } from '@shared/content-types'

interface ContentState {
  arcs: ArcWithLessons[]
  achievements: Achievement[]
  exerciseCache: Record<string, Exercise>
  historyCardCache: Record<string, HistoryCard>
  loaded: boolean
  loadAll: () => Promise<void>
  getExercise: (exerciseId: string) => Promise<Exercise>
  getExercisesForLesson: (lessonId: string) => Promise<Exercise[]>
  getLessonNarrative: (lessonId: string) => Promise<string>
  getHistoryCards: (ids: string[]) => Promise<HistoryCard[]>
  findLesson: (lessonId: string) => Lesson | undefined
  findArcForLesson: (lessonId: string) => ArcWithLessons | undefined
}

export const useContentStore = create<ContentState>((set, get) => ({
  arcs: [],
  achievements: [],
  exerciseCache: {},
  historyCardCache: {},
  loaded: false,

  loadAll: async () => {
    const [arcs, achievements] = await Promise.all([
      window.lab.invoke('content:getArcs', undefined),
      window.lab.invoke('content:getAchievements', undefined)
    ])
    set({ arcs, achievements, loaded: true })
  },

  getExercise: async (exerciseId) => {
    const cached = get().exerciseCache[exerciseId]
    if (cached) return cached
    const exercise = await window.lab.invoke('content:getExercise', { exerciseId })
    set((state) => ({ exerciseCache: { ...state.exerciseCache, [exerciseId]: exercise } }))
    return exercise
  },

  getExercisesForLesson: async (lessonId) => {
    const exercises = await window.lab.invoke('content:getExercisesForLesson', { lessonId })
    set((state) => {
      const next = { ...state.exerciseCache }
      for (const exercise of exercises) next[exercise.id] = exercise
      return { exerciseCache: next }
    })
    return exercises
  },

  getLessonNarrative: async (lessonId) => {
    const { markdown } = await window.lab.invoke('content:getLessonNarrative', { lessonId })
    return markdown
  },

  getHistoryCards: async (ids) => {
    if (ids.length === 0) return []
    const missing = ids.filter((id) => !get().historyCardCache[id])
    if (missing.length > 0) {
      const cards = await window.lab.invoke('content:getHistoryCards', { ids: missing })
      set((state) => {
        const next = { ...state.historyCardCache }
        for (const card of cards) next[card.id] = card
        return { historyCardCache: next }
      })
    }
    const cache = get().historyCardCache
    return ids.map((id) => cache[id]).filter((c): c is HistoryCard => Boolean(c))
  },

  findLesson: (lessonId) => {
    for (const arc of get().arcs) {
      const lesson = arc.lessons.find((l) => l.id === lessonId)
      if (lesson) return lesson
    }
    return undefined
  },

  findArcForLesson: (lessonId) => {
    return get().arcs.find((arc) => arc.lessons.some((l) => l.id === lessonId))
  }
}))
