# UI Simulation Concept

## What This Document Is

This document defines a presentation format used in the **Projects** section of this
resume site: **UI Simulation**. It documents the first two simulations built with it —
**Interactive Learning** and **Meeting** — as they actually ship today, and it closes
with a playbook for building the next one. The two later simulations have their own
implementation briefs rather than sections here:

- **Haloki** (simulation 03) — [`docs/haloki-simulation-brief.md`](haloki-simulation-brief.md)
- **Fan-out on write** (simulation 04) — [`docs/fanout-simulation-brief.md`](fanout-simulation-brief.md)

This is now both **as-built documentation** and an **implementation guide**. Earlier
drafts of this document described an auto-playing, scripted-demo format; that format was
built, reviewed, and then deliberately replaced with the free-exploration model described
below after hands-on feedback on the real thing. Where this document disagrees with your
memory of an earlier version, this version is the current one.

---

## Part 1 — The Concept

### Name

The format is called a **Faux-UI Interactive Product Demo**. In this repository it is
referred to by the short name **UI Simulation** (`ui-simulation`).

The full name unpacks into three independent ideas:

| Layer | Term | Meaning |
| --- | --- | --- |
| Outer frame | **Window chrome** / device frame | The fake title bar, tabs, and app shell that frame the content. |
| Fake content | **Faux UI** (simulated UI, synthetic UI) | Product interface rebuilt in HTML/DOM — never a screen recording, never a screenshot. |
| Visitor control | **Free exploration** | The visitor drives everything, at their own pace, from a neutral idle state. Nothing plays without a click. |

### What It Is Not

| Not this | Because |
| --- | --- |
| Product tour | A product tour is a tooltip overlay shown *inside* a live product to onboard real users. |
| Prototype | A prototype is a design-process artefact, normally built in a design tool. |
| Video mockup | A video mockup is a recording placed in a device frame. It cannot be interacted with, does not adapt to viewport, and costs megabytes. |
| Scripted demo / auto-play walkthrough | An earlier iteration of this format auto-played a timed sequence of "beats" and asked the visitor to take over. That model was built for both simulations, tested, and dropped — see [Why auto-play was dropped](#why-auto-play-was-dropped). |
| Arcade / Navattic / Storylane output | Those platforms capture real screens and overlay hotspots. A UI Simulation is hand-written markup, which stays sharp, light, responsive, and theme-aware. |

### Goal

A UI Simulation exists to answer one question a written bullet point cannot:
**what was it actually like to use the thing you built?**

Concretely it must:

1. **Show the product working**, not describe it. A recruiter should understand the
   product's core loop within roughly twenty seconds of clicking around.
2. **Attribute the work.** A simulation on its own showcases a *product*. The resume
   needs it to showcase a *person* — a Role / Stack / Scale / Outcome block sits directly
   below the frame for that.
3. **Stay safe to publish.** These are client and employer projects, not personal side
   projects. A simulation is an abstraction, never a faithful copy: no client logos, no
   trademarks, no real user data, no invented metrics presented as fact.
4. **Cost nothing to load.** No video files. No runtime syntax highlighter. Nothing
   animates before the visitor asks it to.

### Levels of Interactivity

| Level | Description | Use |
| --- | --- | --- |
| 1 — Ambient | A static poster frame. Nothing moves, nothing is clickable. | Not used on this site — too passive to demonstrate a product loop. |
| 2 — Free exploration | Nothing plays on load or on scroll. Every control is wired to real or convincingly real behaviour. The visitor drives the whole thing from a neutral idle state, at their own pace. | **The default for this site.** |
| 3 — Sandbox | Fully real logic, unrestricted (a free code editor running a real language, real camera/mic access). | Rejected — not worth the cost for a resume, and camera/mic access is a hard no regardless (see the Meeting section). |

Level 2 is a deliberate change from an earlier "on-rails auto-play, first click hands
over control" model. See below.

### Why Auto-Play Was Dropped

Both simulations originally auto-played a scripted sequence of "beats" on a timer —
lobby fills, dialogue plays out, a quiz appears and gets auto-answered — with a scrubber
below the frame to jump between beats, and the first click anywhere in the frame handing
control to the visitor. That version was fully built for both simulations.

It was replaced because, in practice:

- **It performed at the visitor, instead of waiting for them.** A resume page that plays
  itself is a video with extra steps; a page that responds to clicks is a product.
- **The scrubber and "beat" framing were project-simulation furniture, not product UI.**
  A visitor exploring a real meeting app does not see a row of dots labelled *Lobby /
  Join / Room fills / Speak / Chat / Summary / End*. Removing it made the frame read as
  the product, not as a demo *of* the product.
- **It required a second, parallel state machine** (the beat engine) on top of the real
  UI logic, which doubled the surface area for bugs and made "does this button actually
  work" an ambiguous question.

The replacement model: the simulation opens at a genuine idle state (a lobby, an
unstarted first lesson) and does **nothing** until the visitor acts. Every button is
wired to real state. A feature that legitimately unfolds over time (a video playing, live
captions streaming in) still only starts **after** the visitor presses the control for
it — the same way it would in the real product.

### Required Elements

Every simulation on this site must include:

- **A role block** — `simAside`: four stacked rows below the frame (Role, Stack, Scale,
  Outcome), each a real, honest sentence. No invented numbers presented as fact — if a
  count isn't worth asserting precisely, say "multiple" rather than guessing a number.
- **A reduced-motion path** — under `prefers-reduced-motion`, anything that would
  otherwise animate over time (a video's bullets revealing, captions streaming) jumps
  straight to its end state instead. Nothing about *what* the visitor can click changes.
- **`IntersectionObserver` gating everything that runs on a timer** — a live-caption
  loop, a video's auto-play-after-press — pauses the instant the frame leaves the
  viewport and does not run before it has genuinely entered it.

Not required, and now actively avoided unless there's a specific reason:

- **An "annotation strip" / "What I built" badge inside the frame.** This was in the
  original brief and was removed — it read as a label slapped over the product rather
  than atypical of it, and duplicates what the role block already says outside the
  frame.
- **A disclaimer line stating "this is a simulation."** Include one only if there's a
  genuine safety-relevant claim to make — e.g. "this page never touches your camera"
  would matter if the camera toggle looked like it might actually request permission.
  If the interaction itself already makes the fakeness self-evident (a toggle that
  visibly does nothing but flip a drawn icon), a caption restating it is decoration, not
  disclosure, and gets cut.

---

## Part 2 — Simulation 01: Interactive Learning

### The Product

A browser-based learning platform where a student learns and practises without leaving
the tab. Lessons mix video, quizzes, and hands-on coding tasks. The hands-on tasks run
against purpose-built applications delivered in the browser, including a simulated IDE.

### The Loop

One simulation tells one story. Here the story is the **closed learning loop**:

> **Watch → Answer → Fix**

Three lessons, each a different interaction type, each genuinely completable. That is
the product's reason to exist — practice without installing anything — so that is what
the simulation lets the visitor actually do.

### Layout

Three panes, matching the product's structure rather than its exact pixels, all three
headers pinned to the same height (`h-12`) so the row reads as one unit rather than three
misaligned strips:

| Pane | Contents | Behaviour |
| --- | --- | --- |
| Left | Course outline — progress meter, module label, three lessons with type and duration | Collapsible on desktop; a mobile bottom-tab pane on narrow screens |
| Centre | The active lesson: video, quiz, or hands-on editor | Always visible |
| Right | AI Facilitator ("Leo") chat — greeting, suggested questions, composer | Collapsible on desktop; a mobile bottom-tab pane on narrow screens |

The simulation is **full-bleed**: it breaks out of the resume's content column and runs
close to viewport width inside a neutral window chrome (`simChrome`). The role block sits
in a single column directly beneath the frame, not beside it — this leaves the frame the
full width of the column instead of squeezing it against a sidebar.

**Mobile** switches to a bottom navigation bar with three items:

    Outline  |  Learn  |  Facilitator

One pane fills the screen at a time; the visitor switches between them with the bottom
tabs.

### Outline

Three lessons, unnumbered:

| Lesson | Type | What genuinely works |
| --- | --- | --- |
| Introducing C# | Video | Play/pause, a progress bar, an optional caption toggle |
| Core concepts | Quiz | Real grading |
| Fix the Console App | Hands-on | Real per-line checking |

Each lesson's icon is a plain circle — an unchecked "radio" look — that fills solid green
with a check mark once completed. There is deliberately **no digit inside the circle**;
numbering three items that are also visually ordered top-to-bottom in a list is
redundant, and a bare unfilled/filled circle reads faster.

### The Video Lesson

- The slide is a **flat white panel, no shadow, no rounded card** — it fills the full
  height and width of the centre pane's content area, edge to edge. An earlier version
  used a bordered, shadowed card with room left empty below it; the flat full-bleed
  version reads as the actual lesson surface rather than a card floating inside one.
- Leo's avatar during playback is a **real photo** (`assets/img/ai_facilitator.jpg`),
  cropped to a circle via `object-fit: cover`. No pulsing ring around it — a talking
  indicator is carried by small animated waveform bars next to the avatar instead, which
  reads as "speaking" without the pulse effect that reads as a generic loading spinner.
- The play button, progress bar, duration, and caption toggle sit in **one control bar
  pinned to the bottom** of the video pane — not floating under the slide with a gap.
- **Captions are narration, not a repeat of the on-screen bullet text.** Each bullet has
  its own spoken-style caption line ("Every program needs a starting point. In C#,
  that's the Main() method.") distinct from what's printed on the slide
  ("Every program starts at the Main() method"). A caption that just echoes the slide
  adds nothing.
- **On completion, the video advances to the quiz on its own** — no "Lesson completed"
  banner, no manual Continue button to click through. This is the one place a
  simulation is allowed to move the visitor forward without a click, because it mirrors
  what a real "next lesson" auto-advance does, and because requiring an extra click after
  the payoff (the progress bar reaching 100%) is friction with no purpose.

### The Quiz

Real grading against two blanks in one sentence. Chips fill the next empty blank on tap;
tapping a filled blank clears it. **There is no "Try Again" button.** After grading, a
wrong blank is directly clickable to clear just that one answer and try again — the
retry affordance lives on the wrong answer itself, not as a separate reset control.

### The Hands-on Task

The task file carries three deliberate defects — a convenient number, since three fixes
map to three tap targets:

```csharp
// Fix the errors in this program
using System          // 1. missing semicolon

namespace HelloApp
{
    class Program
    {
        static void Main(string[] args)
        {
            string role = "Software Developer"        // 2. missing semicolon
            Console.WriteLine("Hello, {role}!");      // 3. missing $ interpolation prefix
        }
    }
}
```

Clicking a broken line opens an inline text input; typing the fix and pressing Enter
checks it against the expected line. **Submit task** then re-checks all three and marks
the lesson complete for real.

### Real Interactions

Everything a visitor can click on this simulation does something real:

1. **The quiz** — real grading, real right and wrong.
2. **The hands-on editor** — real per-line checking against the expected fix, real
   Submit-task validation.
3. **The video** — a real play/pause state, a real progress bar, a real caption toggle.
4. **Pane collapse** — the left/right panes genuinely open and close.

Faked, and acceptable to fake: Leo's chat replies to the suggested questions are canned
text triggered by a real click.

### Attribution

- **Database design** — the schema behind courses, lessons, progress, and rewards.
- **The applications** — the purpose-built hands-on applications students practise
  against, including the browser-based simulated IDE.

Current role-block copy (`locales/en.json` → `sims.learning`):

| Field | Value |
| --- | --- |
| Role | Database design · built the hands-on practice applications, including a browser-based simulated IDE |
| Stack | TypeScript, React, NestJS, MongoDB, Redis, BullMQ, LLM APIs |
| Scale | Multiple training programs · all hands-on practice happens in the browser |
| Outcome | Learners complete hands-on tasks without installing any software |

### Branding Rules

| Remove | Replace with |
| --- | --- |
| Company logo and wordmark | Nothing, or a neutral placeholder mark |
| Trademarked product and feature names | Generic descriptive labels — *Practice*, *Editor* |
| Real usernames and account data | Invented placeholders |

Note the one deliberate exception to the general "no real photos" instinct: **Leo's
avatar is a real photo**, supplied directly and knowingly for this purpose, not lifted
from the real product. A persona meant to feel like a specific person is allowed a real
photo when the person publishing the site supplies it themselves for that exact use.

### Implementation Notes

- **No video file.** A styled slide and a moving progress bar.
- **Syntax highlighting happens at build time** in `scripts/build-html.js`, emitting
  pre-coloured spans. No highlighter ships to the browser.
- **Lesson content is data, not markup.** Lessons live in `data/simulations.json`
  (`learning.lessons`, `learning.quiz`, `learning.code`); all copy lives in
  `locales/en.json` / `locales/vi.json` under `sims.learning`.
- **`IntersectionObserver` gates the video and chat-typing timers.** Nothing runs before
  the panel scrolls into view; playback pauses when the panel leaves.
- **`prefers-reduced-motion` is honoured** — the video jumps straight to its completed
  state, typing effects are skipped.
- **Accent colour is the site's own ink/black** (`--color-resume-ink`), not a per-
  simulation accent. An earlier version used a violet accent throughout; it was removed
  in favour of the site's existing monochrome palette for consistency with the rest of
  the resume.

---

## Part 3 — Simulation 02: Meeting

### The Product

A browser-based video meeting platform. What sets it apart is not the call itself but
the AI layer on top of it: **live captions and translation while people speak**, and a
**generated summary** once they stop.

### The Loop

> **Join → Turn on captions → Summarize → Leave**

The visitor joins a room that's already full (four participants, immediately — no
staggered "people arriving" animation), can turn on live translated captions and watch
them stream in, can generate an AI summary of what was said, and can leave — which
returns cleanly to the lobby, ready to join again.

### Two Surfaces

| Surface | Palette | Contents |
| --- | --- | --- |
| **Lobby** | Light | *Camera is off* preview card, camera/microphone toggles, an AI-readiness line, and a **Join now** button |
| **Room** | Dark | Participant grid; a right rail for Chat / People / Summary; a bottom toolbar; a timer and room code |

The simulation **owns its own colour scheme** and does not follow the visitor's site
theme — the light-to-dark flip on joining is the most striking single moment in the
sequence, and letting the page theme override it would flatten that.

### Participants

The visitor is **You**. The other three are **David**, **Leo**, and **Ann** — fixed
English first names, held consistently across the grid tiles, the People panel, chat,
and the dialogue captions. (Note: **Leo** is also the name of the AI Facilitator persona
in the Interactive Learning simulation — the two simulations are independent enough that
this hasn't caused visible confusion, but it's worth knowing if either name needs to
change later.)

### Real Interactions

Everything in the room toolbar and rail is real:

1. **Join now** — joins the room; all four tiles appear immediately, the timer starts.
2. **Mic / camera toggles**, both in the lobby and in the room — real pressed/unpressed
   state, no `getUserMedia` call ever.
3. **Translate** — turns live captions on. Once on, the four lines of dialogue stream in
   on a loop (~3.4s apart), each labelled with its speaker and, when the spoken language
   differs from the page's language, a `VI → EN` / `EN → VI` marker. This is the one
   place in this simulation that runs on its own after being switched on — the same
   allowance as the Learning simulation's video, because it demonstrates a feature that
   is inherently about things arriving over time.
4. **Chat / People / Summary tabs** — real panel switching. The chat message is present
   as soon as the panel is opened, not revealed after a delay.
5. **Summarize meeting** — streams a three-bullet AI summary in with a typewriter effect,
   traceable back to the dialogue the visitor just read.
6. **End call** — returns to the Lobby. Stops the timer and the caption loop, closes the
   rail, resets the grid and every toggle back to its starting state, so joining again
   behaves identically to the first time.

### The Dialogue and the Summary Must Be Traceable

The visitor watches captions stream, then watches a summary appear. **The summary must
visibly derive from those captions.** Three tight bullets, each traceable to something
the visitor just read. That cause-and-effect is the entire demonstration; a generic
summary makes the AI look like decoration.

Write the dialogue backwards from the summary: decide the three bullets first, then
write the lines that would produce them.

### Translation, Not Just Captions

Captions alone are unremarkable. Translation is the differentiator, so show it: one line
of dialogue is spoken in Vietnamese and resolves to English with a small `VI → EN`
marker (or the reverse, depending on which locale the visitor is viewing in). On a resume
site that is already bilingual, this reads as intentional rather than as a gimmick.

### Never Request Real Device Permissions

**Hard rule.** The simulation must never call `getUserMedia`, never trigger a camera or
microphone permission prompt, and never touch a real device. The lobby's *Camera is off*
state is exactly what the simulation renders, permanently — the camera/mic toggle buttons
remain visible and clickable, but they only switch between two drawn states.

### Sidebar (Chat / People / Summary Rail)

The message composer ("Type a message…") is a static, non-functional input pinned to
the **bottom** of the rail, outside the scrollable panel area — it only shows while the
Chat tab is active, the same way a real chat composer stays anchored under the message
list regardless of scroll position.

On narrow viewports the rail becomes a bottom-sheet overlay; **tapping the meeting
screen behind it closes it**, matching how any other overlay panel behaves. This only
applies below the mobile breakpoint — on desktop the rail is a permanent side panel and
closes only via its own tab controls.

### Branding Rules

| Remove | Replace with |
| --- | --- |
| Product logo and wordmark | Nothing, or a neutral placeholder mark |
| Real account name in the header | A neutral placeholder |
| Real room code | An invented code of the same shape |
| Real hardware names in a device list | Cut entirely — see below |

An earlier version listed the visitor's device names in the lobby ("Built-in Camera",
"Built-in Microphone"). That list was removed — it added no information the *Camera is
off* card and the mic/camera toggle icons don't already carry, and it's exactly the kind
of specific, unverifiable-feeling detail that reads as filler.

The dense circuit-pattern background of the room is reduced to just the corner brackets,
drawn as inline SVG. It carries the visual identity at a fraction of the weight.

### Keep the Data-Handling Note — Only If It Earns Its Place

An earlier version of this simulation carried a line under the role block stating this
is a simulation and never accesses the camera or microphone. It was cut: the toggle
buttons already visibly do nothing but flip a drawn icon, so the interaction itself
already makes the fakeness self-evident, and the disclaimer became decoration rather
than disclosure. If a future change makes the camera/mic state *look* more convincingly
real, reconsider adding a line back.

### Mobile

- The grid drops to a single column showing two tiles plus an overflow count.
- The right rail becomes a bottom-sheet overlay (see above), closable by tapping outside
  it.
- The lobby preview card goes full width.

### Attribution

- **Database design** — the schema behind rooms, participants, transcripts, and
  generated summaries.
- **The AI features** — live captions, translation, and meeting summarisation.
- **UI/UX** — the interface itself, across both the lobby and the meeting room.

Current role-block copy (`locales/en.json` → `sims.meeting`):

| Field | Value |
| --- | --- |
| Role | Database design · AI features (live captions, translation, summaries) · UI/UX |
| Stack | TypeScript, NestJS, React, LiveKit, Deepgram, LLM APIs, MongoDB |
| Scale | Internal meeting platform, used daily for remote meetings |
| Outcome | Leave every meeting with captions, translations and an AI-generated summary. No manual notes. |

### Implementation Notes

- **Two palettes in one component.** The lobby and room styles live in the same
  simulation and are switched by a `data-surface` state attribute, not by the site's
  theme tokens.
- **No media APIs at all.** See the hard rule above.
- **Dialogue is data.** Speaker (by tile index), source language, and resolved text per
  line, in `data/simulations.json` (`meeting.dialogue`) and
  `locales/*.json` (`sims.meeting.ui.dialogue`).
- **The summary streams from a fixed string.** No model call, no network request.
- **The decorative frame is inline SVG,** not a raster image.
- **`initMeeting(root)` in `assets/js/simulations.js`** is a self-contained function with
  its own click listeners and its own small timers (a caption-cycle interval, a wall-clock
  timer) — there is no shared "beat engine" underneath it any more. See the playbook
  below for what a new simulation's JS should look like.

---

## Part 4 — Playbook: Building a Simulation for the Next Project

This is the general procedure, distilled from building the two simulations above and
from the feedback that reshaped them. Follow it top to bottom for a new project.

### 1. Pick the chrome for how the product is actually used

The frame around the simulated UI should match the product's real environment — not a
decorative default:

| The real product is… | Chrome to use |
| --- | --- |
| A browser-based web app | `simChrome` mixin — traffic-light dots + a URL pill with a plausible fake domain/path (`learn.example.app/...`, `meet.example.app/...`) |
| A desktop / native app | A minimal title-bar chrome with no URL pill, or no chrome at all if the real app usually runs full-screen |
| A CLI / terminal tool | A terminal-style chrome — a prompt line instead of a URL bar |
| A mobile app | No hand-drawn phone bezel — that's a banned pattern generally (fake device frames read as AI-generated slop). Constrain the frame's own aspect ratio instead, and let the mobile-breakpoint CSS demonstrate the real responsive behaviour. |
| An API / backend-only project with no UI | Do not invent a UI the product doesn't have. Use a **hybrid frame**: a small product surface on one side for the action that triggers the mechanism, and a system view on the other for the mechanism itself. Simulation 04 is built this way and is the reference — see [`docs/fanout-simulation-brief.md`](fanout-simulation-brief.md). Earlier guidance here said the format probably doesn't fit at all; that turned out to be too strong, because the trigger is still a real product action and the visitor still drives everything. |

### 2. No auto-play

Nothing plays on page load or on scroll-into-view except a static idle state. Every
subsequent bit of motion is the direct result of a click. A feature that legitimately
unfolds over time (a video, streaming captions, a typed-out summary) is allowed to run
on its own **after** the visitor presses the specific control that starts it — never
before.

### 3. Rank interactions: real beats staged

For each control in the simulation, ask whether it can be genuinely functional rather
than merely animated:

- **Real** (build these first): grading a quiz, checking a code fix, an incrementing
  timer, a mic/cam/translate toggle's pressed state, opening/closing a tab or pane,
  streaming a caption or summary from fixed data once triggered.
- **Staged** (acceptable only when a real version isn't practical): a chat reply that's
  canned text behind a real click, code that "types" itself into an editor via a
  typewriter effect.

If an element can't be made real *and* can't be honestly staged as a demonstration
(rather than a decoration), cut it.

### 4. Attribution goes below the frame, in one shape

Use the shared `simAside` mixin: four stacked rows — **Role, Stack, Scale, Outcome** —
directly under the frame, full width, not squeezed into a sidebar beside it. Every value
must be true. If an exact number isn't worth asserting as fact, say "multiple" or
similar rather than picking a number for effect.

Do not add a badge or annotation strip *inside* the frame restating what the role block
already says outside it.

### 5. Copy discipline

- **No em dashes (—).** Use a period or a comma instead.
- **No celebratory emoji spam** (🎉🚀💯✨). A persona can be warm without stacking
  emoji, exclamation points, and enthusiastic adverbs in the same line.
- **No chatbot clichés** — "Great question!", "Let's dive in", and similar openers are
  a well-known tell that copy was AI-generated; write the answer directly instead.
- **Captions narrate, they don't repeat.** If a caption is shown alongside on-screen
  text, write it as if spoken aloud, not as an echo of what's already printed.
- **A disclaimer line is opt-in, not default.** Add one only if there's a real
  safety-relevant claim to make that the interaction itself doesn't already make obvious.

### 6. Visual system

- Reuse the site's own ink/black accent (`--color-resume-ink`) for interactive states.
  Don't introduce a per-simulation accent colour by default.
- A simulation's own self-contained surface (like Meeting's dark room) may break from
  the site theme *if that break is itself the point* — document why, the way the
  light-to-dark join flip is documented above. That's an exception to justify, not a
  starting option.
- A named persona (an AI assistant, a facilitator) may use a real photo if one is
  supplied directly for that purpose — prefer it over an abstract illustration when the
  persona is meant to read as a specific person.
- Any panel that behaves as an overlay on mobile (a bottom sheet, a slide-in rail) must
  close when the visitor taps outside it. This only applies at the breakpoint where it
  actually becomes an overlay — a permanently visible desktop side panel closes only via
  its own controls.

### 7. Never request real device permissions

If the product being simulated would normally ask for camera, microphone, location, or
similar access, the simulation must never actually call the browser API for it. Render
the "permission granted" or "permission denied" state as a static, toggle-able visual —
never trigger the real browser prompt.

### 8. Build the data model as data, not markup

- Structural content (lessons, dialogue lines, participants, code snippets) lives in
  `data/simulations.json`.
- All visible copy lives in `locales/en.json` and `locales/vi.json`, mirrored.
- Shared visual chrome (`simChrome`, `simAside`) lives in
  `layout/parts/_sim_shared.pug`; a new simulation adds its own
  `layout/parts/_sim_<name>.pug`.
- A new simulation gets its own `init<Name>(root)` function in
  `assets/js/simulations.js`, wired up in the single dispatcher at the bottom of that
  file. It should not need to touch or extend any other simulation's function — each
  simulation's controller is self-contained, with its own local timers and its own
  `IntersectionObserver` for anything that runs on an interval.

Adding the next project's simulation should mean: new JSON data, new Pug markup reusing
the shared mixins, new locale copy, and one new self-contained `init<Name>` function.
It should not require changes to how the existing simulations behave.

---

## Open Questions

1. **How many simulations in total?** Four are built: Interactive Learning, Meeting,
   Haloki, and Fan-out on write. Four is the ceiling. The earlier recommendation was
   three; the fourth earned its place because it is the only one that shows a backend
   mechanism rather than a screen, so it does not compete with the other three for the
   same kind of attention. A fifth would dilute the section and make the page heavy,
   so the next project belongs in the resume text, not here.
2. **Ordering** — which simulation opens the Projects section. Meeting hands control to
   the visitor from its very first frame (Join now), which makes a case for it as the
   stronger opener.
