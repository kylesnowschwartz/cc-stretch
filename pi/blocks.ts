// A reply cut into the blocks pi draws: runs of plain markdown, and paragraphs that hold a stretch.
// A paragraph holding a stretch opens and closes as one block, so a click needs no position inside
// wrapped text. Under the bottom-line-stretch style each section is one such paragraph.

import { closeAfter, isOpenable, isRule, openingFence, paragraphsOf, parse, type Segment } from '../hooks/parse.ts'

export type Block = {
  segments: Segment[]
  /** The short form of each stretch a click opens, as a note to the model names it. */
  names: string[]
  /** The header a section stands under, drawn and clicked as part of the block. */
  header?: Header
}

type Header = { hashes: string; title: string }

/**
 * The mark on each side of a closed short form, and on each side of an open long form. A section
 * under a header has its first mark before the header's title instead.
 */
export const OPENER = '»'
export const CLOSER = '«'

export function blocksOf(reply: string): Block[] {
  const blocks: Block[] = []
  for (const { text } of paragraphsOf(reply)) {
    const block = blockOf(text)
    const above = blocks.at(-1)
    const split = isSection(block) && above !== undefined && !isOpenableBlock(above) ? splitHeader(drawBlock(above, false)) : undefined
    if (split !== undefined) {
      blocks.pop()
      if (split.rest !== '') blocks.push(blockOf(split.rest))
      block.header = split.header
    }
    blocks.push(block)
  }

  return blocks
}

function blockOf(text: string): Block {
  const segments = parse(text)
  const names = segments.flatMap(part => (typeof part !== 'string' && isOpenable(part) ? [part.short.trim()] : []))

  return { segments, names }
}

/** Whether `block` is one stretch and nothing else: a section under the bottom-line-stretch style. */
function isSection(block: Block): boolean {
  return block.names.length === 1 && block.segments.every(part => typeof part !== 'string' || part.trim() === '')
}

const HEADER = /^ {0,3}(#{1,6})[ \t]+(\S.*)$/

/** `text` cut into the header that is its last paragraph and the text before it, if it ends in one. */
function splitHeader(text: string): { header: Header; rest: string } | undefined {
  const cut = text.lastIndexOf(GAP)
  const [, hashes, title] = HEADER.exec(cut < 0 ? text : text.slice(cut + GAP.length)) ?? []
  if (hashes === undefined || title === undefined) return undefined

  return { header: { hashes, title }, rest: cut < 0 ? '' : text.slice(0, cut) }
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
  const { header } = block
  const body = block.segments
    .map(part => {
      if (typeof part === 'string') return part
      if (!isOpenable(part)) return part.short
      const text = isOpen ? closeAfter(written(part.long ?? []), CLOSER, GAP) : `${part.short} ${OPENER}`

      return header === undefined ? markBefore(text, isOpen ? CLOSER : OPENER) : text
    })
    .join('')
  if (header === undefined) return body

  return `${header.hashes} ${isOpen ? CLOSER : OPENER} ${header.title}${GAP}${body}`
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
