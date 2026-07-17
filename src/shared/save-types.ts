export const SAVE_SCHEMA_VERSION = 1

export type RankTitle =
  | 'New Hire'
  | 'Apprentice Technician'
  | 'Journeyman Engineer'
  | 'Systems Engineer'
  | 'Senior Engineer'
  | 'Principal Engineer'
  | 'Distinguished Engineer'
  | 'Lab Director'

export interface ExerciseResult {
  passedAt: string
  bestResult: {
    criteriaMet: string[]
    xpAwarded: number
    attempts: number
  }
}

export interface SaveData {
  schemaVersion: number
  profile: {
    createdAt: string
    rank: RankTitle
  }
  xp: {
    total: number
    byArc: Record<string, number>
  }
  progress: {
    lessonsCompleted: string[]
    exercisesCompleted: Record<string, ExerciseResult>
    arcRestorationPct: Record<string, number>
  }
  achievements: {
    unlocked: Record<string, string>
  }
  settings: {
    editorFontSize: number
    theme: 'crt-amber' | 'crt-phosphor'
    soundEnabled: boolean
  }
}

export function createDefaultSaveData(): SaveData {
  return {
    schemaVersion: SAVE_SCHEMA_VERSION,
    profile: {
      createdAt: new Date().toISOString(),
      rank: 'New Hire'
    },
    xp: {
      total: 0,
      byArc: {}
    },
    progress: {
      lessonsCompleted: [],
      exercisesCompleted: {},
      arcRestorationPct: {}
    },
    achievements: {
      unlocked: {}
    },
    settings: {
      editorFontSize: 14,
      theme: 'crt-phosphor',
      soundEnabled: true
    }
  }
}
