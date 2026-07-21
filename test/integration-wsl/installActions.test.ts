import { describe, expect, it } from 'vitest'
import type { ToolchainInstallProgressEvent } from '@shared/setup-types'
import { runToolchainInstall } from '../../src/main/setup/installActions'

/**
 * Exercises the real toolchain-install path against WSL Ubuntu - same reason
 * as compilePipeline.test.ts: this crosses the wsl.exe Windows->Linux
 * interop boundary and past bugs here only ever surfaced against a real
 * toolchain (see docs/setup-manual.md history). Run manually with
 * `npm run test:wsl`; excluded from CI, which has no WSL.
 */
describe('runToolchainInstall (real WSL)', () => {
  it('installs as root with no password prompt and reports real progress through to done', async () => {
    const events: ToolchainInstallProgressEvent[] = []

    const result = await new Promise<{ launched: boolean; error?: string }>((resolve) => {
      const launch = runToolchainInstall((evt) => {
        events.push(evt)
        if (evt.phase === 'done' || evt.phase === 'error') resolve(launch)
      })
      if (!launch.launched) resolve(launch)
    })

    expect(result.launched).toBe(true)
    expect(result.error).toBeUndefined()

    const final = events.at(-1)
    expect(final?.phase).toBe('done')
    expect(final?.percent).toBe(100)

    // Percent should never regress across the whole run.
    const percents = events.map((e) => e.percent)
    for (let i = 1; i < percents.length; i++) {
      expect(percents[i]).toBeGreaterThanOrEqual(percents[i - 1])
    }

    expect(events.some((e) => e.phase === 'updating')).toBe(true)
    expect(events.some((e) => e.phase === 'installing')).toBe(true)
  }, 120_000)
})
