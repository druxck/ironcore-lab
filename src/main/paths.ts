import { app } from 'electron'
import { join } from 'path'

/** Root of the app source tree (where content/ and resources/ live), both in dev and packaged. */
export function getAppRoot(): string {
  return app.getAppPath()
}

export function getContentRoot(): string {
  return join(getAppRoot(), 'content')
}

export function getResourcesRoot(): string {
  return join(getAppRoot(), 'resources')
}

export function getUserDataDir(): string {
  return app.getPath('userData')
}
