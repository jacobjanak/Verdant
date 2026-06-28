// Spell card definitions.
//
// Spells are one-time utility effects (GAME_DESIGN §8, Pillar 4) — healing,
// bounce, buffs — and rarely deal direct damage. Each spell's effect is an
// inline, function-based `use` so it can do whatever it needs.
const SPELLS = {
  heal: {
    type: 'spell',
    id: 'heal',
    name: 'Healing Light',
    cost: 20,
    passive: false,
    // Heal a friendly beast back toward its max health.
    canUse: (state, caster, target) => target != null && target.type === 'beast',
    use: (state, caster, target) => {
      const healAmount = 50;
      const before = target.health;
      target.health = Math.min(target.maxHealth, target.health + healAmount);
      return { healed: target.health - before };
    },
  },
};

module.exports = { SPELLS };
