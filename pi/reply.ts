// How pi draws a reply holding stretches: plain markdown between blocks that open and close on a click.

import { getMarkdownTheme } from '@earendil-works/pi-coding-agent'
import { type Component, Container, Markdown, MouseRegion, Spacer, type TuiMouseEvent } from '@earendil-works/pi-tui'
import { drawBlock, isOpenableBlock, type ReplyState } from './blocks.ts'

/** The same left padding as pi's own assistant text. */
const PADDING_X = 1

export function replyComponent(state: ReplyState): Component {
  const container = new Container()
  state.blocks.forEach((block, index) => {
    if (index > 0) container.addChild(new Spacer(1))
    container.addChild(
      isOpenableBlock(block)
        ? new StretchBlock(state, index)
        : new Markdown(drawBlock(block, false), PADDING_X, 0, getMarkdownTheme()),
    )
  })

  return container
}

/** One block holding a stretch. A click anywhere on it opens it, or closes it. */
class StretchBlock implements Component {
  private readonly markdown = new Markdown('', PADDING_X, 0, getMarkdownTheme())
  private readonly region: MouseRegion
  private isDrawnOpen: boolean | undefined

  constructor(
    private readonly state: ReplyState,
    private readonly index: number,
  ) {
    this.region = new MouseRegion(this.markdown, event => {
      // Only a click: a press or a drag is left to pi, which selects text with it.
      if (event.type !== 'click' || event.button !== 'left') return undefined
      this.state.toggle(this.index)

      return { handled: true, render: true }
    })
  }

  // The state can change without a click, from the /stretch command, so it is read on every draw.
  render(width: number): string[] {
    const isOpen = this.state.isOpen(this.index)
    if (isOpen !== this.isDrawnOpen) {
      const block = this.state.blocks[this.index]
      if (block !== undefined) this.markdown.setText(drawBlock(block, isOpen))
      this.isDrawnOpen = isOpen
    }

    return this.region.render(width)
  }

  handleMouse(event: TuiMouseEvent) {
    return this.region.handleMouse(event)
  }

  invalidate(): void {
    this.region.invalidate()
  }
}
