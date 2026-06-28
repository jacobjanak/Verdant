# Verdant — Game Design (North Star)

> **For agents:** This is the authoritative vision document for Verdant. Read it before
> making design or gameplay decisions. When a request conflicts with this document, surface
> the conflict rather than silently deviating. When this document is silent on a detail,
> prefer the choice that best serves the **Design Pillars** below, and flag the assumption.
> Items marked **[OPEN]** are unresolved — ask the user before hard-coding them.

## 1. Concept

Verdant is an online trading card game (TCG) in the spirit of *Magic: The Gathering*, with
ability-driven creatures closer to the *Pokémon TCG*. Two druids battle by summoning beasts,
infusing them with elements, and attacking each other's **World Tree**.

## 2. Design Pillars

These are the tie-breakers for every design decision.

1. **Beasts + elements are the core loop.** The game is about playing beasts and upgrading
   them with elements. Everything else is supporting cast.
2. **Simulation-first.** The engine must let a computer play thousands of games per second.
   No computationally expensive mechanics. Cards will eventually be balanced by millions of
   self-play games, so deterministic-fast simulation is a hard constraint.
3. **Reward thoughtful play, punish mindless aggro.** Avoid degenerate "dump cheap beasts
   and swing at the tree" strategies. Depth comes from beast/element combinations.
4. **Spells are utility, not power.** Spells provide flexibility (healing, bounce, buffs).
   They rarely deal direct damage — that is not what druids do.

## 3. Lore

Two druids battle in a massive open field within a dense forest in a magic realm. Druids draw
power from their **World Trees**. They summon animals and infuse them with elements to grant
powers, and can cast some spells themselves — but unlike mages, they rarely deal direct
damage. They focus on summoning and supporting beasts.

The beasts attack the opposing druid's World Tree. When a World Tree is destroyed, its owner
is banished back to the earthly realm (that player loses).

Though set in a forest world, druids can summon any real-world animal — fish, penguins, etc.
Non-forest creatures are summoned inside a sustaining **orb** (an orb of water for fish, an
orb of arctic conditions for penguins, and so on). These orbs cost more power to summon and
maintain, but confer combat benefits tied to their element.

## 4. Core Components

### 4.1 World Tree
- Each player has one World Tree. It is **both their resource pool (power) and their health
  meter** — a **single shared pool**.
- **Spending power lowers your health.** Every summon, ability, and spell makes you more
  vulnerable. This is the central tension of the economy: tempo now vs. survivability later.
- The World Tree sits permanently on the **backline**.
- Destroying the opponent's World Tree (reducing the pool to 0) wins the game.
- **Regeneration:** the pool **does replenish over time**, so the shared-pool economy is not a
  pure death-spiral — but players must stay wary of overspending. Key balance invariant:
  **1 unit of power spent should, if uncontested, deal far more than 1 unit of damage to the
  opponent.** That asymmetry is what makes pressing the attack worthwhile despite the cost.
  (Exact per-turn regen amount and starting pool size are **tuning values**, set later.)

### 4.2 Zones: Frontline & Backline
Each player controls a frontline and a backline.

| Zone | Can attack | Notes |
|------|-----------|-------|
| Backline | Opponent's **frontline** only | Beasts enter play here |
| Frontline | Opponent's **backline** or **World Tree** | Aggressive position |

- Beasts always **enter on the backline**.
- A beast may **move** between frontline and backline, but doing so **consumes its action for
  the turn** (it cannot also use a non-passive ability that turn — see §5.3).

### 4.3 Card Types
1. **Beasts** — creatures (see §5).
2. **Elements** — upgrades attached to beasts to unlock/enhance abilities (see §6).
3. **Spells** — one-time effects (see §7).

## 5. Beasts

Beasts are the equivalent of *Magic*'s creatures, but use abilities like the *Pokémon TCG*
rather than a generic attack stat.

### 5.1 Species identity
- Beasts are based on **real Earth species**. A card named "Fox" is tied to a *specific*
  species of fox; different fox species can share a common name but have different
  attributes/abilities.
- Some beasts use specific names (e.g. "Polar Bear") instead of generic ones ("Bear").

### 5.2 Beast properties
- **Play cost** — power to summon.
- **Maintenance cost** — power paid per turn to keep it in play. **If a player cannot (or
  does not) pay a beast's maintenance, that beast dies (is sacrificed).** This caps how much
  a druid can field given the shared power/health pool (§4.1).
- **Health** — large numbers (see §9). Damage **persists across turns** (no end-of-turn heal).
- **Abilities** — at least one default ability; more unlocked via elements.

### 5.3 Actions per turn
On a player's turn, each of their beasts may **either**:
- use **one non-passive ability**, **or**
- **move** between frontline and backline.

Passive abilities do not count as the beast's action.

## 6. Abilities

- Abilities are attacks, power-ups, and other effects. Some are **passive** (always on, never
  "played"); others are **active** (cost power, use the beast's action).
- By default, an active ability may target **any enemy beast or the World Tree**, subject to
  the frontline/backline targeting rules in §4.2.
- Active abilities generally cost **World Tree power**; costs and effects vary per ability.
- A beast gains additional abilities by being enhanced with elements (§7). Element-granted
  abilities have **two costs**: a one-time cost to **attach** the ability to the beast, and a
  recurring cost to **use** it (§7).

## 7. Elements

- Elements attach to beasts to enhance them and unlock additional abilities.
- Example: attaching a **fireball** element to a bear unlocks a fire ability that may deal
  bonus damage to World Trees.
- Elements are central to the core loop (see Pillar 1).
- **Unlimited elements per beast** — there is no cap on how many a beast can carry.
- **Elements are permanent once attached:** they **cannot be removed or moved**.
- **On death, a beast's elements go to the graveyard with it.**
- **Two-part cost model per ability:** each ability an element grants has (a) a cost to
  **attach** it to the beast, and (b) a cost to **use** it each time (§6). Both are paid from
  the World Tree power pool.

## 8. Spells

- One-time effects for a one-time cost: healing, bounce (return a beast to its owner's hand),
  buffs, etc.
- Spells **rarely deal direct damage** (Pillar 4); when they do, it should be weak/situational.
- Spells are utility, not a primary win path.

## 9. Turn & Timing Rules

- **Sorcery-speed only.** Players act **only on their own turn** — no exceptions. There are
  **no instants / no responses on the opponent's turn**, and no opponent-turn spells.
- Within their own turn, a player may take any actions **in any order** they choose.
- **Opening hand:** each player starts with **7 cards**.
- **Mulligan:** a player may mulligan **once** — discard the opening hand and draw **7 new
  cards**. The new hand is final (no further mulligans, no card selection).
- **Draw:** a player **draws 1 card at the start of each of their turns**.
- **Deck construction:** minimum **47 cards**; at most **4 copies** of any single card.
- **Ending a turn:** a player ends their turn with an **explicit "end turn" action**, takeable
  at any time (even with power and cards remaining — e.g. to bank power against regen).
- **Empty deck:** drawing from an empty deck has **no penalty** — the draw is simply skipped.
  There is no fatigue and no deck-out loss; the **only** loss condition is World Tree
  destruction (§4.1).

## 10. Combat Math & Randomness

- Numbers are **much larger** than typical card games (a creature with 5 health in *Magic*
  has ~500 in Verdant). This exists purely to give balancing headroom.
- **All damage has built-in randomness** so players don't grind exact math every turn and so
  outcomes are slightly unpredictable. Every attack rolls one of these tiers, each with a
  damage multiplier and a weighted probability (some far more likely than others):

  | Tier | Multiplier (starting point) | Relative likelihood (intent) |
  |------|-----------------------------|------------------------------|
  | Very weak | 0.75 | uncommon |
  | Weak | 0.875 | common |
  | Normal | 1.0 | most common |
  | Effective | 1.125 | common |
  | Super effective | 1.25 | uncommon |
  | Critical | 2.0 | **rare** (the only super-rare tier) |

  Probabilities should be **fairly even but weighted toward the middle tiers**, with Critical
  (2×) clearly the rarest. These multipliers and weights are **placeholders to fine-tune
  later**.

## 11. Worked Example (canonical gameplay)

1. **Turn 1:** Play a Bear, move it to the frontline, enhance it with the Fireball element.
2. **Turn 2:** Attack the opponent's World Tree with the Bear's fireball ability (bonus damage
   to World Trees because it's fire). Play a Beaver, move it to the frontline. Beavers have a
   base ability with increased damage to trees. The opponent's tree is now under pressure.
3. **Turn 3:** Opponent develops beasts to threaten yours. You play a Penguin and move it to
   the frontline, planning to use its base **Blizzard** ability next turn for serious damage —
   an expensive summon + attack, but worth it.
4. **Later:** Play a Rabbit, whose passive **Lucky** ability significantly increases its
   critical-strike chance.

## 12. Development Principles (engineering constraints)

- **Fast self-play is non-negotiable.** The engine must simulate thousands of games in
  seconds; nothing computationally expensive. Future balancing relies on millions of
  self-play games.
- **Core loop = beasts + elements.** Design and tune toward this; treat spells and direct
  damage as secondary.
- **No degenerate aggro.** Cheap-beast-rush at the World Tree should not be a reliable win.

## 13. Tech (current state)

- Node.js project, `type: commonjs`. Entry point `src/server.js` (basic Express server).
- See `package.json` for scripts (`npm start`, `npm run dev`). No tests yet.
- **Near-term priority: the simulation engine first.** Build a pure, fast, headless
  game-logic core (rules + self-play) before UI or networking. This directly serves the
  simulation-first pillar (§2.2) and the future plan to balance cards via millions of
  self-play games. The existing Express server is scaffolding; online play comes later.
- **[OPEN]** Networking / multiplayer model (real-time vs. async, matchmaking) — deferred
  until the engine exists.

## 14. Open Questions (resolve with the user)

**Resolved (2026-06-27):**
- **Resource model** → Shared pool: power and health are one number; spending power lowers
  health (§4.1).
- **Card draw** → Start with 7; draw 1 at the start of each turn (§9).
- **Maintenance failure** → Unpaid beast dies / is sacrificed (§5.2).
- **Architecture priority** → Simulation engine first, then UI/networking (§13).
- **Regeneration** → Pool replenishes each turn; balance invariant = 1 power spent yields
  >>1 damage if uncontested. Exact amount is a tuning value (§4.1).
- **Deck rules** → Min 47 cards, max 4 copies of a card (§9).
- **Damage tiers** → 0.75 / 0.875 / 1.0 / 1.125 / 1.25 / 2.0, weighted toward the middle,
  Critical rarest; placeholders to tune (§10).
- **Element rules** → Unlimited per beast; permanent (no remove/move); die with the beast;
  two-part cost per ability (attach + use) (§6, §7).

- **Empty deck** → No penalty; draw is skipped; only loss condition is World Tree
  destruction (§9).
- **Turn boundary** → Explicit "end turn" action, takeable at any time (§9).
- **Mulligan** → Once, redraw 7, hand is final (§9).

**Still open:**
1. **Tuning values** — exact per-turn regen, starting pool size, damage-tier weights (§4.1,
   §10). Deferred to the balancing phase.
2. **Networking/multiplayer model** — Deferred until the engine exists (§13).

_When an [OPEN] item is resolved, move it to "Resolved" above and update its section._
