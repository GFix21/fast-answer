# Fast Answer!

**The game show that flies…?**

Jeremy hosts a locked, single-page trivia show. No scrolling. Buzz, speak, or tap.

This game used to live inside [GMGbrand](https://github.com/GFix21/GMGbrand) as Jeremy Trivia. It is now its own repository so the studio can stay on one screen.

## Directions & Rules

Open **[directions.html](./directions.html)** (also `/directions`) on its own — it does not go through the lobby. The lobby **Directions & Rules** link lands there; the short Rules modal keeps a **Full directions →** link.

The television is a **web page**, not an AirPlay transmitter. Fast Answer does not send AirPlay, Chromecast, or Smart View from inside the game. The “TV” is whichever screen opens the URL (smart TV browser, Apple TV Safari / AirPlay mirror, Chromecast “Cast tab”, HDMI, Fire TV Silk, etc.).

**Recommended flow:** open https://fast-answer-seven.vercel.app on the big screen → turn **On Screen** on → create/join a room → phones scan the QR or open `/?role=pad&room=CODE`.

1. **Best** — open Fast Answer in the TV’s own browser. Turn **On Screen** on. The set is the host.
2. **AirPlay** — iPhone/Mac Screen Mirroring to Apple TV, or Safari on Apple TV if available. Mirroring works; there is no special Fast Answer AirPlay receiver API.
3. **Chromecast** — Cast the Chrome tab from a laptop. **HDMI** from a laptop is the same idea.

Phones never receive the TV picture. Same Wi‑Fi helps room sync; BroadcastChannel syncs same-origin tabs; serverless rooms sync TV+phones on one Vercel instance. AirPlay can put the show on the set; it does not turn phones into buzzers.


## Lobby

One page. Collapsible menus. Jeremy and the studio stay live behind the card.

- **Profile** — name, email, photo. Karate belt from career points. Bronze / Silver / Gold from the dojo.
- **Dojo** — ten tap questions, no buzz. Adaptive from Hard. Places you for three months. Play stays gated until placement is current.
- **Room** — 2 to 12 seats. You plus celebrity first-name bots (Oprah, Elton, Serena…). **On Screen** opens a TV room; phones join as pads and replace bots.
- **Set** — Jeremy height and studio angle, live on this page.

Discreet **Flow** + © GMG Brand Label sit at the bottom. Flow on GMGbrand stays password-gated.

## Play

- **Single page (On Screen off)** — TV, tablet, or phone shows Jeremy, the question, the answers, and the buzzer together. Drag **Jeremy** and **Studio** to resize. Nothing scrolls.
- **On Screen** — put this page on the television. Jeremy, the question, and the answers stay there. Each player’s phone is a buzzer pad: answers at the top, a large **Buzz** at the bottom. After a buzz they can **speak** the answer or tap A–D.

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
