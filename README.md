# Fast Answer!

**The game show that flies…?**

Jeremy hosts a locked, single-page trivia show. No scrolling. Buzz, speak, or tap.

This game used to live inside [GMGbrand](https://github.com/GFix21/GMGbrand) as Jeremy Trivia. It is now its own repository so the studio can stay on one screen.

## Directions & Rules

Open **[directions.html](./directions.html)** (also `/directions`) on its own — it does not go through the lobby. The lobby **Directions & Rules** link lands there; the short Rules modal keeps a **Full directions →** link.

The television is a **web page**, not an AirPlay transmitter. Fast Answer does not send AirPlay, Chromecast, or Smart View from inside the game. The “TV” is whichever screen opens the URL (smart TV browser, Apple TV Safari / AirPlay mirror, Chromecast “Cast tab”, HDMI, Fire TV Silk, etc.).

**Recommended flow (Silk / Fire TV):** open https://fast-answer-seven.vercel.app (or `?tv=1`) on the set. The TV **creates and owns** the room. Expand the corner **Join** chip for QR/code → phones open `/?role=pad&room=CODE` → each pad **Buzz**es to ready → when every pad is ready, the show starts on the TV.

1. **Best** — open Fast Answer in the TV’s own browser (Silk auto-enables On Screen). The set owns the room.
2. **AirPlay** — iPhone/Mac Screen Mirroring to Apple TV, or Safari on Apple TV if available. Prefer the set’s own browser so the TV tab owns sync.
3. **Chromecast** — Cast the Chrome tab from a laptop. **HDMI** from a laptop is the same idea.

Phones never receive the TV picture. Flow is hidden on the TV display. Same Wi‑Fi helps room sync; BroadcastChannel syncs same-origin tabs; serverless rooms sync TV+phones on one Vercel instance.



## Language (EN / FR / DE)

Lobby and Directions include an **EN / FR / DE** switcher (saved in `localStorage` as `fa-locale`).

- Live questions: `questions.json` (EN), `questions.fr.json`, `questions.de.json`
- Placement / Dojo: `banks/placement/[fr|de]/generational-first-pass.json`
- Weekly studio packs: `banks/weekly/[fr|de]/<weekKey>.json` (same layout as Q-and-A)
- Flow admin has a matching locale switcher for weekly review, placement archive, and reject/regen

English remains the source of truth for ids and `correctIndex`. Sync locale packs from Q-and-A, then `npm run publish:week`.

## Lobby

One page. Collapsible menus. Jeremy and the studio stay live behind the card.

- **Dojo (profile)** — below Join TV in the lobby (phone only; hidden on TV / `?tv=1`). Create a profile (name + password + photo) or unlock with the profile password; avatar upload stays here. Create profile starts placement immediately.
- **Karate belt** — white→black from career points, shown as a belt strip in Dojo.
- **Medals** — Bronze / Silver / Gold from the 10-question placement (valid ~three months).
- **Placement** — ten questions. Prompt for 10s, then answers. No name/points on the live Dojo card.
- **Room** — 2 to 12 seats. TV owns the room on On Screen / Silk / `?tv=1`. Phones join as pads (corner QR), Buzz to ready, all-buzz starts the show. Empty seats are celebrity bots.
- **Set** — Jeremy height and studio angle, live on this phone (sliders work on mobile).

Discreet **Flow** + © GMG Brand Label sit at the bottom on phone/desktop (hidden on TV). Flow on GMGbrand stays password-gated.

## Play

- **Off Screen** — pad / buzzer on this phone without forcing the full TV UI. Local host play keeps Jeremy, answers, and buzzer together.
- **On Screen** — television owns the room. Phones join as pads. Tap or **speak** an answer on the pad — both submit to the TV room.
- **Lobby** on the pad (including after the show) leaves the room and returns to the lobby.
- **MAP** — arm during the read; after you buzz, steal targets appear under the answers (2× points if correct).
- **Lockdown** — Lock in WIN/LOSE + stake; ~7s rules countdown; up to 3 minutes per hard Q with points $5000→$0; waiters get a 60s wait without seeing the hero’s response.

Phone pad URL: `/?role=pad&room=XXXX` (the TV prints a QR).

Space bar buzzes. Keys `1–4` or `A–D` pick an answer.

A round is **37 questions**: 20 Easy ($100), 10 Hard ($500), 5 Difficult ($1,000), 2 Extreme ($5,000). Ten seconds to read, then buzz.

**MAP** happens *during* that read — tap a rival (one tap, stake = this question). If you buzz first and hit it, you bank double and they lose the stake. Miss, and you lose the stake. Nobody else loses points on a normal miss.

**Lockdown** hits twice per show, after a correct buzz. That player plays 5. Opponents tap WIN or LOSE and a stake (60 seconds max; it skips ahead when everyone has locked). 4/5 pays WIN even money; otherwise LOSE pays. Those five bank at $500 each only if they clear the set.

Empty seats are celebrity bots with their own skill and buzz timing. Pads replace them as they join, up to 12.

## Deploy

Static files plus one serverless room sync:

```
index.html
directions.html
game.css
game.js
questions.json
jeremy/
studio/
promo/
sounds/
api/rooms.js
```

Import the repo in Vercel. The in-memory room map keeps a TV and nearby phones in sync on a single instance. Two tabs on the same origin also sync over `BroadcastChannel`.

## Assets

| Folder | Use |
|--------|-----|
| `jeremy/` | Alpha host stills: waiting, here’s the question, next, win, loss |
| `studio/` | Five Weakest Link–style studio angles |
| `promo/` | 3D title card and tagline |
| `sounds/` | Buzz / correct / miss |

PG-13. Flow on GMGbrand stays password-gated and is not part of this game.

## Multiplayer (lobby Room)

- **Host** — set seat count (2–12), optionally fill empty seats with celebrity bots, Play locally or On Screen.
- **Join TV / Join as buzzer** — enter the TV room code on a phone (profile + Dojo placement required). Pad joins via `/api/rooms`.
- **Cast TV** — creates a room and a copyable Silk link: `/?tv=1&room=CODE` for Fire Stick. Phones Join TV with the same code.
- Dojo placement is **phone-only** (hidden on TV / `?tv=1`).
- Flow **Archives** includes a **Placement** page (Q-and-A bank) for reject / regenerate alongside monthly weeks.

