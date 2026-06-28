// Ability lookup. Abilities are referenced by id from beasts (innate) and from
// elements (granted via grantsAbility). Passive abilities never attack; they
// only modify rolls/stats.
const ABILITIES = {
  maul: {
    name: 'Maul',
    cost: 15,
    baseDamage: 80,
    canTargetTree: true,
    passive: false,
  },
  nibble: {
    name: 'Nibble',
    cost: 5,
    baseDamage: 20,
    canTargetTree: true,
    passive: false,
  },
  fireball_attack: {
    name: 'Fireball',
    cost: 25,
    baseDamage: 60,
    bonusTreeDamage: 40, // extra damage to World Trees
    canTargetTree: true,
    passive: false,
  },
  lucky: {
    name: 'Lucky',
    passive: true,
    critBonus: 0.1, // +10% crit chance
  },
};

module.exports = { ABILITIES };
