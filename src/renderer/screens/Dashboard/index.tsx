import ProgressMeter from '../../components/ProgressMeter'
import { useContentStore } from '../../state/useContentStore'
import { useSaveStore } from '../../state/useSaveStore'

export default function Dashboard(): JSX.Element {
  const save = useSaveStore((s) => s.save)
  const arcs = useContentStore((s) => s.arcs)
  const achievements = useContentStore((s) => s.achievements)

  if (!save) return <div className="p-6 text-lab-phosphorDim">Loading dashboard…</div>

  const authoredArcs = arcs.filter((a) => a.status === 'authored')
  const totalLessons = authoredArcs.reduce((sum, a) => sum + a.lessons.length, 0)
  const unlockedAchievements = Object.keys(save.achievements.unlocked).length

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
      <div>
        <h1 className="glow-text-phosphor font-blueprint text-2xl text-lab-phosphor">Engineer&apos;s Dashboard</h1>
        <p className="text-sm text-lab-phosphorDim">Since {new Date(save.profile.createdAt).toLocaleDateString()}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Rank" value={save.profile.rank} />
        <StatCard label="Total XP" value={save.xp.total.toLocaleString()} />
        <StatCard label="Lessons restored" value={`${save.progress.lessonsCompleted.length} / ${totalLessons}`} />
        <StatCard label="Achievements" value={`${unlockedAchievements} / ${achievements.length}`} />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-lab-phosphorDim">Room restoration</h2>
        <div className="flex flex-col gap-3">
          {authoredArcs.map((arc) => (
            <ProgressMeter
              key={arc.id}
              label={arc.title}
              pct={save.progress.arcRestorationPct[arc.id] ?? 0}
              accentColor={arc.theme.accentColor}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="rounded border border-lab-wire bg-lab-panel/50 p-3">
      <div className="text-[10px] uppercase tracking-wide text-lab-phosphorDim">{label}</div>
      <div className="glow-text-phosphor mt-1 font-blueprint text-lg text-lab-phosphor">{value}</div>
    </div>
  )
}
