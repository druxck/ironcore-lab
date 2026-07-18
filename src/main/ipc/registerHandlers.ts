import { ipcMain, shell } from 'electron'
import { join } from 'path'
import type { RunOptions } from '@shared/run-types'
import type { SubmitResultRequest, SubmitResultResponse } from '@shared/ipc-contract'
import type { SaveData } from '@shared/save-types'
import * as contentLoader from '../content/contentLoader'
import * as wslSetup from '../setup/wslSetup'
import * as installActions from '../setup/installActions'
import * as saveStore from '../save/saveStore'
import { compileAndRun } from '../wsl/runPipeline'
import { computeRank, computeXpAward, evaluateGradingCriteria, meetsRequiredCriteria } from '../save/xpEngine'
import { evaluateAchievements, recordRunForAchievementTracking } from '../save/achievementsEngine'
import { getAppRoot } from '../paths'

export function registerIpcHandlers(): void {
  ipcMain.handle('content:getArcs', async () => contentLoader.getArcs())
  ipcMain.handle('content:getLesson', async (_e, req: { lessonId: string }) => contentLoader.getLesson(req.lessonId))
  ipcMain.handle('content:getLessonNarrative', async (_e, req: { lessonId: string }) => ({
    markdown: contentLoader.getLessonNarrative(contentLoader.getLesson(req.lessonId))
  }))
  ipcMain.handle('content:getExercisesForLesson', async (_e, req: { lessonId: string }) =>
    contentLoader.getExercisesForLesson(req.lessonId)
  )
  ipcMain.handle('content:getExercise', async (_e, req: { exerciseId: string }) =>
    contentLoader.getExercise(req.exerciseId)
  )
  ipcMain.handle('content:getHistoryCards', async (_e, req: { ids: string[] }) =>
    contentLoader.getHistoryCards(req.ids)
  )
  ipcMain.handle('content:getAchievements', async () => contentLoader.getAchievements())

  ipcMain.handle('run:compileAndRun', async (_e, req: RunOptions) => {
    const exercise = contentLoader.getExercise(req.exerciseId)
    const result = await compileAndRun(req.sourceCode, req.mode, exercise)
    recordRunForAchievementTracking(req.exerciseId, result)
    return result
  })

  ipcMain.handle('setup:getEnvironmentStatus', async () => wslSetup.getEnvironmentStatus())
  ipcMain.handle('setup:recheckEnvironment', async () => wslSetup.verifyAndPrepareEnvironment())
  ipcMain.handle('setup:deployRunner', async () => wslSetup.deployRunnerScript())
  ipcMain.handle('setup:openSetupDocs', async () => {
    await shell.openPath(join(getAppRoot(), 'docs', 'setup-manual.md'))
  })
  ipcMain.handle('setup:launchWslInstall', async (event) => {
    const logPath = await installActions.makeWslInstallLogPath()
    const result = installActions.launchWslInstall(logPath)
    if (result.launched) {
      installActions.pollWslInstallProgress(logPath, (progress) => {
        event.sender.send('setup:wslInstallProgress', progress)
      })
    }
    return result
  })
  ipcMain.handle('setup:launchToolchainInstall', async (event) =>
    installActions.runToolchainInstall((progress) => {
      event.sender.send('setup:toolchainInstallProgress', progress)
    })
  )

  ipcMain.handle('save:getSaveData', async () => saveStore.getSave())
  ipcMain.handle('save:updateSettings', async (_e, req: Partial<SaveData['settings']>) =>
    saveStore.updateSave((data) => {
      data.settings = { ...data.settings, ...req }
      return data
    })
  )
  ipcMain.handle('save:autosaveWorkspace', async (_e, req: { exerciseId: string; sourceCode: string }) => {
    saveStore.autosaveWorkspace(req.exerciseId, req.sourceCode)
  })
  ipcMain.handle('save:loadWorkspace', async (_e, req: { exerciseId: string }) => ({
    sourceCode: saveStore.loadWorkspace(req.exerciseId)
  }))

  ipcMain.handle('save:submitExerciseResult', async (_e, req: SubmitResultRequest): Promise<SubmitResultResponse> => {
    const exercise = contentLoader.getExercise(req.exerciseId)
    const lesson = contentLoader.getLesson(exercise.lessonId)
    const arc = contentLoader.getArcs().find((a) => a.id === lesson.arcId)
    if (!arc) throw new Error(`Unknown arc for lesson ${lesson.id}`)

    const criteriaMet = evaluateGradingCriteria(req.runResult)
    const passed = meetsRequiredCriteria(exercise, criteriaMet)

    const before = saveStore.getSave()
    const priorAttempts = before.progress.exercisesCompleted[req.exerciseId]?.bestResult.attempts ?? 0
    const attemptNumber = priorAttempts + 1
    const wasAlreadyPassed = Boolean(before.progress.exercisesCompleted[req.exerciseId]?.passedAt)

    const xpAwarded = passed && !wasAlreadyPassed ? computeXpAward(exercise, criteriaMet, attemptNumber).xp : 0

    const lessonExercises = contentLoader.getExercisesForLesson(lesson.id)
    const arcExercises = contentLoader.getExercisesForArc(arc.id)

    const afterSubmit = saveStore.updateSave((data) => {
      if (passed) {
        data.progress.exercisesCompleted[req.exerciseId] = {
          passedAt: new Date().toISOString(),
          bestResult: { criteriaMet, xpAwarded, attempts: attemptNumber }
        }
        if (!wasAlreadyPassed) {
          data.xp.total += xpAwarded
          data.xp.byArc[arc.id] = (data.xp.byArc[arc.id] ?? 0) + xpAwarded
          data.profile.rank = computeRank(data.xp.total)
        }
      } else {
        const existing = data.progress.exercisesCompleted[req.exerciseId]
        data.progress.exercisesCompleted[req.exerciseId] = existing
          ? { ...existing, bestResult: { ...existing.bestResult, attempts: attemptNumber } }
          : { passedAt: '', bestResult: { criteriaMet, xpAwarded: 0, attempts: attemptNumber } }
      }

      const lessonExerciseIds = lessonExercises.map((e) => e.id)
      const lessonNowComplete =
        lessonExerciseIds.length > 0 &&
        lessonExerciseIds.every((id) => Boolean(data.progress.exercisesCompleted[id]?.passedAt))
      if (lessonNowComplete && !data.progress.lessonsCompleted.includes(lesson.id)) {
        data.progress.lessonsCompleted.push(lesson.id)
      }

      const arcExerciseIds = arcExercises.map((e) => e.id)
      const completedInArc = arcExerciseIds.filter((id) => Boolean(data.progress.exercisesCompleted[id]?.passedAt)).length
      data.progress.arcRestorationPct[arc.id] = arcExerciseIds.length
        ? Math.round((completedInArc / arcExerciseIds.length) * 100)
        : 0

      return data
    })

    const lessonCompleted =
      afterSubmit.progress.lessonsCompleted.includes(lesson.id) &&
      !before.progress.lessonsCompleted.includes(lesson.id)
    const arcRestorationPct = afterSubmit.progress.arcRestorationPct[arc.id] ?? 0

    const authoredArcs = contentLoader.getArcs().filter((a) => a.status === 'authored')
    const allArcsCompleted = authoredArcs.every((a) => (afterSubmit.progress.arcRestorationPct[a.id] ?? 0) === 100)

    const achievements = contentLoader.getAchievements()
    const newlyUnlockedAchievements = evaluateAchievements(afterSubmit, achievements, {
      exerciseId: req.exerciseId,
      runResult: req.runResult,
      criteriaMet,
      lessonCompleted,
      lessonId: lesson.id,
      arcId: arc.id,
      arcRestorationPct,
      allArcsCompleted
    })

    let finalSave = afterSubmit
    if (newlyUnlockedAchievements.length > 0) {
      finalSave = saveStore.updateSave((data) => {
        for (const id of newlyUnlockedAchievements) {
          data.achievements.unlocked[id] = new Date().toISOString()
        }
        return data
      })
    }

    return { save: finalSave, xpAwarded, newlyUnlockedAchievements, lessonCompleted, arcRestorationPct }
  })
}
