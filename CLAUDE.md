# Verdant

Verdant is an online trading card game (TCG) — two druids battle by summoning beasts,
upgrading them with elements, and attacking each other's World Tree.

## Read this first

**[GAME_DESIGN.md](./GAME_DESIGN.md) is the North Star.** It is the authoritative vision for
gameplay and design. Read it before making any design or gameplay decision. When a request
conflicts with it, surface the conflict. When it's silent, follow its **Design Pillars** and
flag your assumption. Items marked **[OPEN]** in that doc are unresolved — ask before
hard-coding them.

## Design pillars (summary — full text in GAME_DESIGN.md §2)

1. Beasts + elements are the core loop.
2. Simulation-first: must run thousands of self-play games per second; nothing expensive.
3. Reward thoughtful play; punish mindless aggro.
4. Spells are utility, not power.

## Tech

- Node.js, `type: commonjs`. Entry: `src/server.js` (basic Express server).
- `npm start` / `npm run dev`. No test suite yet.
