import { atom, read, update } from 'claude-code'
import type { EngineInterface } from 'claude-code'

/** How Claude Code names an output style this plugin ships in `output-styles/`: `cc-stretch:<file name>`. */
export const STYLE_PREFIX = 'cc-stretch:'
const OPENING = '<!-- stretch:reminder -->'
const CLOSING = '<!-- /stretch:reminder -->'

/** A cc-stretch output style the session runs under, and the stretch rules its marker block holds. */
export type StretchStyle = { name: string; rules: string | null }

const activeStyle = atom({ plugin: 'cc-stretch', key: 'style' } as const, null)
const warned = atom({ plugin: 'cc-stretch', key: 'warned' } as const, false)

/**
 * The text between the lines `<!-- stretch:reminder -->` and `<!-- /stretch:reminder -->`, trimmed;
 * null when either line is missing or nothing stands between them.
 */
export function rulesOf(text: string): string | null {
  const lines = text.split(/\r?\n/)
  const start = lines.findIndex(line => line.trim() === OPENING)
  const end = lines.findIndex((line, i) => i > start && line.trim() === CLOSING)
  if (start === -1 || end === -1) return null
  const rules = lines.slice(start + 1, end).join('\n').trim()
  return rules === '' ? null : rules
}

/** The cc-stretch style as last resolved this session; null for another style or none. */
export function styleNow($: EngineInterface): Promise<StretchStyle | null> {
  return read($, activeStyle)
}

/**
 * Reads the active output style from the merged settings and, for a cc-stretch one, the rules in its
 * file, keeps both in plugin state for drawing, and returns them. A cc-stretch style with no rules
 * is told to the person in one transcript line, once a session; as of Claude Code 2.1.309 the line
 * is drawn after the plugin's name. A settings read that fails counts as no style.
 */
export async function resolveStyle($: EngineInterface): Promise<StretchStyle | null> {
  const id = await $.settings.read({ key: 'outputStyle' }).catch(() => undefined)
  const style = typeof id === 'string' && id.startsWith(STYLE_PREFIX) ? await styleOf($, id) : null
  await update($, activeStyle, () => style)
  if (style !== null && style.rules === null && !(await read($, warned))) {
    await update($, warned, () => true)
    $.ui.log(`the output style ${style.name} has no ${OPENING} block in output-styles/${style.name.slice(STYLE_PREFIX.length)}.md, so Claude gets no stretch rules.`)
  }
  return style
}

async function styleOf($: EngineInterface, name: string): Promise<StretchStyle> {
  const text = await $.fs.read(`${$.plugin.root}/output-styles/${name.slice(STYLE_PREFIX.length)}.md`).catch(() => '')
  return { name, rules: rulesOf(text) }
}
