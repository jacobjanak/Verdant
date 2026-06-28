// Beast card definitions.
//
// Abilities are defined INLINE on each beast as function-based objects
// (`canUse` / `use`, or a passive hook). They are specific to the beast — not
// shared, reusable entries in a lookup table — and the function form lets each
// card do whatever it needs without us inventing a new hardcoded property for
// every effect. This is what scales to thousands of unique cards.
const { rollDamageTier, calculateDamage, dealDamage } = require('./combat');

const BEASTS = {
  bear: {
    type: 'beast',
    id: 'bear',
    name: 'Bear',
    playCost: 50,
    maintenanceCost: 10,
    maxHealth: 200,
    abilities: [
      {
        name: 'Maul',
        cost: 15,
        passive: false,
        canUse: (state, caster, target) => target != null,
        use: (state, caster, target) => {
          const damage = calculateDamage(80, rollDamageTier());
          dealDamage(target, damage);
          return { damage };
        },
      },
    ],
  },

  rabbit: {
    type: 'beast',
    id: 'rabbit',
    name: 'Rabbit',
    playCost: 20,
    maintenanceCost: 5,
    maxHealth: 80,
    abilities: [
      {
        name: 'Nibble',
        cost: 5,
        passive: false,
        canUse: (state, caster, target) => target != null,
        use: (state, caster, target) => {
          const damage = calculateDamage(20, rollDamageTier());
          dealDamage(target, damage);
          return { damage };
        },
      },
      {
        name: 'Lucky',
        passive: true,
        // Passive hook: reweights the damage-tier table to make criticals more
        // likely (GAME_DESIGN §11). Critical stays "just a tier with a
        // multiplier" — Lucky only raises its weight, it adds no special bonus.
        modifyDamageTiers: (tiers) =>
          tiers.map((t) => (t.name === 'critical' ? { ...t, weight: t.weight * 3 } : t)),
      },
    ],
  },
};

module.exports = { BEASTS };
