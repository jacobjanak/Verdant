// Beast card definitions.
//
// Abilities are defined INLINE on each beast as function-based objects
// (`canUse` / `use`). They are specific to the beast — not shared, reusable
// entries in a lookup table — and the function form lets each card do whatever
// it needs without us inventing a new hardcoded property for every effect. This
// is what scales to thousands of unique cards.
//
// Abilities don't roll damage tiers themselves: they just hand a base damage to
// `dealDamage`, which owns the roll + multiplier. A card customizes how its
// hits roll by overriding a global (e.g. `DAMAGE_TIERS`) ON ITSELF, derived
// from the global value. See docs/MECHANICS.md.
const { DAMAGE_TIERS } = require('../constants');
const { dealDamage } = require('../combat');

const BEASTS = {
  bear: {
    type: 'beast',
    id: 'bear',
    name: 'Bear',
    latinName: 'Ursus arctos',
    playCost: 50,
    maintenanceCost: 10,
    maxHealth: 200,
    abilities: [
      {
        name: 'Maul',
        cost: 15,
        passive: false,
        canUse: (state, caster, target) => target != null,
        use: (state, caster, target) => dealDamage(caster, target, 80),
      },
    ],
  },

  rabbit: {
    type: 'beast',
    id: 'rabbit',
    name: 'Rabbit',
    latinName: 'Oryctolagus cuniculus',
    playCost: 20,
    maintenanceCost: 5,
    maxHealth: 80,

    // "Lucky" passive (GAME_DESIGN §11): Rabbit rolls on its own damage-tier
    // table, which makes criticals more likely. It's a plain override defined
    // ON THE CARD — combat.dealDamage checks `caster.DAMAGE_TIERS` before the
    // global table, so simply having this property here is what activates the
    // passive (no hook to wire up, nothing to "call"). We DERIVE it from the
    // global table by tripling critical's weight rather than hardcoding numbers,
    // so it can't drift out of sync if the base table is retuned. This is the
    // general pattern for per-card overrides — see docs/MECHANICS.md.
    DAMAGE_TIERS: DAMAGE_TIERS.map((tier) =>
      tier.name === 'critical' ? { ...tier, weight: tier.weight * 3 } : tier
    ),

    abilities: [
      {
        name: 'Nibble',
        cost: 5,
        passive: false,
        canUse: (state, caster, target) => target != null,
        use: (state, caster, target) => dealDamage(caster, target, 20),
      },
    ],
  },
};

module.exports = { BEASTS };
