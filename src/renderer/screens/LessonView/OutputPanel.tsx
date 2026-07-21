import { useState } from 'react'
import type { RunResult } from '@shared/run-types'

interface Props {
  result: RunResult | null
  isRunning: boolean
}

export default function OutputPanel({ result, isRunning }: Props): JSX.Element {
  const [tab, setTab] = useState<'friendly' | 'raw'>('friendly')

  return (
    <div className="flex h-full flex-col overflow-hidden rounded border border-lab-wire bg-black/40">
      <div className="flex border-b border-lab-wire">
        {(['friendly', 'raw'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 text-xs uppercase tracking-wide ${
              tab === t ? 'bg-lab-phosphorDim/20 text-lab-phosphor' : 'text-lab-phosphorDim hover:text-lab-phosphor'
            }`}
          >
            {t === 'friendly' ? 'Friendly' : 'Raw Terminal'}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto p-3 text-sm">
        {isRunning && <div className="crt-flicker text-lab-phosphorDim">Compiling in the lab basement…</div>}
        {!isRunning && !result && (
          <div className="text-lab-phosphorDim">Run your code to see what the machine says.</div>
        )}
        {!isRunning && result && tab === 'friendly' && <FriendlyView result={result} />}
        {!isRunning && result && tab === 'raw' && <RawView result={result} />}
      </div>
    </div>
  )
}

function outcomeColor(outcome: RunResult['outcome']): string {
  switch (outcome) {
    case 'completed':
      return 'text-lab-phosphor'
    case 'compile-error':
    case 'crashed':
    case 'internal-error':
      return 'text-lab-alert'
    case 'timed-out':
      return 'text-lab-amber'
    default:
      return 'text-lab-phosphorDim'
  }
}

function FriendlyView({ result }: { result: RunResult }): JSX.Element {
  return (
    <div className="flex flex-col gap-3">
      <div className={`font-semibold ${outcomeColor(result.outcome)}`}>{result.friendlyMessage}</div>

      {result.diagnostics.length > 0 && (
        <div>
          <div className="mb-1 text-xs uppercase tracking-wide text-lab-phosphorDim">Problems</div>
          <ul className="flex flex-col gap-2">
            {result.diagnostics.map((d, i) => (
              <li key={i} className="rounded border border-lab-wire bg-lab-panel/60 p-2">
                <div className={d.severity === 'error' ? 'text-lab-alert' : 'text-lab-amber'}>
                  line {d.line}:{d.column} - {d.message}
                </div>
                {d.friendlyExplanation && (
                  <div className="mt-1 text-xs text-lab-phosphorDim">{d.friendlyExplanation}</div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.testResults && result.testResults.length > 0 && (
        <div>
          <div className="mb-1 text-xs uppercase tracking-wide text-lab-phosphorDim">Tests</div>
          <ul className="flex flex-col gap-1">
            {result.testResults.map((t) => (
              <li key={t.testId} className="flex items-start gap-2">
                <span className={t.passed ? 'text-lab-phosphor' : 'text-lab-alert'}>{t.passed ? '✔' : '✘'}</span>
                <span className="text-lab-phosphorDim">
                  {t.hidden ? 'Hidden test' : t.description}
                  {!t.passed && !t.hidden && t.expectedStdout !== undefined && (
                    <span className="block text-xs">
                      expected: <code className="text-lab-amber">{JSON.stringify(t.expectedStdout)}</code> got:{' '}
                      <code className="text-lab-alert">{JSON.stringify(t.actualStdout ?? '')}</code>
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.sanitizerFindings.length > 0 && (
        <div>
          <div className="mb-1 text-xs uppercase tracking-wide text-lab-phosphorDim">Sanitizer findings</div>
          <ul className="flex flex-col gap-1">
            {result.sanitizerFindings.map((f, i) => (
              <li key={i} className="text-lab-alert">
                {f.kind}: {f.summary}
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.valgrindSummary && (
        <div>
          <div className="mb-1 text-xs uppercase tracking-wide text-lab-phosphorDim">Memory report</div>
          <ul className="text-xs text-lab-phosphorDim">
            <li>Definitely lost: {result.valgrindSummary.definitelyLostBytes} bytes</li>
            <li>Indirectly lost: {result.valgrindSummary.indirectlyLostBytes} bytes</li>
            <li>Possibly lost: {result.valgrindSummary.possiblyLostBytes} bytes</li>
            <li>Errors: {result.valgrindSummary.errorCount}</li>
          </ul>
        </div>
      )}

      {result.stdout && (
        <div>
          <div className="mb-1 text-xs uppercase tracking-wide text-lab-phosphorDim">Program output</div>
          <pre className="overflow-x-auto rounded bg-black/50 p-2 text-xs text-lab-phosphor">{result.stdout}</pre>
        </div>
      )}
    </div>
  )
}

function RawView({ result }: { result: RunResult }): JSX.Element {
  const sections: Array<[string, string]> = [
    ['compile log', result.compileLog],
    ['stdout', result.stdout],
    ['stderr', result.stderr]
  ]
  if (result.valgrindSummary) sections.push(['valgrind', result.valgrindSummary.raw])

  return (
    <div className="flex flex-col gap-3 font-mono text-xs">
      {sections
        .filter(([, content]) => content)
        .map(([label, content]) => (
          <div key={label}>
            <div className="mb-1 text-lab-phosphorDim">$ {label}</div>
            <pre className="overflow-x-auto whitespace-pre-wrap rounded bg-black/50 p-2 text-lab-phosphor">
              {content}
            </pre>
          </div>
        ))}
    </div>
  )
}
