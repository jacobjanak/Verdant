// Element card definitions.
//
// Elements attach to beasts and grant additional abilities (GAME_DESIGN §7).
// The granted ability is defined inline as a function-based object, exactly
// like a beast's innate abilities — it belongs to this element, not a shared
// ability table.
const { rollDamageTier, calculateDamage, dealDamage, isTree } = require('./combat');

const ELEMENTS = {
  fireball: {
    type: 'element',
    id: 'fireball',
    name: 'Fireball',
    attachCost: 30,
    grantsAbility: {
      name: 'Fireball',
      cost: 25,
      passive: false,
      canUse: (state, caster, target) => target != null,
      use: (state, caster, target) => {
        // Fire deals bonus damage to World Trees (GAME_DESIGN §7).
        const bonus = isTree(target) ? 40 : 0;
        const damage = calculateDamage(60 + bonus, rollDamageTier());
        dealDamage(target, damage);
        return { damage };
      },
    },
  },
};

module.exports = { ELEMENTS };
