import { createDefaultSaveData } from '@shared/save-types'

/**
 * Baseline migration: anything without a recognizable schemaVersion (or
 * pre-dating the save system entirely) is treated as a fresh save. Future
 * migrations (migrateToV2, etc.) should transform the *shape* of existing
 * data field-by-field instead of resetting it - this one just establishes
 * the pattern for the file layout described in content-authoring-guide.md.
 */
export function migrateToV1(_legacyData: unknown): ReturnType<typeof createDefaultSaveData> {
  return createDefaultSaveData()
}
