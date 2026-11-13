// Run with `npm run test:pi`. Named .spec.ts because `claude plugin test .` runs every *.test.ts
// under the folder against Claude Code's harness.

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { blocksOf, drawBlock, drawPlain, hasOpenable, isOpenableBlock, noteOf, ReplyState } from './blocks.ts'

const REPLY = [
  'The cache keeps each response for 10 minutes.',
  '',
  '## How a lookup works',
  '',
  '{{A lookup reads one key.|A lookup reads one key. The key is a hash.',
  '',
  '```ts',
  'redis.get(key)',
  '```',
  '}}',
  '',
  '## When entries expire',
  '',
  '{{Entries expire after 10 minutes.|Entries expire after 10 minutes. A deploy clears them.}}',
  '',
  '**Bottom line:** The cache stores each response.',
].join('\n')

test('a reply is cut into plain runs and one block for each paragraph holding a stretch', () => {
  const blocks = blocksOf(REPLY)

  assert.deepEqual(
    blocks.map(block => block.names),
    [[], ['A lookup reads one key.'], [], ['Entries expire after 10 minutes.'], []],
  )
  assert.equal(drawBlock(blocks[0]!, false), 'The cache keeps each response for 10 minutes.\n\n## How a lookup works')
})

test('a closed block shows its short form and the opener', () => {
  assert.equal(drawBlock(blocksOf(REPLY)[3]!, false), 'Entries expire after 10 minutes. »')
})

test('an open block shows its long form and the closer', () => {
  assert.equal(drawBlock(blocksOf(REPLY)[3]!, true), 'Entries expire after 10 minutes. A deploy clears them. «')
})

test('the closer stands apart from a long form that ends in a code fence', () => {
  const open = drawBlock(blocksOf(REPLY)[1]!, true)

  assert.ok(open.endsWith('```\n\n«'), open)
})

test('an open block opens the stretches inside its long form too', () => {
  const [block] = blocksOf('{{Outer.|Outer, with {{inner|inner detail}}.}}')

  assert.equal(drawBlock(block!, true), 'Outer, with inner detail. «')
})

test('a paragraph with several stretches opens as one block', () => {
  const [block] = blocksOf('Use {{Redis|Redis 7}} with {{a TTL|a TTL of 600 seconds}}.')

  assert.deepEqual(block!.names, ['Redis', 'a TTL'])
  assert.equal(drawBlock(block!, false), 'Use Redis » with a TTL ».')
  assert.equal(drawBlock(block!, true), 'Use Redis 7 « with a TTL of 600 seconds «.')
})

test('braces with no long form are text, and open nothing', () => {
  const [block] = blocksOf('Render {{name}} here.')

  assert.equal(isOpenableBlock(block!), false)
  assert.equal(hasOpenable('Render {{name}} here.'), false)
  assert.equal(drawBlock(block!, false), 'Render name here.')
})

test('braces in code open nothing', () => {
  assert.equal(hasOpenable('Write `{{a|b}}` in the reply.'), false)
  assert.equal(hasOpenable('```\n{{a|b}}\n```'), false)
})

test('a streaming reply shows the short form written so far and hides the long form', () => {
  assert.equal(drawPlain('Intro.\n\n{{A lookup re', false), 'Intro.\n\nA lookup re')
  assert.equal(drawPlain('Intro.\n\n{{A lookup.|A lookup. The key', false), 'Intro.\n\nA lookup.')
})

test('a finished reply with nothing to click is drawn open', () => {
  assert.equal(drawPlain('{{Short.|Short. And long.}}', true), 'Short. And long.')
})

test('a reply remembers what the reader opened after it is closed again', () => {
  const state = new ReplyState(REPLY)
  state.toggle(1)
  state.toggle(1)

  assert.equal(state.isOpen(1), false)
  assert.deepEqual(state.opened(), ['A lookup reads one key.'])
  assert.deepEqual(state.unopened(), ['Entries expire after 10 minutes.'])
})

test('opening everything opens only the blocks that hold a stretch', () => {
  const state = new ReplyState(REPLY)
  state.setAll(true)

  assert.equal(state.isAllOpen(), true)
  assert.deepEqual([0, 1, 2, 3, 4].map(index => state.isOpen(index)), [false, true, false, true, false])
  assert.deepEqual(state.unopened(), [])
})

test('the note names what was opened and what was not', () => {
  assert.equal(
    noteOf(['A'], ['B', 'C']),
    'Stretchtext: since your last reply the reader opened "A". They did not open "B", "C".',
  )
  assert.equal(noteOf(['A'], []), 'Stretchtext: since your last reply the reader opened "A".')
  assert.match(noteOf([], ['B']) ?? '', /opened no stretch/)
  assert.equal(noteOf([], []), undefined)
})
