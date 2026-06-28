// Shared combat helpers. Card abilities live in beasts.js / elements.js /
// spells.js and call into these; keeping them here (deps: constants only)
// avoids a circular require with the card-definition files.
const { DAMAGE_TIERS } = require('./constants');

// Weighted random damage tier. Pass a reweighted tiers table (e.g. the one a
// passive like Lucky produces) to bias the roll; defaults to the base table.
// Critical is just another tier here — nothing about it is special-cased.
function rollDamageTier(tiers = DAMAGE_TIERS) {
  let totalWeight = 0;
  for (const tier of tiers) totalWeight += tier.weight;

  let roll = Math.random() * totalWeight;
  for (const tier of tiers) {
    if (roll < tier.weight) return tier;
    roll -= tier.weight;
  }

  // Floating-point safety net: fall back to the normal (1.0x) tier.
  return tiers.find((t) => t.name === 'normal') || tiers[0];
}

// Apply a tier's multiplier to a base damage value, rounded to an integer.
function calculateDamage(baseDamage, tier) {
  return Math.round(baseDamage * tier.multiplier);
}

// True if the target is a player's World Tree (a player object) rather than a
// beast. Used by abilities that treat the tree differently (e.g. fire bonus).
function isTree(target) {
  return target != null && target.worldTreeHealth !== undefined;
}

// Deal damage to any target with a health-like field: a beast (`health`) or a
// player's World Tree (`worldTreeHealth`). Returns the damage dealt.
function dealDamage(target, amount) {
  if (target == null) return 0;
  if (isTree(target)) target.worldTreeHealth -= amount;
  else target.health -= amount;
  return amount;
}

module.exports = { rollDamageTier, calculateDamage, isTree, dealDamage };
