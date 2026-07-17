import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { createDefaultSaveData, SAVE_SCHEMA_VERSION, type SaveData } from '@shared/save-types'
import { getUserDataDir } from '../paths'
import { migrateToV1 } from './migrations/v1'

let cachedSave: SaveData | null = null

function getSavePath(): string {
  return join(getUserDataDir(), 'save.json')
}

function getWorkspaceDir(exerciseId: string): string {
  return join(getUserDataDir(), 'workspace', exerciseId)
}

function ensureDir(path: string): void {
  if (!existsSync(path)) mkdirSync(path, { recursive: true })
}

function runMigrations(raw: unknown): SaveData {
  let data = raw as { schemaVersion?: number }
  if (!data || typeof data.schemaVersion !== 'number') {
    return createDefaultSaveData()
  }
  if (data.schemaVersion < 1) {
    data = migrateToV1(data)
  }
  // Future migrations chain here, e.g.: if (data.schemaVersion < 2) data = migrateToV2(data)
  return data as SaveData
}

export function loadSave(): SaveData {
  if (cachedSave) return cachedSave

  const path = getSavePath()
  if (!existsSync(path)) {
    cachedSave = createDefaultSaveData()
    writeSave(cachedSave)
    return cachedSave
  }

  try {
    const raw = JSON.parse(readFileSync(path, 'utf8'))
    cachedSave = runMigrations(raw)
  } catch {
    // Corrupt save file: don't silently destroy it, but don't crash the app either.
    const backupPath = `${path}.corrupt-${Date.now()}.bak`
    try {
      renameSync(path, backupPath)
    } catch {
      /* best effort */
    }
    cachedSave = createDefaultSaveData()
    writeSave(cachedSave)
  }

  return cachedSave
}

export function writeSave(data: SaveData): void {
  cachedSave = data
  const path = getSavePath()
  ensureDir(dirname(path))
  const tmpPath = `${path}.tmp`
  writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf8')
  renameSync(tmpPath, path)
}

export function getSave(): SaveData {
  return cachedSave ?? loadSave()
}

export function updateSave(mutator: (data: SaveData) => SaveData): SaveData {
  const current = getSave()
  const next = mutator(structuredClone(current))
  next.schemaVersion = SAVE_SCHEMA_VERSION
  writeSave(next)
  return next
}

export function autosaveWorkspace(exerciseId: string, sourceCode: string): void {
  const dir = getWorkspaceDir(exerciseId)
  ensureDir(dir)
  writeFileSync(join(dir, 'solution.c'), sourceCode, 'utf8')
}

export function loadWorkspace(exerciseId: string): string | null {
  const path = join(getWorkspaceDir(exerciseId), 'solution.c')
  if (!existsSync(path)) return null
  return readFileSync(path, 'utf8')
}
