// A reply cut into the blocks pi draws: runs of plain markdown, and paragraphs that hold a stretch.
// A paragraph holding a stretch opens and closes as one block, so a click needs no position inside
// wrapped text. Under the bottom-line-stretch style each section is one such paragraph.

import { closeAfter, isOpenable, isRule, openingFence, paragraphsOf, parse, type Segment } from '../hooks/parse.ts'

export type Block = {
  segments: Segment[]
  /** The short form of each stretch a click opens, as a note to the model names it. */
  names: string[]
}

/** The mark on each side of a closed short form, and on each side of an open long form. */
export const OPENER = '»'
export const CLOSER = '«'

export function blocksOf(reply: string): Block[] {
  return paragraphsOf(reply).map(({ text }) => {
    const segments = parse(text)
    const names = segments.flatMap(part => (typeof part !== 'string' && isOpenable(part) ? [part.short.trim()] : []))

    return { segments, names }
  })
}

export function isOpenableBlock(block: Block): boolean {
  return block.names.length > 0
}

/** Whether `reply` holds a stretch the reader can open. */
export function hasOpenable(reply: string): boolean {
  return reply.includes('{{') && blocksOf(reply).some(isOpenableBlock)
}

/** The markdown of a block with its stretches closed, or open down to the innermost. */
export function drawBlock(block: Block, isOpen: boolean): string {
  return block.segments
    .map(part => {
      if (typeof part === 'string') return part
      if (!isOpenable(part)) return part.short
      return isOpen
        ? markBefore(closeAfter(written(part.long ?? []), CLOSER, GAP), CLOSER)
        : `${markBefore(part.short, OPENER)} ${OPENER}`
    })
    .join('')
}

const GAP = '\n\n'

/** A heading, a list item, a quote or a table row: a line that reads as text with a mark before it. */
const BLOCK_START = /^ {0,3}(?:#{1,6}(?:\s|$)|[-*+]\s|\d{1,9}[.)]\s|>|\|)/

/**
 * `text` with `mark` before it, after a space, or on a line of its own when `text` starts with a
 * line a mark before it would change.
 */
function markBefore(text: string, mark: string): string {
  const start = text.replace(/^\s*\n/, '')
  const first = start.slice(0, (start + '\n').indexOf('\n'))
  const startsInBlock = BLOCK_START.test(first) || isRule(first) || openingFence(first) !== undefined

  return startsInBlock ? `${mark}${GAP}${start}` : `${mark} ${text}`
}

/**
 * A reply as markdown with no stretch markup. Closed, each stretch shows its short form; a stretch
 * still streaming shows the short form written so far. Open, each shows all of its long form.
 */
export function drawPlain(reply: string, isOpen: boolean): string {
  const draw = (segments: Segment[]): string =>
    segments.map(part => (typeof part === 'string' ? part : isOpen && part.long ? draw(part.long) : part.short)).join('')

  return draw(parse(reply))
}

function written(segments: Segment[]): string {
  return segments.map(part => (typeof part === 'string' ? part : part.long ? written(part.long) : part.short)).join('')
}

/**
 * What the model is told about the stretches of its last reply: which the reader opened and which
 * they did not. Undefined when the reply held none.
 */
export function noteOf(opened: string[], unopened: string[]): string | undefined {
  const quote = (names: string[]) => names.map(name => `"${name}"`).join(', ')
  if (opened.length > 0) {
    const rest = unopened.length > 0 ? ` They did not open ${quote(unopened)}.` : ''

    return `Stretchtext: since your last reply the reader opened ${quote(opened)}.${rest}`
  }
  if (unopened.length > 0) {
    return 'Stretchtext: the reader opened no stretch of your last reply. They may have read only the short forms.'
  }

  return undefined
}

/** Which blocks of one reply stand open, and which the reader has opened at any time. */
export class ReplyState {
  readonly blocks: Block[]
  private readonly open = new Set<number>()
  private readonly seen = new Set<number>()

  constructor(reply: string) {
    this.blocks = blocksOf(reply)
  }

  isOpen(index: number): boolean {
    return this.open.has(index)
  }

  toggle(index: number): void {
    this.set(index, !this.open.has(index))
  }

  setAll(isOpen: boolean): void {
    this.blocks.forEach((block, index) => {
      if (isOpenableBlock(block)) this.set(index, isOpen)
    })
  }

  /** Whether every block that can open stands open. */
  isAllOpen(): boolean {
    return this.blocks.every((block, index) => !isOpenableBlock(block) || this.open.has(index))
  }

  /** The stretches the reader opened at any time, closed again or not, by name. */
  opened(): string[] {
    return this.blocks.flatMap((block, index) => (this.seen.has(index) ? block.names : []))
  }

  unopened(): string[] {
    return this.blocks.flatMap((block, index) => (this.seen.has(index) ? [] : block.names))
  }

  private set(index: number, isOpen: boolean): void {
    if (!isOpen) {
      this.open.delete(index)
      return
    }
    this.open.add(index)
    this.seen.add(index)
  }
}
