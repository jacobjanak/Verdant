// Element card definitions.
//
// Elements attach to beasts and grant additional abilities (GAME_DESIGN §7).
// The granted ability is defined inline as a function-based object, exactly
// like a beast's innate abilities — it belongs to this element, not a shared
// ability table.
const { dealDamage, isTree } = require('./combat');

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
        // Fire deals bonus damage to World Trees (GAME_DESIGN §7). dealDamage
        // owns the tier roll; the caster (the beast wearing this element) also
        // supplies any DAMAGE_TIERS override, so e.g. a Lucky beast's bias
        // applies to its Fireball too.
        const bonus = isTree(target) ? 40 : 0;
        return dealDamage(caster, target, 60 + bonus);
      },
    },
  },
};

module.exports = { ELEMENTS };
