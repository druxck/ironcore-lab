import { motion } from 'framer-motion'
import type { ArcWithLessons } from '@shared/ipc-contract'

interface Props {
  arc: ArcWithLessons
  restorationPct: number
  locked: boolean
  lockReason?: string
  onClick: () => void
}

export default function RoomTile({ arc, restorationPct, locked, lockReason, onClick }: Props): JSX.Element {
  const isOutline = arc.status === 'outline'
  const lit = !locked && !isOutline && restorationPct > 0
  const fullyRestored = restorationPct >= 100

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={locked || isOutline}
      whileHover={!locked && !isOutline ? { scale: 1.02 } : undefined}
      className={`room-power-on relative flex h-40 flex-col justify-between rounded border p-4 text-left transition-colors ${
        locked || isOutline
          ? 'border-lab-wire bg-lab-panel/40 opacity-60'
          : fullyRestored
            ? 'border-lab-phosphor/60 bg-lab-panel/90'
            : 'border-lab-phosphorDim/50 bg-lab-panel/70 hover:border-lab-phosphor'
      }`}
      style={{ boxShadow: lit ? `0 0 24px ${arc.theme.accentColor}22` : undefined }}
    >
      <div>
        <div className="text-xs uppercase tracking-widest text-lab-phosphorDim">{arc.roomName}</div>
        <div
          className={`mt-1 font-blueprint text-lg ${
            lit ? 'glow-text-phosphor text-lab-phosphor' : 'text-lab-phosphorDim'
          }`}
        >
          {arc.title}
        </div>
        <p className="mt-1 text-xs text-lab-phosphorDim">{arc.shortDescription}</p>
      </div>

      {isOutline ? (
        <div className="text-xs italic text-lab-phosphorDim/70">Coming soon</div>
      ) : locked ? (
        <div className="text-xs text-lab-alert/80">{lockReason ?? 'Locked'}</div>
      ) : (
        <div className="w-full">
          <div className="mb-1 flex w-full justify-between text-[10px] text-lab-phosphorDim">
            <span>Restoration</span>
            <span>{restorationPct}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-lab-wire">
            <div
              className="h-full rounded-full"
              style={{ width: `${restorationPct}%`, backgroundColor: arc.theme.accentColor }}
            />
          </div>
        </div>
      )}
    </motion.button>
  )
}
