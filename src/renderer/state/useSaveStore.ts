import { create } from 'zustand'
import type { SaveData } from '@shared/save-types'
import type { RunResult } from '@shared/run-types'

interface AwardSummary {
  xpAwarded: number
  newlyUnlockedAchievements: string[]
  lessonCompleted: boolean
  arcRestorationPct: number
}

interface SaveState {
  save: SaveData | null
  loaded: boolean
  lastAward: AwardSummary | null
  load: () => Promise<void>
  submitExerciseResult: (exerciseId: string, runResult: RunResult) => Promise<AwardSummary>
  updateSettings: (settings: Partial<SaveData['settings']>) => Promise<void>
  clearLastAward: () => void
}

export const useSaveStore = create<SaveState>((set) => ({
  save: null,
  loaded: false,
  lastAward: null,

  load: async () => {
    const save = await window.lab.invoke('save:getSaveData', undefined)
    set({ save, loaded: true })
  },

  submitExerciseResult: async (exerciseId, runResult) => {
    const response = await window.lab.invoke('save:submitExerciseResult', { exerciseId, runResult })
    const award: AwardSummary = {
      xpAwarded: response.xpAwarded,
      newlyUnlockedAchievements: response.newlyUnlockedAchievements,
      lessonCompleted: response.lessonCompleted,
      arcRestorationPct: response.arcRestorationPct
    }
    set({ save: response.save, lastAward: award })
    return award
  },

  updateSettings: async (settings) => {
    const save = await window.lab.invoke('save:updateSettings', settings)
    set({ save })
  },

  clearLastAward: () => set({ lastAward: null })
}))
