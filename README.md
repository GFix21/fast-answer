# Fast Answer!

**The game show that flies…?**

Jeremy hosts a locked, single-page trivia show. No scrolling. Buzz, speak, or tap.

This game used to live inside [GMGbrand](https://github.com/GFix21/GMGbrand) as Jeremy Trivia. It is now its own repository so the studio can stay on one screen — the way Last Call stays on one page.

## Play

- **Single page (On Screen off)** — TV, tablet, or phone shows Jeremy, the question, the answers, and the buzzer together. Drag **Jeremy** and **Studio** in the header to resize. Nothing scrolls.
- **On Screen** — put this page on the television (or a tablet). Jeremy, the question, and the answers stay on that screen. Each player’s phone is a buzzer pad: answers at the top, a large **Buzz** at the bottom. After a buzz they can **speak** the answer or tap A–D.

Phone pad URL: `/?role=pad&room=XXXX` (the TV prints a QR).

Space bar buzzes. Keys `1–4` or `A–D` pick an answer.

A round is **37 questions**: 20 Easy ($100), 10 Hard ($500), 5 Difficult ($1,000), 2 Extreme ($5,000). Ten seconds to read, then buzz.

**MAP** happens *during* that read — tap a rival (one tap, stake = this question). If you buzz first and hit it, you bank double and they lose the stake. Miss, and you lose the stake. Nobody else loses points on a normal miss.

**Lockdown** hits twice per show, after a correct buzz. That player plays 5. Opponents tap WIN or LOSE and a stake (60 seconds max; it skips ahead when everyone has locked). 4/5 pays WIN even money; otherwise LOSE pays. Those five bank at $500 each only if they clear the set.

## Deploy

Static files plus one serverless room sync:

```
index.html
game.css
game.js
questions.json
jeremy/
studio/
sounds/
api/rooms.js
```

Import the repo in Vercel. The in-memory room map keeps a TV and nearby phones in sync on a single instance. Two tabs on the same origin also sync over `BroadcastChannel`.

## Assets

| Folder | Use |
|--------|-----|
| `jeremy/` | Alpha host stills: waiting, here’s the question, next, win, loss |
| `studio/` | Five Weakest Link–style studio angles |
| `promo/` | Title card and tagline |
| `sounds/` | Buzz / correct / miss |

PG-13. Flow on GMGbrand stays password-gated and is not part of this game.
