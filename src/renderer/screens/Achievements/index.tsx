import { useContentStore } from '../../state/useContentStore'
import { useSaveStore } from '../../state/useSaveStore'

export default function Achievements(): JSX.Element {
  const achievements = useContentStore((s) => s.achievements)
  const save = useSaveStore((s) => s.save)

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4 p-6">
      <h1 className="glow-text-phosphor font-blueprint text-2xl text-lab-phosphor">Achievements</h1>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {achievements.map((a) => {
          const unlockedAt = save?.achievements.unlocked[a.id]
          return (
            <div
              key={a.id}
              className={`rounded border p-3 ${
                unlockedAt ? 'border-lab-amber/50 bg-lab-panel/70' : 'border-lab-wire bg-lab-panel/30 opacity-60'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">{unlockedAt ? a.icon : '🔒'}</span>
                <div>
                  <div className={unlockedAt ? 'glow-text-amber text-lab-amber' : 'text-lab-phosphorDim'}>
                    {a.title}
                  </div>
                  <div className="text-xs text-lab-phosphorDim">{a.description}</div>
                </div>
              </div>
              {unlockedAt && (
                <div className="mt-1 text-[10px] text-lab-phosphorDim/70">
                  Unlocked {new Date(unlockedAt).toLocaleDateString()}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
