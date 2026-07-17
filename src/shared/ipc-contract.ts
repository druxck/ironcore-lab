import type { Achievement, Arc, Exercise, HistoryCard, Lesson, ArcOutlineLesson } from './content-types'
import type { RunOptions, RunResult } from './run-types'
import type { EnvironmentStatus } from './setup-types'
import type { SaveData } from './save-types'

export interface ArcWithLessons extends Arc {
  lessons: Lesson[]
  /** Only populated for status: 'outline' arcs. */
  outlineLessons?: ArcOutlineLesson[]
}

export interface SubmitResultRequest {
  exerciseId: string
  runResult: RunResult
}

export interface SubmitResultResponse {
  save: SaveData
  xpAwarded: number
  newlyUnlockedAchievements: string[]
  lessonCompleted: boolean
  arcRestorationPct: number
}

/**
 * The full set of main-process IPC channels, keyed by channel name, mapping
 * to (request, response) pairs. Both preload's contextBridge wrapper and
 * main's registerHandlers.ts are typed against this so a channel rename or
 * payload change fails to compile on both sides.
 */
export interface IpcChannelMap {
  'content:getArcs': { request: void; response: ArcWithLessons[] }
  'content:getLesson': { request: { lessonId: string }; response: Lesson }
  'content:getLessonNarrative': { request: { lessonId: string }; response: { markdown: string } }
  'content:getExercisesForLesson': { request: { lessonId: string }; response: Exercise[] }
  'content:getExercise': { request: { exerciseId: string }; response: Exercise }
  'content:getHistoryCards': { request: { ids: string[] }; response: HistoryCard[] }
  'content:getAchievements': { request: void; response: Achievement[] }

  'run:compileAndRun': { request: RunOptions; response: RunResult }

  'setup:getEnvironmentStatus': { request: void; response: EnvironmentStatus }
  'setup:recheckEnvironment': { request: void; response: EnvironmentStatus }
  'setup:deployRunner': { request: void; response: { deployed: boolean } }
  'setup:openSetupDocs': { request: void; response: void }

  'save:getSaveData': { request: void; response: SaveData }
  'save:submitExerciseResult': { request: SubmitResultRequest; response: SubmitResultResponse }
  'save:updateSettings': { request: Partial<SaveData['settings']>; response: SaveData }
  'save:autosaveWorkspace': { request: { exerciseId: string; sourceCode: string }; response: void }
  'save:loadWorkspace': { request: { exerciseId: string }; response: { sourceCode: string | null } }
}

export type IpcChannel = keyof IpcChannelMap
export type IpcRequest<C extends IpcChannel> = IpcChannelMap[C]['request']
export type IpcResponse<C extends IpcChannel> = IpcChannelMap[C]['response']
