import { AnimatePresence, motion } from 'framer-motion'
import { useToastStore } from '../../state/useToastStore'

const ICON: Record<string, string> = {
  xp: '⚡',
  achievement: '🏅',
  lesson: '🔧',
  info: 'ℹ'
}

export default function ToastStack(): JSX.Element {
  const toasts = useToastStore((s) => s.toasts)
  const dismiss = useToastStore((s) => s.dismiss)

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-80 flex-col gap-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            className="pointer-events-auto rounded border border-lab-phosphorDim/60 bg-lab-panel/95 p-3 shadow-lg"
            onClick={() => dismiss(toast.id)}
          >
            <div className="flex items-start gap-2">
              <span className="text-lg leading-none">{ICON[toast.kind] ?? 'ℹ'}</span>
              <div>
                <div className="glow-text-phosphor text-sm font-semibold text-lab-phosphor">{toast.title}</div>
                {toast.detail && <div className="mt-0.5 text-xs text-lab-phosphorDim">{toast.detail}</div>}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
