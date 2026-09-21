# Fast Answer!

**The game show that flies…?**

Jeremy hosts a locked, single-page trivia show. No scrolling. Buzz, speak, or tap.

This game used to live inside [GMGbrand](https://github.com/GFix21/GMGbrand) as Jeremy Trivia. It is now its own repository so the studio can stay on one screen — the way Last Call stays on one page.

## Play

- **Single page (On Screen off)** — TV, tablet, or phone shows Jeremy, the question, the answers, and the buzzer together. Drag **Jeremy** and **Studio** in the header to resize. Nothing scrolls.
- **On Screen** — put this page on the television (or a tablet). Jeremy, the question, and the answers stay on that screen. Each player’s phone is a buzzer pad: answers at the top, a large **Buzz** at the bottom. After a buzz they can **speak** the answer or tap A–D.

Phone pad URL: `/?role=pad&room=XXXX` (the TV prints a QR).

Space bar buzzes. Keys `1–4` or `A–D` pick an answer.

A round is 12 questions: 6 easy ($100), 3 hard ($500), 2 difficult ($1,000), 1 finale ($10,000).

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
