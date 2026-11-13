import assert from 'node:assert/strict'
import { test } from 'node:test'
import { type Entry, newestReplies, NOTE, REPLY, unreportedReplies } from './session.ts'

const prompt = (id: string): Entry => ({ type: 'message', id, message: { role: 'user' } })
const answer = (id: string): Entry => ({ type: 'message', id, message: { role: 'assistant' } })
const reply = (id: string): Entry => ({ type: 'custom', id, customType: REPLY, data: { text: id } })
const note = (id: string): Entry => ({ type: 'custom_message', id, customType: NOTE })
const ids = (entries: Entry[]) => entries.map(entry => entry.id)

test('the replies since the last prompt are unreported', () => {
  assert.deepEqual(ids(unreportedReplies([prompt('p1'), answer('a1'), reply('r1'), reply('r2')])), ['r1', 'r2'])
})

test('they are still found once pi has appended the prompt that starts the run', () => {
  assert.deepEqual(ids(unreportedReplies([prompt('p1'), reply('r1'), prompt('p2')])), ['r1'])
})

test('a note reports every reply before it, wherever pi appends the prompt', () => {
  assert.deepEqual(unreportedReplies([prompt('p1'), reply('r1'), prompt('p2'), note('n1'), answer('a2')]), [])
  assert.deepEqual(unreportedReplies([prompt('p1'), reply('r1'), note('n1'), prompt('p2'), answer('a2'), prompt('p3')]), [])
})

test('a reply after a note is unreported', () => {
  const branch = [prompt('p1'), reply('r1'), prompt('p2'), note('n1'), reply('r2'), prompt('p3')]

  assert.deepEqual(ids(unreportedReplies(branch)), ['r2'])
})

test('a reply two prompts back is not reported late', () => {
  assert.deepEqual(unreportedReplies([prompt('p1'), reply('r1'), prompt('p2'), answer('a2'), prompt('p3')]), [])
})

test('a session with no stretch reply has none to report', () => {
  assert.deepEqual(unreportedReplies([]), [])
  assert.deepEqual(unreportedReplies([prompt('p1'), answer('a1')]), [])
})

test('the newest replies are those of the last turn that has any', () => {
  const branch = [prompt('p1'), reply('r1'), prompt('p2'), reply('r2'), reply('r3'), prompt('p3'), answer('a3')]

  assert.deepEqual(ids(newestReplies(branch)), ['r2', 'r3'])
  assert.deepEqual(newestReplies([prompt('p1')]), [])
})

test('an entry of another extension is not a reply', () => {
  assert.deepEqual(newestReplies([{ type: 'custom', id: 'x', customType: 'other', data: { text: 't' } }]), [])
  assert.deepEqual(newestReplies([{ type: 'custom', id: 'x', customType: REPLY }]), [])
})
