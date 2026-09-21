# Fast Answer!

**The game show that flies…?**

Jeremy hosts a locked, single-page trivia show. No scrolling. Buzz, speak, or tap.

This game used to live inside [GMGbrand](https://github.com/GFix21/GMGbrand) as Jeremy Trivia. It is now its own repository so the studio can stay on one screen — the way Last Call stays on one page.

Question banks are authored in private studio **[Q-and-A](https://github.com/GFix21/Q-and-A)** and published here via Flow / `scripts/publish-week.mjs`.

## Play

- **Single page (On Screen off)** — TV, tablet, or phone shows Jeremy, the question, the answers, and the buzzer together. Drag **Jeremy** and **Studio** in the header to resize. Nothing scrolls.
- **On Screen** — put this page on the television (or a tablet). Jeremy, the question, and the answers stay on that screen. Each player’s phone is a buzzer pad: answers at the top, a large **Buzz** at the bottom. After a buzz they can **speak** the answer or tap A–D.

Phone pad URL: `/?role=pad&room=XXXX` (the TV prints a QR).

Space bar buzzes. Keys `1–4` or `A–D` pick an answer.

A round is **37 questions**: 20 Easy ($100), 10 Hard ($500), 5 Difficult ($1,000), 2 Extreme ($5,000). Ten seconds to read, then buzz.

`game.js` loads `questions.json` (full weekly pool, typically 96) and **randomly samples within each tier** for the 20/10/5/2 deal.

**MAP** happens *during* that read — tap a rival (one tap, stake = this question). If you buzz first and hit it, you bank double and they lose the stake. Miss, and you lose the stake. Nobody else loses points on a normal miss.

**Lockdown** hits twice per show, after a correct buzz. That player plays 5. Opponents tap WIN or LOSE and a stake (60 seconds max; it skips ahead when everyone has locked). 4/5 pays WIN even money; otherwise LOSE pays. Those five bank at $500 each only if they clear the set.

## Flow (admin)

Password-gated admin at **`/flow`**:

- Overview / publish status
- Weekly bank review (approve / reject by tier)
- Add topic (Q-and-A-shaped)
- Reject → log (+ optional replacement)
- Publish week → writes mapped `questions.json` (`finale`→`extreme`, topic id remap)

Set **`FLOW_PASSWORD`** in the environment (Vercel project env). No password is committed. Session cookie: HttpOnly + Secure (on Vercel) + SameSite=Lax. Idle auto-lock ~30s.

Durable publish on Hobby:

```bash
node scripts/publish-week.mjs 2026-W39   # or path to Q-and-A week JSON
git add questions.json banks/weekly && git commit && git push
```

## Deploy

Static files plus serverless APIs:

```
index.html  game.css  game.js  questions.json
flow/       api/rooms.js  api/flow/*
banks/weekly/  scripts/publish-week.mjs  q-and-a/map.js
```

Import the repo in Vercel (or `vercel --yes`). Set `FLOW_PASSWORD`. The in-memory room map keeps a TV and nearby phones in sync on a single instance.

## Assets

| Folder | Use |
|--------|-----|
| `jeremy/` | Alpha host stills |
| `studio/` | Weakest Link–style studio angles |
| `promo/` | Title card and tagline |
| `sounds/` | Buzz / correct / miss |

PG-13.
