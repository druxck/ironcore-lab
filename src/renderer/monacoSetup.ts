import * as monaco from 'monaco-editor'
import { loader } from '@monaco-editor/react'
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'

// Bundled locally so the editor works fully offline and never needs a
// script-src exception to a CDN — Ironcore Lab's CSP stays locked to 'self'.
self.MonacoEnvironment = {
  getWorker() {
    return new EditorWorker()
  }
}

loader.config({ monaco })
