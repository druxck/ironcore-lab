import { useState } from 'react'
import { INSTALL_COMMAND, type EnvironmentStatus } from '@shared/setup-types'

interface Props {
  status: EnvironmentStatus | null
  onRecheck: () => Promise<void>
}

export default function SetupWizard({ status, onRecheck }: Props): JSX.Element {
  const [rechecking, setRechecking] = useState(false)
  const [copied, setCopied] = useState(false)

  async function handleRecheck(): Promise<void> {
    setRechecking(true)
    await onRecheck()
    setRechecking(false)
  }

  async function handleCopy(): Promise<void> {
    await navigator.clipboard.writeText(INSTALL_COMMAND)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleOpenDocs(): Promise<void> {
    await window.lab.invoke('setup:openSetupDocs', undefined)
  }

  const wslMissing = !status?.wslInstalled

  return (
    <div className="blueprint-grid flex h-screen items-center justify-center bg-lab-bg p-6">
      <div className="crt-scanlines w-full max-w-2xl rounded border border-lab-wire bg-lab-panel/90 p-6">
        <h1 className="glow-text-phosphor font-blueprint text-xl text-lab-phosphor">Meridian Computing Laboratory</h1>
        <p className="mt-1 text-sm text-lab-phosphorDim">
          The lab&apos;s been dark a long time. Before anything can be restored, the workshop needs power — a real C
          toolchain running inside WSL.
        </p>

        {wslMissing ? (
          <div className="mt-5 rounded border border-lab-alert/40 bg-lab-alert/5 p-4">
            <div className="glow-text-alert text-sm font-semibold text-lab-alert">WSL / Ubuntu not detected</div>
            <p className="mt-1 text-sm text-lab-phosphorDim">
              Ironcore Lab needs WSL2 with an Ubuntu distro installed. That step needs administrator elevation and
              usually a reboot, so it isn&apos;t something the app can do for you.
            </p>
            <pre className="mt-2 overflow-x-auto rounded bg-black/40 p-2 text-xs text-lab-phosphor">
              wsl --install -d Ubuntu
            </pre>
            <p className="mt-1 text-xs text-lab-phosphorDim">
              Run that in an elevated PowerShell, reboot, then come back and click Recheck.
            </p>
          </div>
        ) : (
          <div className="mt-5">
            <div className="mb-2 text-sm font-semibold text-lab-phosphor">
              Toolchain status ({status?.distroName})
            </div>
            <ul className="grid grid-cols-2 gap-1">
              {status?.tools.map((tool) => (
                <li key={tool.tool} className="flex items-center gap-2 text-sm">
                  <span className={tool.installed ? 'text-lab-phosphor' : 'text-lab-alert'}>
                    {tool.installed ? '●' : '○'}
                  </span>
                  <span className={tool.installed ? 'text-lab-phosphorDim' : 'text-lab-alert'}>{tool.tool}</span>
                </li>
              ))}
            </ul>

            {!status?.allToolsPresent && (
              <div className="mt-4 rounded border border-lab-amber/30 bg-black/30 p-3">
                <div className="text-xs text-lab-phosphorDim">Run this once inside your Ubuntu shell:</div>
                <div className="mt-2 flex items-center gap-2">
                  <code className="flex-1 overflow-x-auto whitespace-nowrap rounded bg-black/50 p-2 text-xs text-lab-amber">
                    {INSTALL_COMMAND}
                  </code>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="shrink-0 rounded border border-lab-amber/40 px-2 py-1 text-xs text-lab-amber hover:bg-lab-amber/10"
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={handleRecheck}
            disabled={rechecking}
            className="rounded border border-lab-phosphorDim/60 px-4 py-2 text-sm text-lab-phosphor hover:bg-lab-phosphorDim/20 disabled:opacity-50"
          >
            {rechecking ? 'Rechecking…' : 'Recheck'}
          </button>
          <button
            type="button"
            onClick={handleOpenDocs}
            className="text-xs text-lab-phosphorDim underline hover:text-lab-phosphor"
          >
            Open full setup guide
          </button>
        </div>

        {status && (
          <div className="mt-3 text-xs text-lab-phosphorDim/70">
            Last checked: {new Date(status.checkedAt).toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  )
}
