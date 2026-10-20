# Backlog

Lanes awaiting triage. Verdicts: architect | direct | drop | defer | pending.
Checkbox marks a lane consumed (plan written, or direct commit landed).

## Lanes

- [ ] **plugin-folder** — an install copies the plugin, not the repo's dev tools · verdict: direct · waits on: the uncommitted changes to `bench/replay.ts` and `bench/labels.ts` landing or being dropped
- [ ] **renderers-use-drawn-as** — every renderer draws a stretch the way `drawnAs` says · verdict: direct
- [ ] **keyboard-item-words** — the list rule finds the reply item by the words a reply uses for it · verdict: direct
- [ ] **judge-controls** — a grading run whose judge misgrades a known answer is refused · verdict: direct
- [ ] **bench-one-copy** — each prompt, flag list and scoring rule in the bench exists once · verdict: defer · promote when: the README's numbers are next rerun
- [ ] **letters-with-ime** — letters work with an input method on, or the README says to switch it off · verdict: pending · needs: a live session with a Chinese or Japanese input method
- [ ] **bench-outside-git** — the bench runs from a source archive · verdict: defer · signal: `Command failed: git rev-parse HEAD` · promote when: someone runs the bench from an archive
- [ ] **replay-counts-recomputed** — published replay counts follow the current measurement · verdict: defer · signal: none · promote when: a change to what the skim counts
- [ ] **nested-key-separator** — no two stretches in a reply share a key · verdict: defer · signal: none · promote when: a stretch opens a different one, or opens in its holder's colour
- [ ] **old-replies-live** — on Claude Code 2.1.300, a reply from before a style save keeps its stretches · verdict: pending · needs: a live session on Claude Code 2.1.299 or 2.1.300
- [ ] **theme-read** — stretch colours follow the theme the screen shows · verdict: defer · signal: none · promote when: a reader on a light screen reports dark highlights
- [ ] **tinted-256** — the four tinted highlights stay four colours on a 256-colour terminal · verdict: defer · signal: none · promote when: a reader reports two tinted stretches in one colour
- [ ] **tinted-neighbours** — stretches side by side on screen differ in tinted colour · verdict: pending · needs: a design call on whether neighbours on screen must differ
- [ ] **open-colour-gap** — opened words are in their colour from their first frame · verdict: defer · signal: none · promote when: the gap shows in a recorded take
- [ ] **wrap-across-styles** — a style change inside a word is never a place to break a row · verdict: direct · signal: a row that starts with `.` after a link, or a pressed word that moves a row on the first frame of opening · promote when: now; it breaks the promise that words on screen stay where they are
- [ ] **refusal-as-answer** — a call the safety filter stopped counts as a failed call, never as an answer · verdict: direct · signal: an `ok` row whose text says it was "stopped by a safety classifier"
- [ ] **lead-in-bold-sentence** — a bold sentence ends the words before a lone period, as a plain one does · verdict: direct
- [ ] **nested-note-names** — the note names a lone period inside an opened long form by its words, not "." · verdict: direct
- [ ] **dead-letter** — a stretch with nothing on screen to press takes no keyboard letter · verdict: direct
- [ ] **growth-finishes** — a stretch still growing goes on growing when the reader opens or closes another · verdict: defer · signal: none · promote when: the jump shows in a recorded take, a reader reports it, or the growth code next changes
- [ ] **posts-hold-opens** — the note names every stretch the reader opened, however close together two presses land · verdict: pending · needs: how far apart a click's press and release reach the terminal, a trackpad tap included
- [ ] **desktop-lead-in** — in the desktop app, the words before a lone period open its stretch too · verdict: pending · needs: a look at the desktop app: what a drag or double-click that starts on link text does, and what `[](…)` draws
- [ ] **nested-lead-in** — a lone period inside an opened long form has words to click · verdict: defer · signal: none · promote when: a reader reports a one-cell period in an opened detail
- [ ] **reading-note-test** — a bench task shows whether Claude says again what the reader left closed, once the note tells it · verdict: defer · signal: none · promote when: a guide change touches the reading-note paragraph, or the note's wording changes
- [ ] **fresh-held-out** — an adoption is decided on tasks no guide variant was shaped on · verdict: defer · signal: none · promote when: a variant is about to be adopted on task results read while shaping it
- [ ] **unreported-outcomes** — a long form never states an outcome its evidence does not give · verdict: direct
- [ ] **post-pass-stretcher** — a hook turns Claude's finished plain reply into stretchtext · verdict: pending · needs: a live check that a `turn.step` rewrite is shown and recorded
- [ ] **opened-from-doc** — `openedFrom`'s comment in `bench/measure.ts` describes the note as 0.5.2 writes it · verdict: defer · promote when: the next change to `bench/measure.ts`

## plugin-folder

As of Claude Code 2.1.302, an install from GitHub copies every tracked file, because
`.claude-plugin/marketplace.json` gives the plugin as `"source": "./"`, and it runs `npm install` on
the dev `package.json`. A fresh install measured 48 MB: `node_modules` 45 MB (typescript and
playwright), `docs/` 1.8 MB, then `bench/`, `film/` and `tests/`. The plugin itself (`hooks/`,
`types/`, `.claude-plugin/`) is about 110 KB.

Move the plugin's manifest, `hooks/` and `types/` into a folder of their own and point the
marketplace at it. Tests, bench and film import `../hooks`, and `bench/ab.ts` hashes
`hooks/parse.ts` by path into each run's manifest (`ASKING_CODE`), so make the move when no bench
run needs to resume.

## renderers-use-drawn-as

`compose` in `hooks/reply.tsx`, and `linkedMarkdown` and `writeOpen` in `hooks/register.tsx`, each
decide on their own whether a stretch is drawn as text, open or a link. `drawnAs` in
`hooks/parse.ts` says it once, and `hooks/layout.ts` and the bench use it. `writeOpen` does not
check `isClosed`, so where every stretch is drawn open, an unclosed `{{a|b` shows `b`; everywhere
else it shows `a`. Derive all three from `drawnAs` and extend the parity test in
`tests/drawn.test.tsx` to the desktop path. PR #12, merged in a65fbb8, changed both files; the three
functions are still there after it.

## keyboard-item-words

`KEYBOARD_ITEMS` in `bench/tasks.ts` knows the reply item only as `client`, `click` or `in-reply`.
The `keyboard-rewrite` task's own reply calls it "The reply itself.", so an answer that keeps that
item as a stretch of its own breaks `items-stay-visible`. Seen in the bench run comparing the 0.3.7
and 0.4.0 guides, 0.4.0 guide, repeat 1, where an override records it. Add `reply itself` to that
item's words. A run frozen on the old task then refuses to resume.

## judge-controls

A grade counts today when the judge's answer parses, so a judge that says yes to everything, or
reads "never" backwards, passes every check. Add control answers with a known grade to each run
(one that leaves out a must-know point, one that makes a forbidden claim), and refuse a run's
grades when the judge gets a control wrong.

## bench-one-copy

- `recall` and the rewrite prompt are in both `bench/ab.ts` and `bench/replay.ts`.
- The code that turns verdicts into scores is in both `bench/report.ts` and `bench/coverage.ts`.
- `bench/replay.ts` spells out the `claude -p` flags that `claudeArgs` in `bench/grading.ts` builds.
- A `bench/labels.ts` left uncommitted in a checkout is superseded by `bench/ab.ts`, and its
  `marked` is a different function from the one in `bench/measure.ts`. Delete it rather than commit
  it.

`replay.ts`, `report.ts` and `coverage.ts` feed the README's numbers, so change them when those
numbers are rerun, and the numbers change once.

## letters-with-ime

Not checked: while an input method composes, a letter key may stay in the composition, so only
committed text such as 啊 reaches `prompt.edit`. That matches no letter, so it would be typed and
the letters would go away. If a live check shows this, the README's letters paragraph says to
switch the input method off first.

## bench-outside-git

- Problem: `bench/ab.ts` runs `git rev-parse HEAD` to record the revision in a run's manifest, and
  throws outside a git checkout.
- Failure sequence: on a `git archive` of v0.3.7, `bun bench/stub/check.ts` failed three cases with
  `fatal: not a git repository`; a clone of the same tag passed.
- Signal: `Command failed: git rev-parse HEAD` in the run's output.
- Promote when: someone reports running the bench from an archive, or the bench is documented for
  use outside a clone.
- Fix shape: a resumed run does not compare the revision, so record it as unknown when git fails.

## replay-counts-recomputed

- Problem: `bench/out/replay.jsonl` stores the skim and full word counts taken at replay time, and
  `bench/report.ts` publishes them as stored. A change to how `bench/measure.ts` or
  `hooks/parse.ts` counts the skim leaves the published numbers as they were.
- Failure sequence: ec6a1b2 began counting a short form over several lines as drawn open, and
  `bench/results.md` kept project B at 19% until b0585db recomputed the rows by hand (21%).
- Signal: none. Nothing compares the stored counts with what `bench/measure.ts` gives today.
- Promote when: the next change to `bench/measure.ts` or `hooks/parse.ts` that changes what the
  skim counts. Neither file changed between b0585db and ec1b1d7.
- Fix shape: `bench/report.ts` recomputes skim and full from each row's saved text with
  `bench/measure.ts`; rows without text (the native rows) keep their stored counts.

## nested-key-separator

- Problem: a stretch's key joins its short form to its parents' with ` › ` (`KEY_SEPARATOR` in
  `hooks/parse.ts`), so a short form that itself holds ` › ` can take the key of a nested stretch.
- Failure sequence: `{{a › b|x}} {{a|{{b|y}}}}` keys as `a › b`, `a`, `a › b` (checked at
  ec1b1d7). The open list and the keyboard letters address stretches by key, so they cannot tell
  the first stretch from the nested one.
- The colour an opened stretch takes has the same cause. The open order finds a stretch's holder with
  `parentOf(opened.key)` in `hooks/register.tsx`. In `{{p|x {{q › r|y}}}}` the nested key is
  `p › q › r`, whose holder reads as `p › q`, a key no stretch has, so the nested stretch is not kept
  off p's colour. The tinted highlight passes the holder down the parse and is not affected.
- Signal: none. Nothing reports two stretches with one key.
- Promote when: someone reports a stretch that opens a different one, or keys change for another
  reason.
- Fix shape: join keys with a character a short form cannot hold, such as a noncharacter. That
  changes every nested stretch's key, so open lists saved before it read nested stretches as closed
  once. The open order can take a stretch's holder from the parse, as `placesOf` does.

## old-replies-live

Claude Code 2.1.299 and 2.1.300 hand the AssistantMessage site a reply as the streaming filter left
it, with its long forms gone. `rawOf` in `hooks/register.tsx` finds the markup again: a reply the
plugin did not keep, such as one from before a style save reloaded the plugin, is found by reading
the session's messages once per load. Only the plugin test engine covers this; 0.5.0's live checks
ran on 2.1.302. Acceptance: on 2.1.300, a reply drawn before `/cc-stretch:style` and a save still
shows its stretches after the save.

## theme-read

- Problem: `isLight` in `hooks/register.tsx` reads the `theme` row from `$.config.list` and takes
  any value that does not start with `light` as dark. As of Claude Code 2.1.302 the row holds the
  setting, so `auto` reads as `auto`, not as the theme it resolves to.
- Failure sequence: theme `auto` on a light screen, a `custom:<name>` theme, a theme row another
  plugin hides, or a list that fails. Under tinted, closed stretches sit on the dark palette's
  near-black highlights (`#403002`, `#2c2240`, `#122623`, `#361e16`), readable with light text but
  not the pale ones meant for a light screen. Opened words take the dark palette's colours on white,
  at 1.3–1.9:1 contrast, as they did before 0.5.0.
- The read runs on every draw of a reply that is tinted or has an open stretch. A theme change is
  not one of the render hook's triggers, so a reply keeps its palette until it redraws for another
  reason, and two replies can show two palettes. The read's cost per draw is unmeasured.
- Signal: none.
- Promote when: a reader on a light screen reports dark highlights.
- Fix shape: classify the value explicitly (`light*`, `dark*`, and a stated choice for `auto`,
  `custom:*` and no row), with tests for a light row, an `auto` row and a failed list. Whether the
  read can leave the draw depends on Claude Code telling a plugin the theme changed; unchecked.

## tinted-256

- Problem: the tinted highlights are 24-bit colours. A terminal that shows 256 colours draws each as
  the nearest of its own.
- Failure sequence: by ansi-styles' 256-colour formula, on dark places 0 and 3 (`#403002`,
  `#361e16`) both become index 58, and on light places 0 and 2 both become 188. The first and fourth
  stretch on dark, or the first and third on light, then share a highlight. Computed, not seen on a
  256-colour terminal.
- Signal: none.
- Promote when: a reader reports two tinted stretches in one colour.
- Fix shape: choose the highlight mixes so the four land on four different 256-colour indexes on
  each theme, and test that with the same formula.

## tinted-neighbours

Under tinted, `placesOf` in `hooks/register.tsx` counts places in reading order, depth first, so
stretches hidden inside a closed one use up colours. In `A {{a|x {{b|1}} {{c|2}} {{d|3}}}} and
{{e|4}}.` a takes place 0 and e place 4, so the two closed stretches on screen share a colour. In
`{{p|p {{a|a {{a1|x}} {{a2|y}}}} {{b|b1}}}}` a takes 1 and b 5: the skip past p's colour lands on a's,
so the two siblings in p's open text match. Counting this way gives each stretch one colour before
and after it opens; making neighbours on screen differ is weighed against that.

## open-colour-gap

- Problem: the words a stretch adds take their colour from `tints`, which holds only stretches already
  in the open order. The hooks write that after the reply's Client posts the press, so until the
  next draw the growing words are drawn with no colour, in every style. Older than 0.5.0.
- Signal: none. The tests wait 2000 ms before reading colours, so they do not see it, and the gap is
  untimed.
- Promote when: the gap shows in a recorded take, or a reader reports it.
- Fix shape: under tinted the colour is known before the press, so the Client can be given each
  stretch's word colours along with its highlight.

## wrap-across-styles

- Problem: `wrap` in `hooks/layout.ts` finds break points in each styled run on its own
  (`for (const run of runs) for (const text of run.text.split(/( +)/).flatMap(breakables))`), and
  `inline` starts a run at every style change, so a link, code span, URL or bold run that ends inside
  a word can split it. `NO_START`, the rule that closing punctuation never starts a row, works only
  inside one run, so the 0.3.5 changelog's "punctuation such as ， or 。 … never starts a row" fails at
  a style change. The `Run.link` comment and the guards in `leadInsOf` that skip marking words
  "because it would add a break" work around this.
- Failure sequence: at 20 columns `It merged 3 days ago{{.|…}}` draws its `.` alone on the next row,
  as 0.5.1 did; at 15, `**12**ms` splits into `12` and `ms`; at 10, `一二三四**五**。` starts a row
  with `。`. While a stretch grows, `grow` draws its short form as plain text, so the style change
  goes and the pressed word can move a row on the first frame: at 18 columns `Then run the tests` /
  `.` becomes `Then run the` / `tests.`. Over the 3,572 saved paragraphs at every width from 40 to
  120: 1,826 breaks inside a word (0.62% of layouts), 1,296 of them putting closing punctuation at a
  row's start, and the first frame of opening moved rows in 47 of 33,306 checks.
- Signal: none live; a kit test of the four cases above fails on 1de5f05.
- Fix shape: find break points in the line's whole text, then split each piece back across the runs
  it covers; a word wider than a row still breaks at its style changes, so `(https://…)` is not cut
  mid-URL. A prototype of this (68 lines in, 23 out) passed all 198 tests and the four cases above,
  changed rows only in layouts that had a break inside a word, moved no row on a first frame, and
  took a layout from 61 µs to about 68 µs. Once it lands, the `leadInsOf` guards can be tried
  without, to give more lone periods words to press.

## refusal-as-answer

- Problem: as of Claude Code 2.1.304, when the safety filter stops a reply, Claude Code tries once
  more with a note saying so, and the model's answer to that note ("My previous response to this was
  stopped by a safety classifier, so I can't …") comes back as a normal result. `resultOf` in
  `bench/grading.ts` accepts it and the run writes `status: "ok"`, though `bench/README.md` says a
  failed call never counts as a grade. A resume reuses the text instead of trying again.
- Failure sequence: counted on 2026-10-20, 12 such `ok` rows in the rewrites of a label-slot corpus
  run and 1 in the answers of a drafting run, that one graded with every `know` point "no".
  On the corpus path the recall bar drops them as broken rewrites, not failed calls. In the
  label-slot baseline the refused replies were the long ones (median 724 words, against 404–471 for
  the rest), so that run's sample leans short.
- Signal: an `ok` row whose text holds "stopped by a safety classifier".
- Fix shape: in `claude()` in `bench/ab.ts`, which is not part of a run's hashed asking code, throw
  when the result's events show a refusal stop, or, if they show none, when an `ok` text holds that
  sentence; add a refusing case to `bench/stub/claude` and `bench/stub/check.ts`. Then delete the
  refusal rows and resume, asking first in a folder another session is running.

## lead-in-bold-sentence

`leadInOf` in `hooks/layout.ts` takes a bold phrase whole only when no sentence ends inside it, but
its check, `pieces.slice(start, k)`, leaves out the bold's last piece. So in
`**Fix main's e2e first.** It unblocks #218{{.|…}}` both sentences open the stretch, where
`I changed a.ts. The tests pass{{.|…}}` gives only the second. 1 of 3,572 saved paragraphs has
it. Fix shape: stop at a bold phrase that ends a sentence once words after it are taken; pin
`**Done.** The tests pass` to `The tests pass` and `**Done.**` alone to `**Done.**`.

## nested-note-names

`namesOf` in `hooks/layout.ts` names a link inside a link's long form by its bare short form, so
when the reader opens the outer stretch and then a lone period inside it, the note to Claude still
quotes `"."`, and the 0.5.2 changelog's "Before, every period link was called "."" does not hold
there. 9 of the 90 lone-period links in saved paragraphs sit inside a long form, in 6 paragraphs.
Fix shape: walk every long form that is drawn at all (`drawnAs(part) !== 'text'`) instead of the
`stretches(…)` loop, and test that a nested `{{.|…}}` is named by the sentence before it. A stretch
opened before an in-session upgrade then reads as unopened once.

## dead-letter

A stretch whose short form is empty, with no words before it (at a paragraph's start, or right
after another stretch), draws nothing to press. `lettersFor` in `hooks/register.tsx` still gives it
a letter, since `targetsIn` looks only at `drawnAs`: the letter is drawn nowhere, the next stretch
takes the one after it, and typing the unseen one is swallowed. The test "a stretch with an empty
short form and no words before it draws no link and opens from no letter" in
`tests/cc-stretch.test.tsx` pins the swallowed key, so the fix changes that test on purpose. Rare:
the saved replies hold 2 such stretches. Fix shape: leave out of `lettersFor` a target whose name
from `namesOf` is empty.

## growth-finishes

- Problem: `hooks/reply.tsx` keeps one growth per paragraph (`State.growth`), and opening or closing
  another stretch replaces it, so a stretch still growing shows the rest of its long form and its «
  in one frame. The single growth dates from the first commit. Since 0.5.2 a click on lead-in words
  opens about 0.5 s after the press, so two quick clicks on two such sentences overlap more often.
- Failure sequence: in the test kit on 0.5.1 and 0.5.2, a 32-word long form 13 words in after
  320 ms showed all 32 words one frame after a press on another short form. After two quick clicks on
  lead-in words in 0.5.2, the first went from 20 to 27 words in one frame; opened alone, it never adds
  more than 2.
- Signal: none; no recorded take shows it yet.
- Fix shape: a growth per key, each advanced on the tick and dropped when its stretch or one holding
  it closes. A stretch still shrinking can stay closed at once, as now.

## posts-hold-opens

- Problem: as of Claude Code 2.1.304 a Client's post waits for a 16 ms timer, and a later post from
  the same Client replaces one still waiting (read in the 2.1.304 binary; the API types written by
  2.1.302 describe the same). `hooks/reply.tsx` posts the open list, which survives being replaced,
  with `opened`, the one stretch just opened, which does not. When two opens in one paragraph post
  within one flush, `seen` misses the first, so the note says the reader did not open it, and it gets
  no colour count.
- Failure sequence: in 0.5.2 a press after a click on lead-in words opens their stretch as the button
  goes down, and a short form opens as it comes up; when that press and release land in one flush,
  the first open is lost. A harness keeping only the last post per flush gave
  `opened "The fix is one line.". They did not open "It merged 3 days ago."` with both drawn open.
  The test kit delivers every post, so it cannot show this.
- Signal: none live.
- Fix shape: the Client posts state only, the name and source of each stretch in its open list; the
  `ui.message` hook takes as just opened each key the stored list lacks.

## desktop-lead-in

As of 0.5.2 the desktop app draws a closed stretch with no words of its own as `[.](…/open/N)`, and
an empty short form as `[](…/open/N)`, which by CommonMark draws nothing. `linkedMarkdown` in
`hooks/register.tsx` never calls `withLeadIns`; only `compose` in `hooks/reply.tsx` does, though the
note already names such a stretch by its lead-in words on both surfaces. A scratch copy that turned
lead-in words into `[words](…/open/N)` passed all 198 tests. Not checked: what the desktop app does
with a drag or double-click that starts on link text; the terminal waits out a double-click to keep
selection working. Lone periods are 6 of 1,478 stretches in saved real-session replies.

## nested-lead-in

`compose` draws an opened long form with `grow`, which finds the short form's words in it word by
word; a lead-in mark there would break that match, so a lone period inside an opened long form draws
as one cell, as before 0.5.2: 9 of 90 lone-period links in saved paragraphs, 1 of them from a real
session. Fix shape: give `grow` the lead-in spans and put the link marks around their visible words,
or mark them only once growth ends. Either touches the code where 0.5.2's growth bug was, so rerun
the corpus and fuzz checks that release used.

## reading-note-test

Every bench task is one `claude -p` call, so nothing checks that Claude acts on the guide's last
paragraph: "Do not assume they read a long form they did not open; if it matters to what they asked,
say it again." The tests check
the note's text, never Claude's reply to it. Fix shape: a task with an earlier turn, its reply, what
was opened, and a follow-up that needs a closed detail, with the note built by `hooks/register.tsx`'s
code rather than retyped; arms `g0` and `g0` without that paragraph. It touches the hashed
`bench/grading.ts`, so older run folders refuse to resume. About 36 writer and 108 judge calls.

## fresh-held-out

The four `heldOut` tasks in `bench/tasks.ts` were read while `shortened-growth`,
`shortened-growth-words` and `shortened-growth-last-words` were shaped, as the criterion written for
each of those runs says, and the report splits only the layout-rule table by `heldOut`. Fix shape: write
four to six tasks before looking at any candidate's answers, keep them in a `--tasks` file run in
their own folder once, at the adoption decision; adding them to `TASKS` would make every 24-task run
folder refuse to resume.

## unreported-outcomes

`unreported-check` in `bench/tasks.ts` gives a check that ran with no result reported, and forbids
"The CLI smoke run passed." In saved runs (Opus 5.5 writing, Sonnet 5.5 judging, Claude Code
2.1.302) the judge found that claim in 8 of 9 `g0` replies, 7 of 12 under the shortened guides and
0 of 3 under `draft-in-thinking`; no other task drew a forbidden claim. One task, found after the
fact: a lead. Fix shape: four to six tasks where a check ran and its result is not given, two held
out, the pass test written first; arms `g0`, `draft-in-thinking`, and one line saying what to write
where the evidence is silent.

## post-pass-stretcher

Per the plugin API types written by Claude Code 2.1.302, a `turn.step` hook may rewrite a reply's
text chunks, and what leaves it is both shown and recorded; it could hold the reply until the step
ends, ask `$.model.complete` to add stretches with the guide as its system prompt, and yield that, at
the cost of streaming and one more call per reply. Saved rewrites of plain replies under the shipped
guide still hide sections behind links (14 links, 4 of them labels), and gave lone-period links at
about the in-flow rate, so seeing the whole reply first is not by itself a fix. Not checked live.

## opened-from-doc

`openedFrom`'s comment in `bench/measure.ts` describes the note's names as they were before 0.5.2,
when a lone period was named `"."`; `bench/opened.ts` maps 0.5.2's names back. The file is part of a
run's hashed asking code, so the comment changes with the next change made there for another reason.
