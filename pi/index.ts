// cc-stretch for pi. A reply's `{{short|long}}` stretches are drawn closed, and a paragraph holding
// one opens in place on a click, or with /stretch. The model's own reply is not changed: pi draws it
// through the markdown transformer, and a session entry the model never sees draws the clickable copy.

import type { ExtensionAPI, ExtensionContext } from '@earendil-works/pi-coding-agent'
import { drawPlain, hasOpenable, noteOf, ReplyState } from './blocks.ts'
import { replyComponent } from './reply.ts'
import { type Entry, isReply, newestReplies, NOTE, REPLY, type ReplyData, type ReplyEntry, unreportedReplies } from './session.ts'

const ACTIONS = ['open', 'close']

export default function (pi: ExtensionAPI) {
  /** What stands open in each reply, by the id of the entry that draws it. Lost when pi restarts. */
  const states = new Map<string, ReplyState>()
  /**
   * The text of each reply an entry draws, so the transformer leaves that reply's own text blank.
   * Trimmed, because pi trims a reply's text before it reaches the transformer.
   */
  const drawnByEntry = new Set<string>()
  const markDrawn = (reply: string) => drawnByEntry.add(reply.trim())

  const stateOf = (entry: ReplyEntry): ReplyState => {
    const known = states.get(entry.id)
    if (known !== undefined) return known
    const state = new ReplyState(entry.data.text)
    states.set(entry.id, state)

    return state
  }

  const branchOf = (ctx: ExtensionContext) => ctx.sessionManager.getBranch() as Entry[]

  pi.registerMarkdownTransformer(
    (markdown, { isStreaming }) => {
      if (!markdown.includes('{{')) return markdown
      if (isStreaming) return drawPlain(markdown, false)

      // A finished reply no entry draws has nothing to click, so every stretch is drawn open.
      return drawnByEntry.has(markdown.trim()) ? '' : drawPlain(markdown, true)
    },
    { messageTypes: ['assistant'] },
  )

  pi.registerEntryRenderer<ReplyData>(REPLY, entry => (isReply(entry) ? replyComponent(stateOf(entry)) : undefined))

  pi.on('session_start', (_event, ctx) => {
    states.clear()
    drawnByEntry.clear()
    for (const entry of ctx.sessionManager.getEntries() as Entry[]) if (isReply(entry)) markDrawn(entry.data.text)
  })

  pi.on('message_end', (event, ctx) => {
    // Only the terminal UI draws entries; elsewhere the reply is left as the model wrote it.
    if (ctx.mode !== 'tui' || event.message.role !== 'assistant') return
    for (const part of event.message.content) {
      if (part.type !== 'text' || !hasOpenable(part.text)) continue
      markDrawn(part.text)
      pi.appendEntry<ReplyData>(REPLY, { text: part.text })
    }
  })

  pi.on('before_agent_start', (event, ctx) => {
    if (event.messageType !== 'user') return
    const replies = unreportedReplies(branchOf(ctx)).map(stateOf)
    const note = noteOf(
      replies.flatMap(reply => reply.opened()),
      replies.flatMap(reply => reply.unopened()),
    )
    if (note === undefined) return

    return { message: { customType: NOTE, content: note, display: false } }
  })

  pi.registerCommand('stretch', {
    description: 'Open or close every stretch of the newest reply: /stretch [open|close]',
    // Null once an action is typed in full: pi's Enter then runs the command, not the completion.
    getArgumentCompletions: prefix => {
      const typed = prefix.trim()
      const matches = ACTIONS.filter(action => action.startsWith(typed) && action !== typed)

      return matches.length > 0 ? matches.map(action => ({ value: action, label: action })) : null
    },
    handler: async (args, ctx) => {
      const action = args.trim()
      if (action !== '' && !ACTIONS.includes(action)) {
        ctx.ui.notify('Usage: /stretch [open|close]', 'error')
        return
      }
      const replies = newestReplies(branchOf(ctx)).map(stateOf)
      if (replies.length === 0) {
        ctx.ui.notify('No reply in this session has a stretch to open.', 'info')
        return
      }
      // With no action named, open everything unless everything is already open.
      const isOpening = action === '' ? !replies.every(reply => reply.isAllOpen()) : action === 'open'
      for (const reply of replies) reply.setAll(isOpening)
      ctx.ui.notify(isOpening ? 'Opened every stretch of the newest reply.' : 'Closed every stretch of the newest reply.', 'info')
    },
  })
}
