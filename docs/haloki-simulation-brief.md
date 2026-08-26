# Haloki Simulation Brief (Simulation 03)

Implementation brief for the third UI Simulation in the Projects section. Read
[`docs/ui-simulation-concept.md`](ui-simulation-concept.md) first: this document assumes
the format rules defined there and only records what is specific to Haloki.

---

## 0. Decisions on record

Four questions were open while drafting. All four are closed.

| # | Question | Answer | Consequence |
| --- | --- | --- | --- |
| D1 | Stripe, or only Plaid? | Stripe was integrated at a basic level: the Plaid processor token is exchanged for a bank account on the company's Stripe account. | Stripe stays in the Stack row. The mechanism is not written out anywhere, in the doc or on the page. |
| D2 | Did Haloki launch? | **Corrected.** It had not launched at the point the author left the team. | Scale drops the launch clause entirely and states scope only. Naming the pre-launch status on the page invites a conversation the author would rather have in person, and a scope line makes no claim either way. Outcome was reworded from `Funds collected ... and paid out` to `Designed so funds ...`, because the original tense claimed a shipped result for a product that never shipped. No numbers appear anywhere on the page. |
| D3 | What to call the banks? | Names that announce themselves as fake: Sample, Demo, Simulation. | Zero trademark surface, and no need to verify anything against a register. |
| D4 | FX rate? | Rounded, `1 USD = 26,000 ₫`. | A round rate also reads less like a live quote, which suits the `indicative demo rate` label. |

### Revision decisions

Changes the owner asked for after reviewing the built simulation, and why each one is an
improvement rather than a preference.

| # | Change | Why |
| --- | --- | --- |
| R1 | The Money rails panel is gone | It rendered from the same state object as the phone, so it repeated what the Activity list and the transaction details already say, and it pushed the frame off the centre of the column. The two-speed story survives it, on the funding transaction detail. |
| R2 | The funding row lands on `Pending` with a spinner, then resolves to `Completed` after 3 seconds | A row that sits at `Pending` forever reads as a stuck simulation. The wallet credit really is complete. The ACH leg is a different fact, so it moved down to the detail timeline, whose last step stays pending at `in 3 business days`. The middle step is now `Balance credited`, so `Completed` on the row and `3 business days` in the detail are not contradicting each other. |
| R3 | Connect lands on Transfer Money with a success toast | Returning to Home after linking left the visitor to work out what to do next. A freshly linked account has exactly one useful next action. The toast names the account (`Linked Sample Bank ••••4321`), so nothing is lost by skipping a confirmation screen. |
| R4 | Send Money is Recipient → Amount → Review | Who is being paid decides how much, not the other way round. It also puts the read-only payout account in front of the visitor before any number is entered. |
| R5 | The recipient step is read-only, with no contact list and no new-recipient form | Nothing in the simulation accepts a typed bank detail any more. A public page with an account-number field is shaped like a data-collection surface whatever the intent. Dropping the list as well removes a selection step that decided nothing, since there was only ever one payout account worth showing. |
| R6 | Send Money charges no fee | The `$4.99` was a placeholder from the design phase and was never Haloki's pricing. The fee line stays, reading `Free`, because it answers the question before the reader asks it. |
| R7 | Purpose is a read-only field pre-filled with `Family support` | The declaration is real and worth showing. Choosing between four options demonstrates nothing, and it was the only reason for one of the validation rules. |
| R8 | Both amount inputs accept digits and one decimal point only | A money field that accepts `abc` is a money field nobody tested. `inputmode="decimal"` plus filtering as the character arrives. |
| R9 | Inputs lost their focus ring and gained a focus border | A ring around a field that already has a border is noise. The border going to `--color-resume-ink` is the same signal with less ink, and keyboard users keep an indicator. |
| R10 | The Transfer screen runs a real-time Plaid balance check under the `From` dropdown, and `Add money` is disabled while it runs | Balance is the thing Plaid is actually integrated for, and the CV bullet says so. A row that spins for three seconds and then resolves to that account's own number, re-running whenever the account changes, is the only part of the Plaid integration that can be shown rather than asserted. It also produces a fourth validation with a real dependency: the amount is checked against a balance the app had to go and fetch, not against a constant. |
| R11 | The single `Service fee` row splits into `Haloki fee` and `ACH fee` behind an info control | One number hides the fact that funding has two costs with two different shapes. Splitting it makes the pricing legible without adding a permanent second row to a screen that is already dense, and the total on the screen is unchanged, so nothing downstream of it moves. |

Nothing in this document is pending.

---

## 1. Why this simulation exists

The CV attributes Haloki to a **backend** role: initial product and technical design,
database schema design, and APIs integrating Plaid for bank connectivity and financial
workflows. No UI/UX.

That sets the centre of gravity. A pretty send-money form showcases work that is not his.
The thing worth showing is the part a bullet point cannot carry:

> Money moves on **two independent rails**. The recipient in Vietnam is paid out of local
> VND liquidity within minutes, while the ACH debit in the US is still three business days
> from settling.

The phone frame is the way in. The transaction detail is where the point lands.

---

## 2. The loop

> **Link → Add money → Send → open the funding transaction and find the ACH leg still
> three days out**

The payoff state, visible on the Home screen and explained one tap deeper:

```
Activity
  Sent to NGUYEN VAN B      $500.00     Completed
  Added money             $1,000.00     Completed

  ↓ tap the funding row

  ●  Authorised via Plaid            just now
  ●  Balance credited               just now
  ◐  ACH settles             in 3 business days
```

Two rows that both say `Completed`, and one of them is only completed from the wallet's
point of view. The recipient in Vietnam has their VND. The sender has their balance. The
ACH debit that paid for all of it has not settled and will not for three business days.
Nothing explains it. It just sits there and a reader who understands payments recognises
it immediately.

---

## 3. Hard rules

These are the Haloki equivalent of the Meeting simulation's "never call `getUserMedia`".

1. **Never render a bank login screen, even a fake one.** Real Plaid Link includes the
   bank's own credential page. Recreating it on a public site produces a page shaped like
   a phishing page, whatever the intent. The Plaid sheet goes institution picker →
   account confirm → done. No username field. No password field. Ever.
2. **No network, no storage, no persistence.** No `fetch`, no `XMLHttpRequest`, no
   `localStorage`, no `sessionStorage`, no cookies. Nothing a visitor types leaves the
   browser tab or survives a reload. This is also why there is no Reset button: a page
   reload already returns the simulation to its idle state.
3. **No routing numbers anywhere, and no typed bank details at all.** Routing number
   (ABA) is a US-only concept and does not exist for a Vietnamese recipient. On the US
   side Plaid supplies the account. On the Vietnamese side the payout account is
   read-only. The only thing a visitor can type into this simulation is an amount.
4. **No real institution names.** Every bank name announces itself as fake: `Sample Bank`,
   `Demo Credit Union`, `Simulation Bank`. `Vietcombank`, `Techcombank`, `BIDV`, `Chase`
   and similar are trademarks and stay out.
5. **No Plaid brand asset.** The sheet says `Plaid` as text in the site's own palette,
   with a neutral lock glyph. Naming a vendor you integrated is honest. Reproducing their
   logo inside a fake modal is not, and it also implies you designed their sheet.
6. **The FX rate is labelled `indicative demo rate`.** It never looks live.
7. **No invented metrics.** No volumes, no user counts, no processing figures.

---

## 4. Corrections applied to the first draft

Recorded so the reasoning is not lost.

| First draft | Problem | Applied fix |
| --- | --- | --- |
| Recipient form has Routing Number | Does not exist in Vietnam | The recipient step collects nothing at all: bank, account number and account holder are read-only |
| Send Money shows fee only | A USD→VND screen without a rate and a recipient amount is not a remittance screen | Review screen shows send amount, fee, rate, and recipient gets, in VND |
| Plaid sheet opens straight onto an account with its number | Plaid cannot know the account before an institution is chosen, and only ever returns the last four digits | Institution picker → masked account confirm → Connect |
| "Total sent" wording on the funding screen | Funding pulls money in, nothing is sent yet | "Credited to your balance" |
| Send Money hidden until unlocked | A feature that appears from nowhere reads as a trick | Always visible, disabled, with a modal that says why and offers the fix |
| Flow ends at Confirm | The whole point is the recipient receiving VND | Status detail per transaction, plus the two-row Activity list |

Kept against advice, at the owner's decision: **Haloki charges a service fee on funding.**
Most wallets fund by ACH for free because ACH is cheap. The fee schedule in section 7 is
built to make that choice defensible rather than arbitrary. Send Money, by contrast,
charges nothing.

---

## 5. Layout

Not full bleed. The section stays inside the existing `max-w-6xl` content column.

```
Desktop (lg and up)                    Below lg
┌──────────┬──────────────────┐        ┌──────────────┐
│          │  Haloki · badge  │        │ Haloki·badge │
│  PHONE   ├──────────────────┤        ├──────────────┤
│  390px   │  Role            │        │    PHONE     │
│  702px   │  Stack           │        │              │
│          │  Scale           │        ├──────────────┤
│          │  Outcome         │        │   simAside   │
│          │  (520px)         │        └──────────────┘
└──────────┴──────────────────┘
```

`grid gap-x-8 lg:grid-cols-[390px_minmax(0,520px)] lg:grid-rows-[auto_1fr] lg:items-start`.
The frame is placed at `lg:col-start-1 lg:row-start-1 lg:row-span-2`, the header at
`lg:col-start-2 lg:row-start-1`, and `simAside` at `lg:col-start-2 lg:row-start-2`.

**Placement, not flex order.** Source order is header, frame, role block, which is
exactly the mobile order. Explicit grid placement rearranges it on `lg` without touching
source order, so the role block never floats above the artefact it describes. An earlier
attempt used `order-1` / `order-2` on two wrappers and put the role block first on
mobile.

**Why the header sits inside the right column.** Learning and Meeting head their sections
full width because their frames are full-width browser windows. Haloki's frame is a 390px
phone, so the space beside it becomes the write-up column: title, product line, badge,
then the role block. Left is the artefact, right is the text about it. That divergence is
driven by the frame's shape, not by inconsistency for its own sake.

**Why the right column is capped at 520px and its rows stack.** A four-row role block can
never match a 702px phone for height, so height parity is the wrong goal. Two earlier
shapes both failed on it: the role block full width beneath a centred frame left roughly
380px of dead space either side of the phone; the role block in a 730px right column left
478px of dead space below it, and stretched four short lines across a measure far too
wide. Capping the column at 520px and stacking each row label-over-value
(`.h-aside-stacked` in `input.css`) grows the block from 225px to 378px, wraps the values
to a readable measure, and cuts the residual gap to 280px. What is left reads as column
whitespace rather than a hole.

`simAside` carries `mt-4` for the stacked case, so Haloki passes `lg:mt-0` plus its grid
placement and `h-aside-stacked` through the mixin's optional second argument. The
argument defaults to nothing, so the Learning and Meeting call sites are unaffected.

**Why the rails panel is gone.** It read the same state object as the phone, so it never
told the visitor anything the Activity list and the two transaction detail screens do not
already say, and it cost the frame its place in the middle of the column. The two-speed
story it existed to tell now sits where a reader actually looks for it: on the funding
transaction, whose last timeline step stays pending at `ACH settles · in 3 business days`
while the row above it reads `Completed`.

### The phone frame

Per the format rules there is **no drawn bezel, no notch, no home indicator**. Those read
as generated filler. What the frame is:

| Part | Spec |
| --- | --- |
| Shell | `w-full max-w-[390px] mx-auto h-[720px] max-h-[78vh] rounded-[20px] border border-resume-line bg-white overflow-hidden flex flex-col` |
| Status bar | `h-8`, time on the left (`10:24`, not Apple's `9:41`), three abstract glyphs on the right as inline SVG, `text-resume-muted` |
| App header | `h-12`, matching the header height convention the Learning simulation already uses. Back chevron when not on Home, title centred |
| Body | `flex-1 overflow-y-auto` |
| Action bar | Pinned bottom, `border-t p-4`, holds the single primary button for the screen. Absent on screens with no primary action |
| No `simChrome` | This is a native app, not a browser. No traffic lights, no URL pill |

Sheets, modals and the toast render **inside the frame**, over an internal scrim where
they have one. They never cover the page.

**Colour exception.** The format rules say not to introduce a per-simulation accent.
Green and amber here are not an accent, they are transaction status semantics, and they
appear only on status chips and the transaction timelines. Everything interactive stays
`--color-resume-ink`.

**Focus.** Buttons keep the shared 2px focus ring. Inputs do not: the ring around a field
that already has a border is visual noise. Instead the field's own border switches to
`--color-resume-ink` on `:focus` and `:focus-visible`, including the read-only ones, so a
keyboard user can always see where the caret is.

---

## 6. Screens

Seven surfaces, three of which are one Home component in different states.

```
Home (no bank)
  │ tap Transfer Money or Send Money → Locked modal → Link bank account
  ↓
Plaid sheet          step 1 institution → step 2 masked account → Connect
  ↓
Transfer Money       lands here directly, with a success toast naming the account
  ↓
Home (funded)        Balance $995.00 · Activity: Added money · Pending, then Completed
  ↓
Send · Recipient     three read-only fields. Nothing to pick, nothing to type
  ↓
Send · Amount        amount · purpose (read-only) · live quote
  ↓
Send · Review        send / fee / rate / recipient gets · rate lock counting down
  ↓
Home (both)          Activity: Sent Completed · Added Completed
  │ tap either row
  ↓
Transaction status   per-transaction timeline. The funding one still ends on
                     "ACH settles · in 3 business days"      ← the payoff
```

### 6.1 Home

| State | Balance | Transfer Money | Send Money | Activity |
| --- | --- | --- | --- | --- |
| No bank | `$0.00` | **enabled** | muted | empty |
| Linked | `$0.00` | enabled | muted | empty |
| Funded | `$995.00` | enabled | enabled | 1 row |
| Sent | `$495.00` | enabled | enabled | 2 rows |

**Transfer Money never renders muted, including at the idle state.** It is the entry
point of the whole flow, and tapping it with no bank linked opens the modal that links
one, which is a next step rather than a rejection. The first thing a visitor sees cannot
be a screen where every action is greyed out: that reads as a dead frame and they scroll
past without clicking anything. Send Money stays muted until it is genuinely usable.

Both cards remain clickable in either state. Muting is presentation only, so the reason
modals below are always reachable.

Above the balance sits the linked-account chip once a bank is connected
(`Sample Bank ••••4321`). Tapping it opens the account list with a
`+ Link another bank` row, which reopens the Plaid sheet. That is what gives the "From"
dropdown on the Transfer screen a genuine reason to exist.

Two primary actions, side by side, each with an icon that carries the direction:

- **Transfer Money** · arrow pointing **into** a wallet · caption `From your bank`
- **Send Money** · arrow pointing **out** to a globe · caption `To Vietnam`

The names stay as they are. The icons and captions do the disambiguating.

**The funding row has two stages.** On Confirm it appears immediately as `Pending` with a
small spinner and the suffix `settles in 3 business days`. Three seconds later it becomes
`Completed`, on the same green chip the Sent row uses, and the suffix drops. The balance
credits at Confirm, before either stage: the credit is optimistic, which is the whole
point of the product. The ACH fact does not disappear, it moves down a level, onto the
transaction detail in 6.8.

### 6.2 Locked modals

Disabled buttons stay tappable and explain themselves. Each modal ends in the action that
resolves it, so it is never a dead end.

| Trigger | Title | Body | Button |
| --- | --- | --- | --- |
| Either action, no bank linked | `Link a bank account` | `Connect a bank account with Plaid before you can add or send money.` | `Link bank account` → Plaid sheet |
| Send Money, balance under the minimum | `Not enough balance` | `Your balance is $0.00. You need at least $100.00 to send.` | `Add money` → Transfer screen |

### 6.3 Plaid sheet

Two steps, no credentials.

```
Step 1                             Step 2
Plaid · Select your bank           Plaid · Confirm the account
  ○ Sample Bank                      Sample Bank
  ○ Demo Credit Union                ☑ Checking ••••4321
                                     [ Connect ]
```

One account per institution. Closing the sheet at either step returns to Home with
nothing linked.

**Connect lands on Transfer Money, not Home**, and raises a toast that names the account:

```
✓  Linked Sample Bank ••••4321
```

The toast renders inside the frame, near the top, never over the page, and dismisses
itself after about 2.5 seconds. It fires on every successful Connect, including one
reached through `+ Link another bank`. A freshly linked account has exactly one useful
next action, so the app performs it; the toast is what confirms which account was linked
without spending a screen on it.

### 6.4 Transfer Money

| Field | Behaviour |
| --- | --- |
| From | Dropdown of linked accounts, plus `+ Link another bank` |
| Balance check | Directly under `From`. Spinner plus `Checking balance with Plaid` for 3 seconds, then `Available balance · $2,480.15` for that account |
| Amount | Digits and one decimal point only, presets `$100 · $500 · $1,000` |
| Service fee | Computed live, see section 7. The label carries an info control that opens the breakdown |
| Credited to balance | Amount minus the total fee, computed live |
| Arrives | `Available now · ACH settles in 3 business days` |

Primary button `Add money`, disabled while the balance check runs and until the amount
passes validation.

#### The Plaid balance check

The row under `From` is the one place the Plaid integration is visible as behaviour rather
than as a brand name in a sheet.

```
FROM
[ Sample Bank ••••4321                    ⌄ ]
◌ Checking balance with Plaid          →   Available balance · $2,480.15
```

1. Entering Transfer Money starts the check. The row shows a spinner and the muted note
   `Checking balance with Plaid`.
2. **`Add money` is disabled for the whole duration**, whatever has been typed into the
   amount field. An amount cannot be judged against a balance nobody has read yet.
3. After 3 seconds the row resolves to that account's available balance and the button
   goes back to following normal validation.
4. **Changing the `From` account re-runs the check from step 1**, against that account's
   own number. This is what makes the check read as real rather than as a loading
   flourish: `Sample Bank` resolves to `$2,480.15` and `Demo Credit Union` to `$612.40`,
   and the fourth validation rule changes verdict with it.

| Account | Available balance |
| --- | --- |
| `sampleBank` ••••4321 | `$2,480.15` |
| `demoCu` ••••9088 | `$612.40` |

The duration is one number, `balanceCheckMs`, in `data/simulations.json`. Under
`prefers-reduced-motion` the spinner stage is skipped and the balance is painted on the
screen's first frame.

#### The fee breakdown

The `Service fee` label carries a small `i`-in-a-circle control. It is a real `<button>`
with an `aria-label`, and it sits in the summary box rather than inside the amount field's
wrapper, so focusing it never lights that field's border. Activating it opens a breakdown
inside the frame, over an internal scrim, dismissible by its close control and by tapping
the scrim.

```
                                      ×
Service fee                       $5.00
────────────────────────────────────────
Haloki fee                        $3.50
Covers bank verification, balance checks, and ledger.

ACH fee                           $1.50
Cost of the bank transfer network.
```

The amounts are live: they recompute with the entered amount.

**An empty amount field charges nothing.** With no amount entered, the fee row, the
credited row, and every line of the breakdown read `$0.00`. This needs saying because the
ACH component is flat: computed literally it would show a `$1.50` fee against an empty
field and credit a negative amount, and the Transfer screen with an empty field is
exactly where linking a bank drops the visitor. Nothing is being transferred, so nothing
is charged.

### 6.5 Send · Recipient

**First step, and entirely read-only.** No saved-contact list, no dropdown, no
`+ New recipient` form. One payout account, rendered from data at build time into three
fields that look like real form fields and are visibly not editable: muted fill,
`readonly`, and a border that goes to ink on focus so a keyboard user can still see where
they are.

```
Recipient

BANK              Simulation Bank
ACCOUNT NUMBER    1903 6688 7412
ACCOUNT HOLDER    NGUYEN VAN B
```

Nothing is selected, so `Continue` is always enabled and this step has no validation.

The reason to build it this way rather than as a form: a public page that accepts a typed
bank account number, even a simulated one, is a page shaped like a data-collection
surface. Showing the payout account read-only makes the same point about what the screen
is for and collects nothing. It also fits the frame in one step, with room to spare.

### 6.6 Send · Amount and Purpose

Amount, purpose, and a live quote that recomputes on every keystroke.

```
You send            $500.00
Fee                    Free
Rate       1 USD = 26,000 ₫    indicative demo rate
Recipient gets 13,000,000 ₫
```

Purpose is a **read-only field pre-filled with `Family support`**. Inbound remittance to
Vietnam carries a purpose declaration, so the field is not decoration; choosing from a
list, however, demonstrates nothing this simulation is about, and a required dropdown is
one more thing standing between the visitor and the payoff.

The amount input takes digits and at most one decimal point. Typing `12a3` leaves `123`.

### 6.7 Send · Review

The quote again, plus recipient, purpose, and a **live rate-lock countdown** starting at
`30:00`. The countdown is real: it starts only after the visitor reaches this screen, it
is gated by `IntersectionObserver`, and under `prefers-reduced-motion` it renders its
value statically without ticking.

Primary button `Confirm and send`.

### 6.8 Transaction status

Reached by tapping an Activity row. Two shapes, because these are two transactions on two
rails, not one transaction with two halves.

**Added money.** The row says `Completed`; this screen says why that is not the whole
story:

```
Added · $1,000.00
From Sample Bank ••••4321
Service fee $5.00 · Credited to your balance $995.00

●  Authorised via Plaid            just now
●  Balance credited               just now
◐  ACH settles             in 3 business days
```

**Sent**

```
Sent · $500.00
NGUYEN VAN B · Simulation Bank ••••7412
Recipient got 13,000,000 ₫
Rate 1 USD = 26,000 ₫ · indicative demo rate
Fee Free · Purpose Family support
Reference HLK-8F2K-4T19

●  Submitted                   just now
●  Converted USD to VND        just now
●  Paid out                    just now

RECIPIENT'S NOTIFICATION
Đã nhận 13.000.000 ₫
```

---

## 7. Money model

All of this is real arithmetic recomputed from a single state object. It is the highest
value thing to build, per the format's "real beats staged" rule.

### Fee schedule

| Flow | Fee | Minimum | Maximum |
| --- | --- | --- | --- |
| Transfer Money | **Two components, summed**, deducted from the amount. See below | $100.00 | $5,000.00 per transaction |
| Send Money | **None. `Free`** | $100.00 | Available balance |

The funding fee is two components, because funding has two costs with two different
shapes:

| Component | Formula | Key |
| --- | --- | --- |
| ACH fee | **$1.50 flat**, identical for every amount | `achFeeFlat` |
| Haloki fee | **0.5% of the amount, capped at $3.50** | `halokiFeePct`, `halokiFeeCap` |

**Why one is flat and the other is a percentage.** The ACH network charges per
transaction, and that cost does not scale with the amount, while a platform fee
conventionally does.

The screens show the **sum**, and the sum is what everything downstream uses: the credited
amount, the Added status screen, and the ledger arithmetic. The two caps together bound
the total at `$1.50 + $3.50 = $5.00`, so there is no separate combined cap and none should
be added. Both caps are real conditionals the simulation can demonstrate: type `$5,000`
and the Haloki component stays at `$3.50`, so the total stays at `$5.00`.

Send Money charges nothing. The line stays on the screen reading `Free` rather than being
removed, because a remittance screen with no fee row invites the question; a fee row that
says `Free` answers it.

### Worked example

```
Transfer Money
  Amount                 $1,000.00
  Service fee                 -$5.00     ACH $1.50 + Haloki $3.50 (capped)
  Credited to balance      $995.00
  ACH settles          3 business days

Send Money
  You send                 $500.00
  Fee                         Free
  Rate           1 USD = 26,000 ₫
  Recipient gets     13,000,000 ₫

Balance   $995.00 − $500.00 = $495.00
```

`$500 × 26,000` is exactly `13,000,000 ₫`, with nothing deducted on the way.

Every funding amount, with both components spelled out:

```
$1,000  →  ACH $1.50 + Haloki $3.50 (capped)  =  $5.00  →  credited $995.00
$5,000  →  ACH $1.50 + Haloki $3.50 (capped)  =  $5.00  →  credited $4,995.00
$500    →  ACH $1.50 + Haloki $2.50           =  $4.00  →  credited $496.00
$100    →  ACH $1.50 + Haloki $0.50           =  $2.00  →  credited $98.00
```

### Validation, all real

Four rules. The recipient and the purpose are fixed and read-only, so neither can be
missing and neither has a rule.

| # | Condition | Message |
| --- | --- | --- |
| 1 | Amount under the minimum | `Minimum is $100.00` |
| 2 | Funding amount over the cap | `Daily ACH limit is $5,000.00` |
| 3 | Funding amount over the checked bank balance | `Your bank account has $612.40 available` |
| 4 | Send amount over the wallet balance | `You only have $995.00 available` |

**Order matters on the funding screen.** Rules 1 to 3 are checked in that order, so the
clearest message wins: the minimum first, then the $5,000 ACH daily limit, then what the
bank actually holds. `$6,000` from `Demo Credit Union` breaks both the limit and the
balance, and reports the limit, because the limit is the rule the visitor can do something
about by typing a smaller number.

Rule 3 uses the balance the Plaid check returned for the **currently selected** account,
and only applies once that check has resolved. It therefore changes verdict with the
`From` account: `$1,000` fails on `Demo Credit Union` (`$612.40`) and passes on
`Sample Bank` (`$2,480.15`).

Separately from validation, both amount inputs reject anything that is not a digit or a
single decimal point, as the character is typed or pasted.

---

## 8. Real versus staged

**Real:**

1. Every number on every screen, recomputed from one state object.
2. All four validation rules, including both fee caps and the bank-balance rule that
   changes verdict with the selected account.
3. Digit-only filtering on both amount inputs: `12a3` leaves `123`, `abc` leaves the field
   empty.
4. Balance and Activity rows derived from that same object.
5. The rate-lock countdown.
6. Enable and disable logic for both primary actions, and the modal that explains each.
7. The fee breakdown, recomputed from the entered amount every time it is opened.

**Staged, acceptable:**

1. The Plaid handshake. Cannot be real. Kept to two taps.
2. The payout account. One fixed recipient, rendered read-only at build time.
3. The ACH settlement clock. Compressed, and labelled `3 business days` rather than
   pretending to be wall-clock time.
4. The funding row resolving from `Pending` to `Completed` about 3 seconds after Confirm.
5. The payout completing about 1.5 seconds after Confirm.
6. The linked-account toast, which auto-dismisses after about 2.5 seconds.
7. The 5-second duration of the Plaid balance check. The balances themselves are real
   data and differ per account; only the wait is staged, and it exists so the disabled
   `Add money` button has something visible to be waiting for.

Items 4 to 7 are post-interaction, observer-gated, and instant (or, for the toast,
transition-free) under reduced motion.

---

## 9. Data model

Structure in `data/simulations.json`, all visible copy in `locales/en.json` and
`locales/vi.json` under `sims.haloki`. Bank and recipient names are proper nouns, identical
in both languages, so they stay in `data/simulations.json` rather than being mirrored
across two locale files where they could drift apart for no reason.

```jsonc
"haloki": {
  "minTransfer": 100,
  "maxTransfer": 5000,
  "minSend": 100,
  "achFeeFlat": 1.5,
  "halokiFeePct": 0.005,
  "halokiFeeCap": 3.5,
  "balanceCheckMs": 3000,
  "fxRate": 26000,
  "achSettleDays": 3,
  "rateLockSeconds": 1800,
  "reference": "HLK-8F2K-4T19",
  "presets": [100, 500, 1000],
  "usBanks": [
    { "id": "sampleBank", "name": "Sample Bank",       "mask": "4321", "subtype": "checking", "availableBalance": 2480.15 },
    { "id": "demoCu",     "name": "Demo Credit Union", "mask": "9088", "subtype": "checking", "availableBalance": 612.4  }
  ],
  "recipient": {
    "name":    "NGUYEN VAN B",
    "bank":    "Simulation Bank",
    "account": "1903 6688 7412",
    "mask":    "7412"
  }
}
```

There is no send fee, no purpose list, no recipient list and no rails graph, because none
of those exist on the page any more. `mask` stays alongside `account` because the Sent
status screen and the Review screen show the masked form while the Recipient step shows
the full number.

`availableBalance` is per US account, which is the point: the Plaid check has to resolve
to a different number depending on which account is selected, or it is decoration.
`balanceCheckMs` is the check's duration, kept as one attribute so it is one place to
tune. Every one of these numbers reaches the controller as a `data-*` attribute rendered
at build time; nothing is hard-coded in `simulations.js`.

### Bank names

| Key | Display | Side |
| --- | --- | --- |
| `sampleBank` | Sample Bank | US |
| `demoCu` | Demo Credit Union | US |
| (none) | Simulation Bank | VN |

Every name carries `Sample`, `Demo`, or `Simulation`, so no reader can mistake one for a
real institution and no register needs checking. The Vietnamese bank is not keyed because
there is only one and it is never chosen from a list.

Recipient names use the unaccented uppercase form Vietnamese banks actually store:
`NGUYEN VAN B`.

### Files

| File | Change |
| --- | --- |
| `data/simulations.json` | `haloki` block |
| `locales/en.json`, `locales/vi.json` | `sims.haloki` block, mirrored |
| `layout/parts/_sim_haloki.pug` | Reuses `simAside`, does **not** use `simChrome` |
| `layout/parts/_projects.pug` | One `include` line |
| `assets/js/simulations.js` | Self-contained `initHaloki(root)`, one line in the dispatcher at the bottom |
| `assets/tailwind/input.css` | The `/* simulation 03: Haloki */` block |

`initHaloki` must not touch or extend `initLearning` or `initMeeting`. Match the existing
file's style: `var`, `function`, no arrow functions, no template literals.

---

## 10. Motion

| Concern | Handling |
| --- | --- |
| Idle state | Home with `$0.00` and no linked bank. Nothing runs until the visitor taps |
| Timers | Five, all started by the interaction that causes them: the rate-lock countdown (1s tick), the funding row resolving to `Completed` (3s), the payout completing (1.5s), the linked-account toast dismissing (2.5s), and the Plaid balance check resolving (`balanceCheckMs`, 3s) |
| `IntersectionObserver` | Pauses and resumes all five. Threshold `0.3`, matching the Meeting simulation. Cleared when the panel leaves the viewport, rescheduled when it returns, each behind its own `pending*` flag (`pendingPayout`, `pendingFunding`, `pendingToast`, `pendingBalance`). Note that the timers **start** on the interaction that causes them rather than waiting for an observer event: the visitor has just interacted inside the frame, so it is on screen by definition, and gating the start as well would strand the payout at `Sending` in any environment where the observer does not fire |
| `prefers-reduced-motion` | Countdown renders statically without ticking. The funding row is `Completed` from the first paint, with no spinner stage. Payout resolves immediately. The balance check skips the spinner stage and paints the balance on the screen's first frame, so `Add money` is never disabled waiting for it. The toast still appears and still auto-dismisses, it just does not fade. Nothing about what is clickable changes |
| Localisation detail | The recipient's payout notification renders in Vietnamese in both locales (`Đã nhận 13.000.000 ₫`). The recipient is Vietnamese, so that is the honest version, not a translation gap |

---

## 11. Attribution block

`simAside`, four rows, straight from the CV and nothing beyond it.

| Field | Value |
| --- | --- |
| Role | Initial product and technical design · database schema design · APIs integrating Plaid for bank-account connectivity and financial workflows |
| Stack | Java, Spring, MongoDB, Plaid, Stripe |
| Scale | US bank funding by ACH, domestic payout in the recipient's country |
| Outcome | Designed so funds collected in the US are paid out from local VND liquidity, leaving the recipient nothing to wait on while the ACH debit settles |

No UI/UX claim. The interface in the frame is an abstraction built for this page, and the
role block should not imply otherwise.

Two things deliberately absent. **No customer or volume figures**, because none are
available and the format forbids inventing them. **No description of the Stripe work
beyond the word `Stripe`**, because the integration was a token exchange rather than
something worth a sentence, and a stack entry states the fact without overstating it.

---

## 12. Build checklist

- [x] `data/simulations.json` → `haloki` block, no `rails`, no `purposes`, no recipient list
- [x] `sims.haloki` in both locale files, mirrored key for key
- [x] `layout/parts/_sim_haloki.pug`, `simAside` only, no `simChrome`
- [x] Include it from `_projects.pug`
- [x] `initHaloki(root)` plus the dispatcher line
- [x] Grep the diff for `fetch`, `localStorage`, `sessionStorage`, `XMLHttpRequest`. All must be absent
- [x] Grep for `routing`. Must be absent
- [x] Grep the rendered HTML for any bank name without `Sample`, `Demo`, or `Simulation` in it
- [x] Confirm no password or username input exists anywhere in the markup
- [x] Confirm no input in the simulation accepts a bank detail. Every payout field is `readonly`
- [x] Check both fee caps by entering `$5,000` on the Transfer screen: total stays `$5.00`
- [x] Check that `12a3` typed into either amount field leaves `123`
- [x] Check all four validation messages, and the priority order on the funding screen
- [x] Check the balance row: spinner and `Checking balance with Plaid`, `Add money` disabled throughout, then `Available balance · $2,480.15`
- [x] Switch the `From` account and confirm the check re-runs and lands on `$612.40`
- [x] Confirm `$1,000` fails on `Demo Credit Union` and passes on `Sample Bank`
- [x] Open the fee breakdown at `$1,000`, `$500` and `$100` and check both components
- [x] Confirm the info control is a `<button>` with an `aria-label` and does not light the amount field's border
- [x] Check the balance arithmetic end to end: `$995.00` funded, `$495.00` after a `$500` send
- [x] Check that Send Money reads `Free` and that no converted line survives
- [x] Check the funding row: `Pending` with a spinner, then `Completed` about 3 seconds later
- [x] Check the funding detail still ends on `ACH settles · in 3 business days`
- [x] Check the toast: fires on every Connect, lands on Transfer Money, gone after about 2.5 seconds
- [x] Check the send order: Recipient, then Amount and Purpose, then Review
- [x] Focus an amount input: no ring, border goes to `--color-resume-ink`
- [x] Check reduced motion, and that the section leaving the viewport clears all five timers
- [x] Check the mobile breakpoint, where the frame fills the column
