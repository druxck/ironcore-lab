import { useState } from 'react'
import type { HistoryCard } from '@shared/content-types'

export default function HistoryCallout({ card }: { card: HistoryCard }): JSX.Element | null {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null

  return (
    <aside className="my-4 rounded border border-lab-amber/30 bg-lab-panel/70 p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="glow-text-amber text-xs font-semibold uppercase tracking-wide text-lab-amber">
            From the Lab Archives{card.year ? ` - ${card.year}` : ''}
          </div>
          <div className="mt-1 text-sm font-semibold text-lab-amber/90">{card.title}</div>
          <p className="mt-1 text-sm leading-relaxed text-lab-phosphorDim">{card.body}</p>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="shrink-0 text-lab-phosphorDim hover:text-lab-phosphor"
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
    </aside>
  )
}
