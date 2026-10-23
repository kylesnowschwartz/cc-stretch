import { atom, read, update } from 'claude-code'
import type { EngineInterface } from 'claude-code'

/** How Claude Code names an output style this plugin ships in `output-styles/`: `cc-stretch:<file name>`. */
export const STYLE_PREFIX = 'cc-stretch:'

const activeStyle = atom({ plugin: 'cc-stretch', key: 'styleName' } as const, null)

/** The name of the cc-stretch output style as last resolved this session; null for another style or none. */
export function styleNow($: EngineInterface): Promise<string | null> {
  return read($, activeStyle)
}

/**
 * Reads the active output style from the merged settings, keeps its name in plugin state for drawing
 * when it is a cc-stretch style, and returns it; null for another style or none. A settings read
 * that fails counts as no style.
 */
export async function resolveStyle($: EngineInterface): Promise<string | null> {
  const id = await $.settings.read({ key: 'outputStyle' }).catch(() => undefined)
  const style = typeof id === 'string' && id.startsWith(STYLE_PREFIX) ? id : null
  await update($, activeStyle, () => style)
  return style
}
