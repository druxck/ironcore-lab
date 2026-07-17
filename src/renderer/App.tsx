import { useEffect, useState } from 'react'
import type { EnvironmentStatus } from '@shared/setup-types'
import SetupWizard from './screens/SetupWizard'
import LabMap from './screens/LabMap'
import LessonView from './screens/LessonView'
import Dashboard from './screens/Dashboard'
import Achievements from './screens/Achievements'
import ToastStack from './components/Toast'
import { useContentStore } from './state/useContentStore'
import { useSaveStore } from './state/useSaveStore'

type View =
  | { kind: 'map' }
  | { kind: 'lesson'; lessonId: string }
  | { kind: 'dashboard' }
  | { kind: 'achievements' }

export default function App(): JSX.Element {
  const [envStatus, setEnvStatus] = useState<EnvironmentStatus | null>(null)
  const [checkingEnv, setCheckingEnv] = useState(true)
  const [view, setView] = useState<View>({ kind: 'map' })

  const loadContent = useContentStore((s) => s.loadAll)
  const contentLoaded = useContentStore((s) => s.loaded)
  const loadSave = useSaveStore((s) => s.load)
  const saveLoaded = useSaveStore((s) => s.loaded)

  useEffect(() => {
    void refreshEnv()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function refreshEnv(): Promise<void> {
    setCheckingEnv(true)
    const status = await window.lab.invoke('setup:getEnvironmentStatus', undefined)
    setEnvStatus(status)
    setCheckingEnv(false)
    if (status.allToolsPresent) {
      await Promise.all([loadContent(), loadSave()])
    }
  }

  if (checkingEnv) {
    return (
      <div className="flex h-screen items-center justify-center bg-lab-bg">
        <div className="crt-flicker glow-text-phosphor text-lab-phosphor">Powering on the lab…</div>
      </div>
    )
  }

  if (!envStatus?.allToolsPresent) {
    return (
      <>
        <SetupWizard status={envStatus} onRecheck={refreshEnv} />
        <ToastStack />
      </>
    )
  }

  if (!contentLoaded || !saveLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-lab-bg">
        <div className="glow-text-phosphor text-lab-phosphor">Loading the archive…</div>
      </div>
    )
  }

  return (
    <div className="crt-scanlines flex h-screen flex-col bg-lab-bg">
      <TopNav view={view} setView={setView} />
      <div className="flex-1 overflow-auto">
        {view.kind === 'map' && <LabMap onOpenLesson={(lessonId) => setView({ kind: 'lesson', lessonId })} />}
        {view.kind === 'lesson' && (
          <LessonView lessonId={view.lessonId} onBackToMap={() => setView({ kind: 'map' })} />
        )}
        {view.kind === 'dashboard' && <Dashboard />}
        {view.kind === 'achievements' && <Achievements />}
      </div>
      <ToastStack />
    </div>
  )
}

function TopNav({ view, setView }: { view: View; setView: (v: View) => void }): JSX.Element {
  const save = useSaveStore((s) => s.save)
  const tabs: Array<{ kind: 'map' | 'dashboard' | 'achievements'; label: string }> = [
    { kind: 'map', label: 'Lab Map' },
    { kind: 'dashboard', label: 'Dashboard' },
    { kind: 'achievements', label: 'Achievements' }
  ]

  return (
    <header className="flex items-center justify-between border-b border-lab-wire bg-lab-panel/60 px-4 py-2">
      <div className="glow-text-phosphor font-blueprint text-sm tracking-widest text-lab-phosphor">
        IRONCORE LAB <span className="text-lab-phosphorDim">— Meridian Computing Laboratory</span>
      </div>
      <nav className="flex gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.kind}
            type="button"
            onClick={() => setView({ kind: tab.kind })}
            className={`rounded px-3 py-1 text-xs uppercase tracking-wide transition-colors ${
              view.kind === tab.kind
                ? 'glow-text-phosphor bg-lab-phosphorDim/30 text-lab-phosphor'
                : 'text-lab-phosphorDim hover:text-lab-phosphor'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      <div className="glow-text-amber text-xs text-lab-amber">
        {save ? `${save.profile.rank} · ${save.xp.total} XP` : ''}
      </div>
    </header>
  )
}
