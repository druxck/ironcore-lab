import { readFileSync } from 'fs'
import { join } from 'path'
import type { CompilerDiagnostic } from '@shared/run-types'
import { getContentRoot } from '../paths'

interface GlossaryEntry {
  match: string
  explanation: string
  relatedLessonId?: string
}

let cache: GlossaryEntry[] | null = null

function loadGlossary(): GlossaryEntry[] {
  if (cache) return cache
  const path = join(getContentRoot(), 'error-glossary', 'gcc-clang.json')
  const raw = readFileSync(path, 'utf8')
  cache = JSON.parse(raw) as GlossaryEntry[]
  return cache
}

/** Substring-matches each diagnostic's message against the curated glossary. */
export function annotateWithGlossary(diagnostics: CompilerDiagnostic[]): CompilerDiagnostic[] {
  const glossary = loadGlossary()
  return diagnostics.map((d) => {
    const entry = glossary.find((g) => d.message.toLowerCase().includes(g.match.toLowerCase()))
    if (!entry) return d
    return { ...d, friendlyExplanation: entry.explanation, relatedLessonId: entry.relatedLessonId }
  })
}
