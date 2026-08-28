# Fan-out Simulation Brief (Simulation 04)

Implementation brief for the fourth simulation in the Projects section. Read
[`docs/ui-simulation-concept.md`](ui-simulation-concept.md) first: this document assumes
the format rules defined there and only records what is specific to this one.

This is the first simulation on the site that shows a **backend mechanism** rather than a
product screen. Two columns: a phone on the left for the action, a dark console on
the right for what the system did with it.

---

## 0. What the owner confirmed

The architecture, as described by the person who built it. Everything on the page has to
be true to this table.

| # | Question | Answer |
| --- | --- | --- |
| A1 | The write path | A post is written, a `feed` record is created from it, Kafka Connect captures the change and publishes it, and a consumer expands the follower list into one distribution record per follower. |
| A2 | What `feed` is for | One record per post, holding the content and the counters. It is the only copy that changes, so a reaction costs one write rather than one per follower. |
| A3 | Distribution record shape | `{ owner, postId, userId }` in `user_feed`, ordered on a `rank` field. It carries no content. |
| A4 | Batch size | **500 records per write.** Real. |
| A5 | Message key | `ownerId:postId`, so every event for one post lands in the same partition and stays in order. |
| A6 | Idempotency | Unique on `postId + userId`. There was retry, no dead letter queue. |
| A7 | Reactions | Stored in their own collection and processed by the consumer, which increments the counter on `feed` among other background work. |
| A8 | Delete | Publishes an event to Kafka; the consumer removes the `feed` record and every related distribution record. |
| A9 | Celebrity accounts | No special handling at the time. |
| A10 | Read path | Query `user_feed` by `userId` ordered by `rank`, then look up `feed` by `postId`. No cache was confirmed, so none is drawn. |
| A11 | The product name | **Hahalolo.** Discontinued, and the owner authorised using it. No logo, no wordmark, no real user data. |
| A12 | Collections | `feed` and `user_feed`. |

---

## 1. Decisions on record

### The one that shaped everything

| # | Decision | Why |
| --- | --- | --- |
| D1 | **The board is high level: four nodes and a follower grid.** | An earlier build drew the real topology: nine nodes, three partitions, three consumer instances, a produced-versus-captured distinction, an inspector with the record shapes. It was accurate and almost nobody would read it. The audience for this page is a hiring manager who has thirty seconds and may not know what a partition is. The line on the resume says one post reaches every follower through Kafka; the board has to say exactly that and stop. |

Everything below follows from D1.

| # | Decision | Why |
| --- | --- | --- |
| D2 | Four nodes: `post`, `feed`, `Kafka`, `fan-out consumer` | The smallest set that still names the technology and still shows the idea. Dropping Kafka would hide the stack; adding partitions would hide the point. |
| D2a | The board **relayouts rather than shrinks**: the chain runs left to right on desktop and top to bottom below `lg`, with the followers spread underneath in both | A graph scaled down to phone width is a graph nobody can read. The first attempt kept the desktop arrangement and let the pane scroll, which was worse than either: a pipeline you have to scroll through is one you cannot watch, and the whole point is seeing one end reach the other. |
| D3 | **The board starts empty.** Every node, the follower grid included, is put there by the run and taken away by the delete | An earlier version left Kafka and the consumer sitting on the board at rest, on the reasoning that infrastructure has no lifetime. In practice it meant the visitor met a half-drawn diagram before they had done anything, which invites reading instead of pressing. An empty board has exactly one thing to do. |
| D4 | The board is **dark**, the phone stays light | The contrast is the argument: light is what a user sees, dark is what actually happened. The site already flips surfaces this way once, in the Meeting simulation's lobby and call. |
| D5 | Glow is **restrained**: one accent, thin strokes, a soft halo | Heavy neon is the house style of machine-generated diagrams, and the rest of this site is austere. Idle nodes stay genuinely dark, because a board where everything glows says nothing about what is happening right now. |
| D6 | **No second account and no reactions.** One person, one post, one pipeline | An earlier version let the visitor switch to a follower's phone and like the post, so the like could be seen looping back into `feed` while the distribution records sat untouched. It made the point well and cost an account switch, two counters, a reaction path and a loop edge. Against a reader who has half a minute, that is a bad trade, and the same point survives as one clause in the caption on `feed`. |
| D15 | The `feed` node carries **like and comment counters** that climb once the fan-out has landed | D6 cut reactions because they cost an account switch, an interaction, a loop edge and two counters, for a point the caption already made. Two of those four costs were the expensive ones and they stay cut: nothing here is clickable and no second account exists. What is left is the cheap half — two numbers on one node, moving on their own — and it is the only thing on the board that shows the Outcome line rather than asserting it: engagement rewrites the one `feed` record while the distribution records underneath it sit untouched. A new caption, `p6`, says so in a sentence while the numbers move. |
| D16 | Each step lasts **as long as its note takes to read**, not a fixed number | The chain was paced by motion: 320ms for a step, 680ms for one with an edge. That is right for the animation and far too fast for the sentence under it — a 147-character note had 680ms. Step length is now `max(motion, readMs(note))`, with `readMs` derived from the rendered text length so a locale that needs more words gets more time. A note is only paid for when it changes: the delete's four `d1` steps are four moves and one reading. A full publish runs 14.0s against 5s before, a delete 8.7s against 4s. |
| D17 | A **note stepper** appears once a run has fully settled, and moves nothing but the note | Slowing the chain down helps the first read; it does not help the visitor who looked away. Two arrows on the right of the caption strip — nothing else — walk the notes the run actually passed. It re-runs nothing: the board keeps the state the run left it in, the counters keep counting, and the only thing that changes is which sentence is showing. Re-watching is still Delete then Publish, or a reload — which is the honest signal that the animation is a one-shot, not a scrubber. |
| D18 | The stepper waits for the **last** note, not the last step | The fan-out step ends about a second before the engagement note lands. Revealing the stepper when the chain finished put it on screen while its own contents were still about to grow — measured at 2.0s of a stepper whose range changed underneath the reader. A `capsSettled` flag, set where the last note is written rather than where the chain ends, closes that window. A position counter was tried here and dropped with it: two arrows and their disabled states say enough, and on a 320px phone the counter cost the caption a third of its measure. |
| D7 | Delete **travels the chain first**, then removes backwards: follower records, then `feed`, then `post` | The removal order is the owner's, and it is right: nothing should be left pointing at something that is already gone. The traversal was added later, because a delete that skipped straight to the removals hid the fact that it is an event going through the same pipeline. It is the same animation as a publish in the warning accent, which is exactly what it is: each node it reaches keeps a red border, so the run leaves a trail. |
| D7a | The first node relabels itself to **David deleted the post** while the delete runs | Without it the board shows the same four nodes doing something red, and the reader has to work out what changed. One line of text answers it. |
| D8 | The 1,200 followers are **thirty dots**, lit in three waves | The waves are the batches. Writing 1,200 DOM nodes to prove 1,200 writes would be the slowest possible way to demonstrate an efficiency argument. |
| D9 | One caption line under the board, changing per step | Replaces the inspector panel from the earlier build. A sentence at a time is what a reader can absorb while watching something move. |
| D10 | The account is **David** | An invented handle, clearly not a real person. |
| D11 | No partition chips, no consumer instances, no record shapes, no read-path board | All true, all cut under D1. They live in this document instead, which is where the conversation goes if an interviewer asks. |
| D12 | The phone frame has **no bezel, no notch, no home indicator** | House rule from the concept document, and the same frame Haloki uses. |
| D13 | The phone is **not a card on a backdrop**: it is the left half of the frame, full height, white against the board's dark, and its header lines up with the board's | The earlier version floated a rounded phone on a grey panel inside a bordered frame, which is three nested containers to say one thing. The colour change is the only divider the split needs, and matching the two header heights makes the two halves read as one row rather than two panels that nearly line up. **Superseded by D14.** |
| D14 | The phone and the console are **two columns**, not two halves of one frame: phone left in its own Haloki-shaped frame, console above `simAside` on the right | Consistency across the four simulations was worth more than the single-frame conceit. D13's objection — three nested containers — is still respected: the phone is now one container, the console another, and neither sits on a backdrop. The split-frame version also carried a mobile `App` / `System` tab bar that only existed because the two panes shared a frame; as separate columns they simply stack, which is what the other three simulations already do and one fewer control to discover. |

### Documented simplifications

Things the page shows less precisely than reality, on purpose.

1. **Kafka Connect is folded into the `Kafka` node.** The capture step is real and is
   named in the role block; on the board it would be a fifth node that most readers
   would skip.
2. **Reactions are not on the board at all.** They are real (A7) and the caption on
   `feed` carries what they prove, which is that one record changes rather than one per
   follower.
3. **The read path is not drawn.** It is what the write amplification buys (A10), and it
   is stated in the Outcome row rather than shown. If it is ever drawn, it gets no cache,
   because none was confirmed: an invented Redis node would be the single most damaging
   thing on this page, since a reader who asks about it deserves a true answer.

---

## 2. Why this simulation exists

The resume line is one sentence:

> Implemented the core fan-out-on-write mechanism for the social news feed, distributing
> newly created posts to followers across the web and mobile platforms.

A reader who knows the term nods and learns nothing. A reader who does not know it learns
nothing either. What neither reader gets is the design decision, which is the part worth
hiring for:

**One post produces one mutable `feed` record and N pointers that carry no content.** So
five hundred likes update **one** record, not N. And a timeline is one indexed read
rather than a query that has to touch everyone the reader follows.

That trade, write amplification once in exchange for a cheap read forever, is what the
simulation has to make visible. Everything in the frame serves it.

---

## 3. The loop

> **Publish → Fan out → Delete**

1. David's post is already in the composer. The visitor presses Publish.
2. `post` appears. Then `feed`, made from it. Then Kafka, then the consumer, each
   arriving as the event reaches it, and finally the followers, as the fan-out sprays
   into them in three waves while the counter climbs to 1,200.
3. A beat after the last batch lands, the like and comment counters on `feed` climb.
   Nothing else on the board moves, which is the point: the distribution records are
   never rewritten for a like.
4. The last note has landed, so the two stepper arrows appear at the right of the
   caption. The visitor can walk back through the notes at their own pace; nothing on the
   board moves while they do.
5. The visitor deletes the post. The first node relabels itself, and a red run travels
   the same chain the post did. Only then does anything go: the follower records drain
   and their grid with them, then `feed`, then `post`, and the board is empty again
   exactly as it opened.

Nothing runs before step 1, and nothing is on the board before step 1 either.

---

## 4. Layout

The same two-column shape as Haloki, for the same reason: a phone is narrow where a
browser mock is wide, so the column beside it has to carry something.

| Zone | Size | Contents |
| --- | --- | --- |
| Left | `minmax(0,360px)`, `max-w-[390px]` | The phone. Status bar, 48px app header, composer, then the published post. |
| Right, top | remainder, `flex-1` | The console: board title, the board, one caption line under it. |
| Right, bottom | remainder | `simAside`. |

`grid gap-x-8 gap-y-6 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]`. The rows stretch and
the console is `flex-1`, so the console absorbs the slack and the two columns end level —
measured 0px apart at 1440px, 1280px and 1024px.

**The phone is the Haloki frame.** Same 640px shell, same `rounded-[20px]`, same status
bar — the strip is a `simPhoneStatus` mixin in `_sim_shared.pug` with one copy for both
simulations. Per D12 there is still no bezel, no notch and no home indicator.

**From `lg`** the chain runs left to right with the followers spread across the full width
underneath, so the fan-out has the whole board to open into:

```
 [post] ─▶ [feed] ─▶ [Kafka] ─▶ [fan-out consumer]
                    ╱     │     ╲
        ● ● ● ● ● ● ● ● ● ● ● ● ● ● ●
        ● ● ● ● ● ● ● ● ● ● ● ● ● ● ●
```

**Below `lg`** the two columns stack — phone, console, role block — and the chain stands
up vertically with the followers still underneath it. The console takes a fixed `520px`
there, since a flex column with no definite height cannot give it one. No tab bar: the
panes are separate columns now, so both are simply on the page.

**What the console gave up, and what it got back.** It was 604px tall as half of a
full-width frame; in the right column above the role block it is 361–380px, and the board
inside it 215–234px. The first cut of that left only 14px between the chain and the
follower grid, because `align-content: space-evenly` split the slack three ways with the
board's own edges — edges that already have the board's 18px inset for air. Switching to
`space-between` and dropping `.f-nodes`' own `padding-top` gives the whole remainder to
the one gap that carries meaning: **30–50px** now, with ~20px above and below from the
inset. The range is the two locales — the console is `phone − aside − 16`, and the
English role block runs 19px taller than the Vietnamese one, which comes straight out of
the board. Both locales still end level with the phone at 0px.

**The caption strip carries the stepper.** `.f-caption` is now text on the left and
`.f-capnav` — two 24px arrow buttons — on the right. The nav is hidden while
`data-running="1"`, until the run's last note has landed, and whenever the trail holds
fewer than two notes, so it is never on screen competing with the note it exists to
re-read. At 320px it takes 54px and leaves the caption 186px.

Neither arrangement is written down twice. The nodes move because of one grid definition
per breakpoint, and every edge works out for itself which sides to leave and arrive on
from where the two nodes actually ended up. The fan only lights for a fan-out or a delete.

---

## 5. Hard rules

- **No network, no backend, no worker.** Every stage is a local timer over fixed data.
- **No invented infrastructure.** Every node is something the owner confirmed.
- **No invented metrics presented as fact.** 500 per batch is real. 1,200 followers is a
  demo figure, and the grid says thirty dots stand for the whole list. The role block
  asserts no counts at all.
- **No real user data and no logo.**
- **No auto-play.** The board is inert until the visitor acts.
- **Reduced motion drops the travelling dots**, not the information: nodes and edges
  change state instantly and counters land on their final values.
- **`IntersectionObserver` gates every timer**, and a run pauses off-screen and resumes
  where it stopped.

---

## 6. Real versus staged

**Real:** Publish and Delete are real state transitions. The composer text is the text
that appears on the published post. The counter grows in three batch steps and drains to
zero. Every edge is computed from the nodes' measured positions.

**Staged:** the pacing — a real fan-out of 1,200 rows finishes faster than a person can
perceive, and the pacing here is set by how long its notes take to read; the thirty dots; and the like and comment totals on `feed`, which
are two fixed numbers in `data/simulations.json` counted up over about five seconds.
They are a demonstration of where engagement lands, not a measurement of anything.

**Cut:** any lag or throughput number, any failure or retry control, and every node
nobody confirmed.

---

## 7. How it is built

**Nodes are HTML in a CSS grid. Edges are SVG paths computed from the nodes' measured
positions at runtime. Dots follow those same paths with `offset-path`.**

Edges stop at the border of the node they arrive at, including the box holding the
followers. An earlier version had the fan reach in among the dots, which was busier
without saying anything more.

No coordinate appears in the markup or the stylesheet, and no edge is told which side of a
node to use: a node sitting under another is joined vertically, a node beside it
horizontally, decided per draw from the measured boxes. That is what lets the desktop and
mobile arrangements be two grid definitions rather than two copies of everything. A
`ResizeObserver` recomputes the paths when the frame changes size. No images, no
diagramming library.

Each flow is a list of steps. A step either takes a fixed beat and hands over, or marks
itself `async` and calls `advance()` when its own animation finishes, which is how the
batch waves and the drain fit into the same engine as everything else.

### Three bugs the build turned up

Worth recording, because none was visible until specifically tested.

1. **The simulation was dead whenever `IntersectionObserver` never reported.** `visible`
   started `false` and only the observer could set it true, so a browser without the API,
   or a tab the observer never reports on, left the board frozen after the first step.
   `visible` now starts `true` and the observer corrects it.
2. **Below `lg`, edges drawn while the board was hidden were lost.** The board cannot be
   measured while the phone tab is showing, so the paths did not exist yet and the lit
   state was applied to nothing. Which edges are showing is now held apart from the DOM
   and reapplied every time the board is drawn.
3. **The last delete step showed no caption at all.** `deleteFlow`'s final step sets
   `data-cap="d4"` and `caps.d4` existed in both locales, but `d4` was missing from the
   caption loop in the template and from the display rules in `input.css`, so the one
   line explaining that the post itself is gone rendered as an empty strip. The rules
   also carried an `r1` selector with no string behind it, now removed.

---

## 8. Attribution block

Standard `simAside`, four rows, all true, no counts.

| Field | Value |
| --- | --- |
| Role | Implemented the fan-out-on-write mechanism for the news feed: the Kafka consumer that expands one feed record into a distribution record per follower, the batched writes, the idempotency key, and the delete path |
| Stack | Java, Spring, Apache Kafka, Kafka Connect, MongoDB |
| Scale | Every new post is expanded into one distribution record per follower and written in batches, serving the feed on web and mobile clients |
| Outcome | A timeline is one indexed read per user, and a post's like count is one record to update rather than one per follower |

The role block is the only place the parts cut from the board under D1 are still claimed,
and every clause of it is true to section 0.

---

## 9. Files

| File | Change |
| --- | --- |
| `docs/fanout-simulation-brief.md` | This document |
| `docs/ui-simulation-concept.md` | Backend-only guidance amended, ceiling raised to four |
| `data/simulations.json` | `fanout` key: follower count, batch size, waves, dot count, timings |
| `locales/en.json`, `locales/vi.json` | `sims.fanout` subtree, mirrored |
| `layout/parts/_sim_fanout.pug` | Phone, console, caption |
| `layout/parts/_sim_shared.pug` | `simPhoneStatus` mixin, shared with Haloki |
| `layout/parts/_projects.pug` | One `include` |
| `assets/tailwind/input.css` | Section 04 |
| `assets/js/simulations.js` | Self-contained `initFanout`, one line in the dispatcher |

No existing simulation's behaviour changes.

---

## 10. Verification

The browser pane used during the build reported `document.visibilityState` as `hidden`,
which freezes page timers, so the timed path could not be exercised by clicking and
waiting. Two substitutes were used, and both are worth reaching for again:

- **The reduced-motion path**, which runs the whole state machine synchronously. Publish,
  delete and republish were driven in one pass and every attribute, counter and node class
  checked at each step.
- **A stubbed clock** injected before the controller loads, replacing `setTimeout` and
  `setInterval` with a queue that can be stepped by hand. This confirmed the real timings:
  the nodes arrive in order, the counter reaches 1,200 in three waves at roughly 5
  seconds, and the delete removes the follower records and their grid, then `feed`, then
  `post`, in that order.

Checklist for any future change:

1. Board at rest: nothing on it at all, idle caption.
2. Publish lights the chain in order and the counter reaches exactly 1,200 in three waves.
3. Each node appears as the run reaches it, the follower grid last.
4. Delete relabels the first node, travels the whole chain in red, and only then drains
   the grid, removes it, then `feed`, then `post`, each far enough apart to be read as
   three separate things. The board ends empty.
5. Publishing again behaves exactly like the first time.
7. `prefers-reduced-motion` lands every state instantly with no lost functionality.
8. Scrolling away mid-run pauses; scrolling back resumes.
9. Resizing redraws every edge, and the board fits its pane without scrolling at 400px,
   768px and desktop widths.
10. No em dashes, no emoji, no chatbot phrasing in either locale.
