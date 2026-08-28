# Employer Journey — Restructuring Concept

**Status:** implemented. See §12 for what shipped and where it deviated.
**Date:** 2026-08-28
**Scope:** information architecture and page order for `index.html` / `vi.html`. Visual language (typography, palette, the simulation frames) stays as-is.

---

## 1. Problem

Measured on the built page at a 1273px viewport:

- Total height **5,923px ≈ 4.7 screens**
- `#projects` — 3,461px (58%)
- `#cv` — 2,417px (41%)

Employer attention is a funnel with hard drop-off points. The current page answers it in reverse:

| Layer | Time | What they ask | Answered at |
| --- | --- | --- | --- |
| Positioning | ~7s | Who is this, what do they do, what level, where? | px 3,851 (inside the CV) |
| Evidence | ~60s | Is there anything concrete? | px 239, but only after interacting |
| Depth | ~5min | Are they actually good? | px 239–3,400 |
| Action | decision | How do I contact or forward them? | **nowhere** |

### Specific findings

1. **No hero.** The first thing above the fold is `PART 1 — Projects I Worked On` and a course-player UI. The visitor sees someone else's product before learning who Luan is.
2. **The name appears twice, both in the wrong place** — 14px in the nav, then 48px at px 3,851. The largest typographic moment on the page sits at 65% scroll depth.
3. **"Part 1 / Part 2" is a document metaphor, not a journey.** It implies sequential reading. Employers scan, then dive. Numbering a two-item list is ceremony.
4. **Four simulations are weighted identically** — same frame, same width, same `Role / Stack / Scale / Outcome` table. By the third one the pattern is learned and readers scroll past. The two deepest backend pieces (Haloki, fan-out) sit at positions 3 and 4, where attention is lowest.
5. **The CV repeats the simulations.** MVP Studio and Hahalolo bullets describe exactly what the four simulations already showed. Haloki is read twice.
6. **The page dead-ends.** The last line is *"Cao Thang Technical College · 2015–2018"* — the weakest fact about him is the final thing an employer reads. Grep confirms: no `mailto:`, no GitHub link, no LinkedIn link anywhere in the output.

---

## 2. Principle

> **Layer by attention. Do not sequence by document part.**

The page is not "two parts read in order". It is **one claim, proven at three depths**, where a visitor who stops at any depth still leaves with enough to act on.

---

## 3. Target structure

```
┌─ 0 · THE ANSWER ──────────────────────── ~500px · NEW
│  Luan Vu Minh                            (display — largest type on the page)
│  Positioning sentence + AI sentence
│  ─ HCMC · Remote since 2024 · VI native / EN intermediate
│  [ See what I built ↓ ]  [ Download CV (PDF) ]
│
├─ 1 · CAPABILITY → EVIDENCE ───────────── ~350px · NEW
│  Four columns. The unit is CAPABILITY, not project:
│   Full-stack product   → simulated IDE running in the browser  → Learning ↓
│   Event-driven systems → fan-out on write, Kafka pipeline      → Hahalolo ↓
│   Realtime + AI        → LiveKit, Deepgram, LLM                → BitMeet ↓
│   Fintech integration  → Plaid, ACH / payout design            → Haloki ↓
│
├─ 2 · EVIDENCE ────────────────────────── ~2,400px · REVISED
│  The four simulations — reordered and re-paced (§5)
│
├─ 3 · RECORD ──────────────────────────── ~1,200px · COMPRESSED
│  Timeline + skills grid on screen
│  Full A4 CV preserved for print
│
└─ 4 · THE EXIT ────────────────────────── ~400px · NEW
   vuminhluan97@gmail.com     ← real mailto, display size
   github.com/vuminhluan · linkedin.com/in/luan-vu97 · [ Download CV (PDF) ]
   One line inviting contact — no availability status
```

---

## 4. Decisions taken

| # | Decision | Rationale |
| --- | --- | --- |
| D1 | Hero is **typography only** — no illustration, no photo | The four simulations are the page's imagery. A hero graphic would compete with them. |
| D2 | **No interaction hint on the simulations** | Owner's call: visitors will discover interactivity themselves. The existing `INTERACTIVE SIMULATION` chip stays as a label, but no pulsing target, no "try clicking X" line. Consequence: the hero CTA (`See what I built ↓`) becomes the primary discovery route, so it must be visually strong. |
| D3 | Target role is **Software Engineer** (frontend + backend), with AI as a differentiator — not a backend-specialist positioning | Owner's call. Drives both the hero copy and the simulation order. |
| D4 | `Download CV (PDF)` moves to the **hero and the header** | It is the action an HR screener most wants; it currently sits at px 3,500. |
| D5 | Drop `Part 1 / Part 2`; name sections by content: **Work · Résumé · Contact** | Numbering a two-item list adds obligation, not clarity. |
| D6 | Skills chips move **up**, near the hero | Highest keyword density, lowest reading effort. Currently at 90% scroll depth, where both human and automated screeners have left. |
| D7 | On screen: **timeline + skills grid**. For print: **full A4 CV, unchanged** | Duplication is correct for print and wrong for screen. Same data, two renderings. |
| D8 | Add a **"The hard part"** row to the simulation aside | One sentence naming the real engineering problem and the trade-off. This is what separates a senior engineer from a CV. |
| D9 | **Remove the `Scale` row entirely** | Owner's call: there are no real figures to put there. A metric slot filled with prose reads worse than no slot at all, and inventing numbers is not an option. |
| D10 | **No availability status** in the exit section | Owner's call. The section simply makes clear he can be contacted; it does not claim to be looking, open to offers, or otherwise. |
| D11 | **English is the source of truth**; Vietnamese is a translation the owner reviews | Owner's call. Write and settle EN copy first, then translate. VI is not drafted independently. |
| D12 | Vietnamese copy addresses the reader as **`anh/chị`** | Owner's call. Applies wherever the VI copy speaks to the visitor directly. |
| D14 | Captions, transcription and translation are described as **near-realtime**, never realtime | Owner's correction: the pipeline does not reach realtime. The meeting *media* is realtime (LiveKit/WebRTC) and still says so; only the AI layer on top of it was overstated. See §12 for every string that changed. |
| D18 | **Simulation order follows the pill order**: Interactive Learning · Meeting · Haloki · Hahalolo Social Network | Owner's call, resolving §13's blocking question in favour of option (a). This reverts §5 — the fan-out returns to fourth. The scroll-spy could not ship with the two orders disagreeing. |
| D19 | The fan-out is named **"Hahalolo Social Network"** in all three places — pill, capability card, simulation heading | Owner's call. One product, one name. |
| D15 | **`What I build` and `Projects I Worked On` merge into one section**, with a sticky pill bar taking over from the card grid | Owner's call. The four capability cards already function as the section's table of contents; merging removes a redundant heading and keeps the contents reachable after the grid scrolls away. Full spec in §13. |
| D16 | Hero positioning leads with **microservices, transaction flows and message queues**, then the international team and the education-domain AI work | Owner's call. The previous draft opened on LLM features and buried the distributed-systems experience, which is the deeper half of the CV. |
| D17 | The hero says **"using AI in my daily work"**, not "learning how to" | Owner's call, correcting an earlier draft of mine that understated it. |
| D13 | **All four simulations stay open.** Positions 3–4 are *not* collapsed behind an "Open simulation" control | Reverses the §5 plan, because it contradicts D2. A collapsed simulation is strictly less discoverable than an open one, and the disclosure control is itself the kind of instruction D2 removed. The capability strip solves the same problem better: it makes linear scrolling optional, so a reader who only cares about one capability jumps straight to it. |

---

## 5. Simulation order and treatment

Because the target is a general Software Engineer role (D3), the order should demonstrate **range first, then depth**, and must not leave both deep backend pieces at the bottom.

| Pos | Simulation | Why here | Treatment |
| --- | --- | --- | --- |
| 1 | **Interactive Learning** | Widest range in one artifact: React frontend, NestJS backend, and LLM integration — plus the browser-based IDE, the most impressive single thing on the page | Full width, full frame |
| 2 | **Meeting** | Near-realtime captions, translation and the AI layer (LiveKit, Deepgram, LLM) | Full width, full frame |
| 3 | **Haloki** | Domain depth: fintech data modelling and payment integration | Full width, full frame |
| 4 | **Hahalolo Social Network — fan-out on write** | Proves the backend half is not shallow | Full width, full frame |

**Revised by D18.** An earlier version of this table moved the fan-out from fourth to second, on the argument that the deepest backend evidence should not sit where attention is lowest. That argument lost to a harder constraint: the pill bar is a scroll-spy, and a spy whose order disagrees with the document order lights up 1 → 4 → 2 → 3 on the way down, which reads as a bug. Two orders, one had to give.

The capability strip absorbs most of the cost. A reader who cares about backend work meets `Event-driven systems` in the grid at the top of the section and can jump straight to it, so fourth in the DOM no longer means fourth in reading order — which was the point of the strip to begin with.

Positions 3–4 were originally going to collapse behind an "Open simulation" control to save roughly 1,000px. That was dropped — see D13.

### Aside table changes

Current rows: `Role · Stack · Scale · Outcome`.
New rows: **`Role · Stack · The hard part · Outcome`**.

`Scale` is removed outright (D9) rather than renamed. It currently holds process descriptions — for example *"all hands-on practice happens in the browser"* — which read as a metric slot that could not be filled. Removing it also deletes these locale keys from **both** `en.json` and `vi.json`:

- `sims.common.scaleLabel`
- `sims.learning.scale`, `sims.meeting.scale`, `sims.haloki.scale`, `sims.fanout.scale`

`sims.common.hardPartLabel` plus one `sims.<key>.hardPart` per simulation take their place, so the key count stays even and `tests/locale-parity.test.js` keeps passing.

Example of the new row, for the fan-out simulation:

> **The hard part** — Fan-out on write trades write amplification for read simplicity. The alternative, fan-out on read, turns each timeline into N queries.

---

## 6. Copy drafts

**English is the source of truth (D11).** Settle the EN copy first; the Vietnamese below is a translation for the owner to review and rewrite as he sees fit. Both locales must still be filled — `tests/locale-parity.test.js` fails on any key present in one file and missing or empty in the other.

### Hero — positioning

**EN**
> I am a Software Engineer with experience in frontend and backend development. I have worked on microservice systems, transaction flows, and message queues that keep data in sync across services. I am currently on an international team, integrating AI into products in the education domain, and using AI in my daily work to be more productive.

**VI**
> Tôi là Software Engineer, có kinh nghiệm ở cả frontend và backend. Tôi đã làm việc với hệ thống microservice, các luồng giao dịch và message queue để đồng bộ dữ liệu giữa các service. Hiện tại tôi làm trong một team quốc tế, tích hợp AI vào sản phẩm thuộc lĩnh vực giáo dục, và sử dụng AI trong công việc hằng ngày để tăng năng suất.

Every clause traces to the CV: Kafka, Redis and BullMQ for the queue and sync work; the Coin Service transaction flows at Hahalolo; the remote international team and the education-domain LLM work at MVP Studio.

Note the register in the last clause (D17). An earlier draft read *"learning how to apply AI"*, which understated it — this is the first sentence an employer reads and it should not hedge.

### Hero — metadata strip

> Software Engineer · Ho Chi Minh City · Vietnamese native · English intermediate

Both `since 2018` and `Remote since 2024` were dropped at the owner's request. A year count invites arithmetic about seniority that the work itself should settle, and the remote line is a working arrangement, not a qualification.

### Capability cards — two corrections

**Full-stack product.** The old detail listed exercises. The subject is the *platform*, and it carries several different training programs — not only software development.

> **EN** · A web-based learning platform for several different training programs, with the simulated apps each one needs — coding, SQL, spreadsheet — plus built-in AI Q&A.
>
> **VI** · Nền tảng học tập trên web phục vụ nhiều chương trình đào tạo khác nhau, với các app giả lập cần cho từng chương trình — coding, SQL, spreadsheet — cùng hỏi đáp AI tích hợp.

**Near-realtime AI.** The old detail said the summary came *after* the call. It is on demand, at any point during the meeting — the same error corrected in `sims.meeting.hardPart`, which this string was missed on.

> **EN** · Near-realtime captions and translation over LiveKit and Deepgram, with an AI summary on demand at any point in the call.
>
> **VI** · Phụ đề và bản dịch gần thời gian thực trên nền LiveKit và Deepgram, tóm tắt bằng AI theo yêu cầu ở bất kỳ thời điểm nào trong cuộc họp.

### Exit section

Email as a real `mailto:` at display size, then GitHub, LinkedIn, and the PDF button. No availability status (D10) — one line that simply opens the door.

**EN**
> If you would like to talk, email is the fastest way to reach me.

**VI**
> Nếu anh/chị muốn trao đổi, email là cách nhanh nhất để liên hệ với tôi.

Register settled: the VI copy addresses the reader as `anh/chị` (D12).

---

## 7. Explicitly not doing

- No hero illustration, photo, or background graphic.
- No interaction hints, tooltips, or attention cues on the simulations (D2).
- No invented metrics. No "trusted by", no percentage improvements, no user counts. Every number on the page must trace to something real.
- No change to the simulation internals — the controllers in `assets/js/simulations.js` and the frame markup stay as they are. Only ordering, framing, and the aside table change.
- No visual redesign of the CV paper itself.

---

## 8. Open items

1. **Print stylesheet** — after the hero, capability strip, and exit section are added, verify `@media print` hides all three and emits only the CV.
2. **"The hard part" copy** — drafted for all four simulations during implementation, derived from the existing CV bullets. They are the highest-value sentences on the page and deserve the owner's review before this ships.
3. **Pill order vs. simulation order (blocking).** The requested pill order does not match the order the simulations render in. A scroll-spy bar cannot ship until one of them moves — see §13.
4. **VI review** — the Vietnamese translations are drafts. Wording and how seniority reads to a Vietnamese employer are the owner's call (D11); the `anh/chị` register is settled (D12).

Resolved since the first draft: the `Scale` row (D9), the availability line (D10), and the VI register (D12).

---

## 9. Acceptance test

> Open the page, count to seven, close it. Can you state the person's **name · role · stack · location**?

Today: no. That is the whole brief.

Secondary checks:
- A `mailto:` link, a GitHub link, and a LinkedIn link are all present in the built HTML.
- `Download CV (PDF)` is reachable without scrolling.
- Printing produces the A4 CV only.
- `npm test` passes — locale parity and the build snapshot.

---

## 10. Expected file impact

| File | Change |
| --- | --- |
| `layout/parts/_hero.pug` | new — chapter 0 |
| `layout/parts/_capabilities.pug` | new — chapter 1 |
| `layout/parts/_contact.pug` | new — chapter 4 |
| `layout/master.pug` | nav renamed to Work / Résumé / Contact, persistent PDF action, include the three new parts |
| `layout/parts/_projects.pug` | drop the `Part 1` kicker, reorder simulation includes |
| `layout/parts/_sim_shared.pug` | `simAside` drops the `Scale` row and gains "The hard part" |
| `layout/parts/_main.pug` | screen timeline vs. print CV split |
| `data/profile.json` | add `github` and `linkedin` |
| `locales/en.json`, `locales/vi.json` | add keys for hero, capabilities, contact and `hardPart`; remove `scaleLabel` and the four `*.scale` keys; both files must stay in parity |
| `assets/tailwind/input.css` | print rules for the new sections |

---

## 11. Reference

- GitHub — https://github.com/vuminhluan
- LinkedIn — https://www.linkedin.com/in/luan-vu97
- Email — vuminhluan97@gmail.com

---

## 12. What shipped

Implemented 2026-08-28. `npm test` passes (7/7); verified in-browser at 320, 375 and desktop widths, plus a forced print-preview pass.

### New files

| File | Chapter |
| --- | --- |
| `layout/parts/_hero.pug` | 0 · The Answer |
| `layout/parts/_capabilities.pug` | 1 · Capability → evidence |
| `layout/parts/_resume_screen.pug` | 3 · The record, on screen |
| `layout/parts/_contact.pug` | 4 · The Exit |

### Modified

- `layout/master.pug` — nav is Work / Résumé / Contact plus a persistent CV action; the four new chapters are wired in; the A4 CV moved into a `hidden print:block` wrapper. A `<meta name="description">` now carries the hero positioning line.
- `layout/parts/_projects.pug` — `#projects` → `#work`, kicker dropped, simulations reordered.
- `layout/parts/_sim_shared.pug` — `simAside` swaps `Scale` for `The hard part`.
- `assets/tailwind/input.css` — page-chrome components (buttons, nav links, capability cards, contact links, timeline marker) plus easing tokens and a reduced-motion block.
- `data/profile.json` — `github`, `githubHandle`, `linkedin`, `linkedinHandle`.
- `locales/*.json` — hero, capabilities, resume and contact copy; `scale` keys out, `hardPart` keys in.
- `tests/build-html.test.js` — the Tailwind canary moved from `.min-h-screen` to `.max-w-6xl`; see below.

### Deviations from the concept

1. **Simulations 3–4 are not collapsed** (D13). The capability strip covers the same need without fighting D2.
2. **Section links are hidden below 640px.** At 320px the wordmark, three links, the CV action and VI/EN cannot share a row without wrapping a clickable label onto two lines. The hero carries both actions, so nothing becomes unreachable — but mobile visitors navigate by scrolling.
3. **Soft skills (teamwork, communication) no longer appear on screen.** They remain in full on the printed CV. They are generic claims with no evidence behind them, and the screen version is the one competing for attention.

### Two bugs found and fixed during implementation

- **Unlayered CSS beat Tailwind's utilities.** The page-chrome rules set `display`, and unlayered CSS outranks every `@layer`, so `.btn-nav { display: inline-flex }` defeated `hidden` and the header CV button stayed visible on mobile. Fixed by wrapping the block in `@layer components`.
- **`print:hidden` was lost from the work section** while `_projects.pug` was being rewritten, which would have printed all four simulations into the PDF. Restored, and every direct child of `<main>` is now audited for a print variant.

### Follow-up fixes (same day, after review)

- **Capability-card rules were not aligned.** `.cap-card-link` carried both an `mt-4` utility and a `margin-top: auto` component rule; utilities outrank components, so the auto never applied and the rules drifted with text length. The component now owns its own margin and padding, and the markup carries no spacing utility on that element. This is the same layer-precedence trap as the header-button bug, in the opposite direction.
- **No gap between the fan-out and Meeting simulations.** Spacing between simulations was ad-hoc — `mb-20` on Learning, `mt-20` on Haloki and the fan-out, nothing on Meeting — which only produced four even gaps under the original order. Reordering exposed it. The spacing now lives on a `space-y-20` wrapper in `_projects.pug` and the per-article margins are gone, so the order can change freely.
- **`BitMeet` → `Meeting`** on the realtime capability card, matching `sims.meeting.name`.

### Accuracy correction — realtime → near-realtime (D14)

Every claim about captions, transcription and translation was overstated. Seven strings changed in each locale:

| Key | Change |
| --- | --- |
| `capabilities.items.realtime.label` | "Realtime and AI" → "Near-realtime AI" |
| `capabilities.items.realtime.detail` | "Live captions…" → "Near-realtime captions and translation…, with an AI summary after the call" |
| `sims.meeting.role` | "live captions" → "near-realtime captions" |
| `sims.meeting.ui.aiHint` | in-simulation UI text, same change |
| `sims.meeting.hardPart` | rewritten — see below |
| `experience.items.mvp.bullets[2]` | "real-time meetings, translation, transcription" → "real-time meetings with near-real-time transcription and translation" |
| `hero.positioning` | "live transcription" → "near-realtime transcription" |

The distinction held throughout: **the meeting media is realtime** (LiveKit/WebRTC) and still says so; **the AI layer on top of it is not**.

The `hardPart` sentence had to be rewritten rather than reworded, because it argued the opposite case — that captions "cannot be a post-processing step". The corrected version names the real trade-off, which is a stronger engineering point than the original:

> Captions cannot be instant and accurate at the same time. Speech-to-text, translation and rendering each add latency, and waiting for more audio buys accuracy at the cost of lag, so the pipeline is tuned for near-realtime rather than realtime. The summary is the opposite case — it runs on demand at any point in the meeting, so it can take the time it needs.

A first pass at that last clause said the summary "can wait until the meeting ends". It cannot be deferred — it is *on demand*, available at any point during the call, which the simulation already models. The contrast still holds, but it is between continuous latency-bound work and a one-off request, not between during and after.

The locale key is still named `capabilities.items.realtime.*`. Renaming it would touch `_capabilities.pug` for no user-visible gain, so it stayed; the value is what matters.

### Merged Work section — what shipped (D15–D19)

- `#capabilities` and `#work` are one section. `capabilities.title` and `capabilities.intro` were deleted from both locales — the merged section keeps `projects.title` and `projects.intro`, and there was no template left to render the other pair.
- `_capabilities.pug` now emits the section's table of contents in both forms: the card grid and the pill bar. It no longer emits a section of its own.
- Simulations reordered to `learning → meeting → haloki → fanout` (D18).
- `sims.fanout.name` and the events card's project label both became "Hahalolo Social Network" (D19).
- Hero: `hero.meta` dropped to three entries; `hero.positioning` rewritten (D16, D17).
- The two capability-card details corrected — the learning platform, and the on-demand summary.
- New: `projects.pillsLabel` in both locales, for the bar's `aria-label`.

**The bar is `position: fixed`, not `sticky`.** Sticky needs a row in the flow, and that row is dead space for the whole time the bar is hidden. Fixed costs no layout. `main.js` publishes `--site-header-h` and `--work-pills-h`, which CSS uses both to place the bar under the header and to give `[data-sim]` a `scroll-margin-top` that clears both fixed layers — without it an anchor jump parks the simulation's heading behind them. Measured after a pill click: heading top 112px against 92px of chrome.

Verified: bar hidden at the top of the page and at the section heading, visible with the right pill active through all four simulations, hidden again at the résumé. No page overflow at 375px; the pill row scrolls (582px of pills in 375px) while the page does not. Four pills fit unwrapped at 1280px. Card rules aligned at every breakpoint.

### One bug I introduced and removed

A fade mask on `.work-pills-row`, meant to signal the row was scrollable, silently killed the glass on the pills. An ancestor with `mask-image` becomes a backdrop root, so `backdrop-filter` on the pills had nothing left to sample — the pills stayed translucent white and simulation content read straight through them, sharp and unblurred. Computed style still reported `blur(14px)`, which is what made it look like a z-index problem; hit-testing proved the pills were on top all along.

The mask came out. A pill clipped mid-shape at the viewport edge already reads as scrollable, and the glass was the explicit requirement.

### Copy review pass (owner, VI-first)

**`hero.skillsLabel`: "Working with" → "Experience with"** (VI: "Làm việc với" → "Kinh nghiệm với"). The chip list spans the whole career — Java, Spring, Kafka and Elasticsearch were last used at Hahalolo, which ended Dec 2023 — so a present-progressive label claimed currency the list does not have. The VI was a faithful translation; the EN source was the inaccurate one. "Experience with" covers past and present without implying either that he still uses all of it daily or that he has left it behind.

Corrections applied to **both** locales:

| Key | Change |
| --- | --- |
| `capabilities.items.fintech.detail` | "ACH funding and payout **design**" → "building and maintaining the ACH funding and payout flows". He did not design those flows. |
| `sims.haloki.role` | "Initial product and technical design" → "**Contributed to** the initial product and technical design" |
| `sims.meeting.hardPart` | Dropped the closing sentence about the summary being deferrable |
| `sims.fanout.role` | Dropped "the batched writes, the idempotency key, and the delete path" |

VI-only edits (D11 — the owner owns the Vietnamese): `hero.positioning` "Tôi là **một** Software Engineer"; `projects.intro`, `sims.learning.role` and `sims.learning.hardPart` trimmed; `capabilities.items.realtime.detail`, `sims.haloki.hardPart` reworded; `experience…bullets` "toàn văn" → "toàn văn bản".

**Three VI-only trims left the Vietnamese saying less than the English.** Worth a decision either way — mirror them into EN, or accept the divergence:

- `projects.intro` — EN still carries "you can click through yourself"
- `sims.learning.role` — EN still carries "including a browser-based simulated IDE"
- `sims.learning.hardPart` — EN still carries "scoring **submissions** against predefined criteria"

**Still open:** `sims.haloki.outcome` opens with "Designed so funds collected in the US…" / "Thiết kế để tiền thu tại Mỹ…". That is the same unqualified design claim just corrected in `sims.haloki.role`, in the row directly beneath it.

### Badge removal

The `Interactive simulation` chip is gone from all four simulation headers, and `sims.common.simTag` was deleted from both locales rather than left orphaned. Nothing else referenced it. The headers now carry the product name and its one-line type, which is what the section's intro already promised.

### English becomes the default locale

`index.html` is now English; Vietnamese moved to `vi.html`. `en.html` no longer exists.

| File | Change |
| --- | --- |
| `scripts/build-html.js` | `localeOutputs` → `{ en: 'index.html', vi: 'vi.html' }` |
| `layout/parts/_language_switcher.pug` | VI → `/vi.html`, EN → `/` |
| `layout/includes/_head.pug` | `hreflang` swapped, plus a new `x-default` pointing at `/` |
| `tests/build-html.test.js`, `tests/locale-parity.test.js` | filenames and the locale-conditional `aria-current` assertion |
| `package.json` | browser-sync watch list |
| `README.md`, `docs/product-overview.md`, `docs/technology-and-local-development.md` | URLs |

The test suite caught two things worth noting. It failed on the `aria-current` assertion, which is exactly what a locale-conditional test is for. And its failure output showed the `hreflang` links still advertising `/en.html` — those live in `_head.pug` and were not on the list of files to change until the diff surfaced them. Left alone they would have kept pointing search engines at a URL that no longer exists.

**`/en.html` now 404s.** Nothing in the repository links to it any more, but anything outside the repository still does — a CV, an email signature, a job application already sent. A one-line `en.html` holding a `meta refresh` plus a canonical to `/` would keep those working. Not added, since it is an outward-facing URL decision.

### EN realigned to VI, and the name moved into the locales

The three VI-only trims were mirrored into English, so the two locales say the same thing again: `projects.intro` drops "you can click through yourself", `sims.learning.role` drops "including a browser-based simulated IDE", `sims.learning.hardPart` drops "submissions".

`sims.haloki.outcome` lost its "Designed so…" opening in both locales, finishing the correction that started at `sims.haloki.role`.

**`profile.name` moved to `identity.name` in the locales.** The name was sitting in `data/profile.json` under the heading "language-neutral resume details", which it is not — English renders "Luan Vu Minh" and Vietnamese renders "Vũ Minh Luân". The Vietnamese page had been showing the English spelling in the header wordmark, the hero `h1` and the printed CV. It stayed invisible because `meta.title` is a locale string and already carried "Vũ Minh Luân", so the browser tab was right while the page was wrong.

`data/profile.json` keeps only what genuinely does not change by language: phone, email, website, and the two profile URLs. `docs/product-overview.md` updated to match.

Minor, unresolved: outcome rows now end with a full stop on Meeting and Haloki but not on Interactive Learning or Hahalolo.

### Test change worth reviewing

`tests/build-html.test.js` asserted that `.min-h-screen{min-height:100vh}` appears in the built CSS, as a canary proving Tailwind scanned the Pug tree. That utility existed only on the on-screen A4 CV block, which the résumé timeline replaced, so the assertion now targets `.max-w-6xl` — the container shared by every chapter. The test still checks the same thing; only the sentinel changed.

---

## 13. Merged Work section — spec (D15)

`#capabilities` and `#work` become one section. The four capability cards keep their place at the top; once they scroll away, a **sticky pill bar** takes over as the section's table of contents so any simulation stays one click away.

### Behaviour

| Aspect | Decision |
| --- | --- |
| Mechanism | **Two separate elements**, not one morphing element. The card grid scrolls away normally; the pill bar is its own element that appears once the grid leaves the viewport. A true morph would have to animate a full layout change from a 4-column grid to a single row — expensive, and janky at exactly the moment the reader is scrolling. |
| Stickiness | Sticky below the site header, for the whole section. It disappears on leaving the section. |
| Active state | Scroll-spy: the pill for the simulation currently in view is highlighted. |
| Pill labels | Product names, not capability names — shorter, and they match the heading each pill jumps to. |
| Bar background | Transparent. |
| Pill treatment | Glass — translucent fill plus backdrop blur, so page content shows through. |
| Mobile | The pill row scrolls horizontally. No wrapping to a second line. |
| Heading and intro | One heading. Keep the `projects.intro` copy (*"These are products I helped build as part of a team…"*) — it carries the two facts the other intro does not: the work was done on a team, and the simulations are clickable. |

### Consequences to handle

- **Two stacked sticky layers.** The site header is already `sticky top-0`. The pill bar becomes the second, so every simulation's `scroll-mt-*` has to grow by the bar's height, or clicking a pill parks the target heading underneath it.
- **Anchors change.** `nav.work` currently points at `#work`; the merged section needs one id and the nav must follow.
- **Print.** The pill bar must be hidden in print alongside the rest of the section.
- **Reduced motion.** The bar's entrance collapses to an opacity change under `prefers-reduced-motion: reduce`.
- **Glass needs a fallback.** `backdrop-filter` is widely supported but not universal; the pills need a solid-enough fill to stay legible where it is ignored.

### Resolved — pill order vs. simulation order

Settled as option (a), D18: the simulations were reordered to match the pills. Both now read Interactive Learning · Meeting · Haloki · Hahalolo Social Network.

The order lives in one place — `caps` in `_capabilities.pug` — and the include order in `_projects.pug` mirrors it. Changing one without the other reintroduces the bug, so both files carry a comment saying so.

### Naming

`sims.fanout.name` and the capability card both moved to **"Hahalolo Social Network"** (D19), so pill, card and simulation heading agree.
