// Which entries of a pi session are replies holding stretches, and which of them the model has been
// told about. The session is the only record: nothing here is kept between calls.

/** The entry that draws a reply holding stretches. Its data is `ReplyData`. */
export const REPLY = 'stretch-reply'
/** The hidden message that tells the model which stretches the reader opened. */
export const NOTE = 'stretch-note'

export type ReplyData = { text: string }

/** As much of a pi session entry as is read here. */
export type Entry = {
  type: string
  id: string
  customType?: string
  message?: { role: string }
  data?: unknown
}

export type ReplyEntry = Entry & { data: ReplyData }

export function isReply(entry: Entry): entry is ReplyEntry {
  return entry.type === 'custom' && entry.customType === REPLY && typeof (entry.data as ReplyData | undefined)?.text === 'string'
}

const isPrompt = (entry: Entry) => entry.type === 'message' && entry.message?.role === 'user'
const isNote = (entry: Entry) => entry.type === 'custom_message' && entry.customType === NOTE

/**
 * The stretch replies written after each prompt of `branch`, oldest prompt first. A note reports
 * every reply before it, so those are left out.
 */
function unreportedByTurn(branch: Entry[]): ReplyEntry[][] {
  const turns: ReplyEntry[][] = [[]]
  for (const entry of branch) {
    if (isPrompt(entry)) turns.push([])
    else if (isNote(entry)) for (const turn of turns) turn.length = 0
    else if (isReply(entry)) turns.at(-1)?.push(entry)
  }

  return turns
}

/**
 * The stretch replies the model has not been told about, read as a prompt starts a run. Pi appends
 * the prompt before or after `before_agent_start` runs, so the replies stand in the last turn or in
 * the one before it.
 */
export function unreportedReplies(branch: Entry[]): ReplyEntry[] {
  const turns = unreportedByTurn(branch)
  const last = turns.at(-1) ?? []

  return last.length > 0 ? last : (turns.at(-2) ?? [])
}

/** The stretch replies of the newest turn that has any, reported or not. */
export function newestReplies(branch: Entry[]): ReplyEntry[] {
  const turns = unreportedByTurn(branch.filter(entry => !isNote(entry)))

  return turns.findLast(turn => turn.length > 0) ?? []
}
