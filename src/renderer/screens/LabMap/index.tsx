import { useState } from 'react'
import type { ArcWithLessons } from '@shared/ipc-contract'
import { useContentStore } from '../../state/useContentStore'
import { useSaveStore } from '../../state/useSaveStore'
import RoomTile from '../../components/RoomTile'

interface Props {
  onOpenLesson: (lessonId: string) => void
}

export default function LabMap({ onOpenLesson }: Props): JSX.Element {
  const arcs = useContentStore((s) => s.arcs)
  const save = useSaveStore((s) => s.save)
  const [selectedArcId, setSelectedArcId] = useState<string | null>(null)

  const restorationByArc = save?.progress.arcRestorationPct ?? {}

  function isLocked(arc: ArcWithLessons): { locked: boolean; reason?: string } {
    for (const req of arc.unlockRequires) {
      const pct = restorationByArc[req.arcId] ?? 0
      if (pct < req.minRestorationPct) {
        const blockingArc = arcs.find((a) => a.id === req.arcId)
        return {
          locked: true,
          reason: `Needs ${blockingArc?.roomName ?? req.arcId} restored to ${req.minRestorationPct}%`
        }
      }
    }
    return { locked: false }
  }

  const selectedArc = arcs.find((a) => a.id === selectedArcId) ?? null

  if (selectedArc) {
    return (
      <div className="blueprint-grid min-h-full p-6">
        <button
          type="button"
          onClick={() => setSelectedArcId(null)}
          className="mb-4 text-xs text-lab-phosphorDim hover:text-lab-phosphor"
        >
          ← Back to Lab Map
        </button>
        <h2 className="glow-text-phosphor font-blueprint text-xl text-lab-phosphor">{selectedArc.title}</h2>
        <p className="mt-1 max-w-2xl text-sm text-lab-phosphorDim">{selectedArc.longDescription}</p>

        {selectedArc.status === 'outline' ? (
          <div className="mt-6 rounded border border-lab-wire bg-lab-panel/50 p-4">
            <div className="text-sm text-lab-phosphorDim">This room hasn&apos;t been restored to the map yet.</div>
            <ul className="mt-3 flex flex-col gap-2">
              {selectedArc.outlineLessons?.map((lesson) => (
                <li key={lesson.workingTitle} className="text-sm text-lab-phosphorDim/80">
                  <span className="text-lab-phosphorDim">— </span>
                  {lesson.workingTitle}: {lesson.summary}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <ul className="mt-6 flex flex-col gap-2">
            {selectedArc.lessons.map((lesson) => {
              const completed = save?.progress.lessonsCompleted.includes(lesson.id)
              return (
                <li key={lesson.id}>
                  <button
                    type="button"
                    onClick={() => onOpenLesson(lesson.id)}
                    className={`flex w-full items-center justify-between rounded border px-4 py-3 text-left transition-colors ${
                      completed
                        ? 'border-lab-phosphor/40 bg-lab-panel/80'
                        : 'border-lab-wire bg-lab-panel/50 hover:border-lab-phosphorDim'
                    }`}
                  >
                    <span>
                      <span className="mr-2 text-xs text-lab-phosphorDim">{lesson.order}.</span>
                      <span className={completed ? 'glow-text-phosphor text-lab-phosphor' : 'text-lab-phosphorDim'}>
                        {lesson.title}
                      </span>
                    </span>
                    <span className="text-xs text-lab-phosphorDim">
                      {completed ? '✔ restored' : `${lesson.estXp} XP`}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    )
  }

  return (
    <div className="blueprint-grid min-h-full p-6">
      <h2 className="glow-text-phosphor font-blueprint text-xl text-lab-phosphor">Lab Map</h2>
      <p className="mt-1 max-w-2xl text-sm text-lab-phosphorDim">
        Meridian Computing Laboratory, dark since the early &apos;80s. Restore each room by mastering what was once
        studied there.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {arcs.map((arc) => {
          const { locked, reason } = isLocked(arc)
          return (
            <RoomTile
              key={arc.id}
              arc={arc}
              restorationPct={restorationByArc[arc.id] ?? 0}
              locked={locked}
              lockReason={reason}
              onClick={() => setSelectedArcId(arc.id)}
            />
          )
        })}
      </div>
    </div>
  )
}
