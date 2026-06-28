# Mechanics: how cards customize global behavior

This game will have **thousands of unique cards**, and many of them bend a global
rule slightly: a beast that crits more often, an element that ignores armor, a
spell that draws an extra card. We need one consistent way to express "this card
changes global behavior X" that stays fast and never drifts out of sync with the
global definition. This doc is that pattern.

## The pattern: per-card overrides, derived from globals

1. **Global rules live in one place** (`src/game/constants.js`, helpers in
   `src/game/combat.js`). That is the single source of truth.

2. **A card that bends a rule defines an override property ON ITSELF**, named the
   same as the global it replaces (e.g. a `DAMAGE_TIERS` property on the card).

3. **The shared helper checks the actor for an override before falling back to
   the global.** For damage, `combat.dealDamage` uses
   `caster.DAMAGE_TIERS || DAMAGE_TIERS`. Just *having* the property on the card
   activates the behavior — there is no hook to register and nothing to "call."

4. **Derive the override from the global; never hardcode the values.** Build it
   by `map`-ing over the global and *multiplying* (or otherwise transforming) the
   existing entries. If you copy-paste literal numbers, retuning the global table
   silently leaves your card behind. Deriving means the card moves with it.

### Worked example — Rabbit's "Lucky" passive

Lucky makes the Rabbit crit more often. Instead of a special-case code path, the
Rabbit carries its own damage-tier table, derived from the global one by tripling
critical's weight (`src/game/cards/beasts.js`):

```js
DAMAGE_TIERS: DAMAGE_TIERS.map((tier) =>
  tier.name === 'critical' ? { ...tier, weight: tier.weight * 3 } : tier
)
```

`createCardInstance` shallow-copies template fields onto the instance, so the
override rides along onto every Rabbit in play. When that Rabbit attacks,
`dealDamage(caster, target, baseDamage)` sees `caster.DAMAGE_TIERS` and rolls on
the Rabbit's table. Every other beast has no such property and rolls on the
global table. Critical is still "just a tier with a multiplier" — Lucky only
reweights it.

## Where the damage pipeline lives

Card abilities do **not** roll tiers or compute multipliers themselves. They hand
a base damage to `dealDamage`, which owns the full pipeline (pick tier table →
roll tier → apply multiplier → subtract health) and returns `{ damage, tier }`:

```js
use: (state, caster, target) => dealDamage(caster, target, 80)
```

Keeping that logic in one helper means a new attacking card is a one-liner, and
overrides like Lucky are applied uniformly to every source of damage (a beast's
innate attack *and* any element ability it casts).

## Rule of thumb for future cards

> To change a global rule for one card: add a same-named override property to the
> card, **derived** from the global value, and make the shared helper prefer the
> card's value over the global. Don't add a new bespoke property per effect, and
> don't hardcode values that already exist globally.
