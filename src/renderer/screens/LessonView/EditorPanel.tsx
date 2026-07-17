import { useEffect, useRef } from 'react'
import Editor, { type OnMount } from '@monaco-editor/react'
import type { CompilerDiagnostic } from '@shared/run-types'

type EditorInstance = Parameters<OnMount>[0]
type MonacoInstance = Parameters<OnMount>[1]

interface Props {
  value: string
  onChange: (value: string) => void
  diagnostics: CompilerDiagnostic[]
  height?: string
}

export default function EditorPanel({ value, onChange, diagnostics, height = '420px' }: Props): JSX.Element {
  const editorRef = useRef<EditorInstance | null>(null)
  const monacoRef = useRef<MonacoInstance | null>(null)

  function applyMarkers(diags: CompilerDiagnostic[]): void {
    const editor = editorRef.current
    const monaco = monacoRef.current
    const model = editor?.getModel()
    if (!editor || !monaco || !model) return

    const markers = diags.map((d) => ({
      startLineNumber: d.line,
      startColumn: d.column,
      endLineNumber: d.line,
      endColumn: d.column + 1,
      message: d.friendlyExplanation ? `${d.message}\n\n${d.friendlyExplanation}` : d.message,
      severity:
        d.severity === 'error'
          ? monaco.MarkerSeverity.Error
          : d.severity === 'warning'
            ? monaco.MarkerSeverity.Warning
            : monaco.MarkerSeverity.Info
    }))
    monaco.editor.setModelMarkers(model, 'ironcore', markers)
  }

  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco
    applyMarkers(diagnostics)
  }

  useEffect(() => {
    applyMarkers(diagnostics)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diagnostics])

  return (
    <div className="overflow-hidden rounded border border-lab-wire">
      <Editor
        height={height}
        defaultLanguage="c"
        theme="vs-dark"
        value={value}
        onChange={(v) => onChange(v ?? '')}
        onMount={handleMount}
        options={{
          fontSize: 14,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 4
        }}
      />
    </div>
  )
}
