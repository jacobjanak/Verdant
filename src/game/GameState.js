const { STARTING_WORLD_TREE_HEALTH, DAMAGE_TIERS } = require('./constants');
const { CARD_TEMPLATES } = require('./cards');

// Monotonic counter for unique card instance ids. Cheap and fast — we run
// thousands of self-play games, so we avoid UUIDs and other allocation-heavy
// id schemes.
let instanceCounter = 0;

// Create a concrete in-game card instance from a template. Returns a plain
// object (no class hierarchy) sized to the card's type.
function createCardInstance(cardId) {
  const template = CARD_TEMPLATES[cardId];
  if (!template) throw new Error(`Unknown cardId: ${cardId}`);

  const id = `${cardId}_${String(++instanceCounter).padStart(2, '0')}`;

  if (template.type === 'beast') {
    return {
      type: 'beast',
      id,
      cardId,
      name: template.name,
      playCost: template.playCost,
      maintenanceCost: template.maintenanceCost,
      maxHealth: template.maxHealth,
      health: template.maxHealth, // current health (for in-play beasts)
      abilities: [...template.abilities], // ability ids
      elements: [], // attached element ids (for in-play beasts)
      hasActed: false, // used this turn?
    };
  }

  if (template.type === 'element') {
    return {
      type: 'element',
      id,
      cardId,
      name: template.name,
      attachCost: template.attachCost,
      grantsAbility: template.grantsAbility,
    };
  }

  if (template.type === 'spell') {
    return {
      type: 'spell',
      id,
      cardId,
      name: template.name,
      cost: template.cost,
      effect: template.effect,
      healAmount: template.healAmount,
    };
  }

  throw new Error(`Unknown card type for ${cardId}: ${template.type}`);
}

// Build a fresh player. Beasts enter the backline; the frontline holds beasts
// pushed forward to fight.
function createPlayer() {
  return {
    worldTreeHealth: STARTING_WORLD_TREE_HEALTH,
    hand: [],
    deck: [],
    graveyard: [],
    backline: [],
    frontline: [],
    hasMulliganed: false,
  };
}

// Weighted random damage tier. critBonus (e.g. from the Lucky ability) adds
// extra weight to the critical tier, raising its share of the roll.
function rollDamageTier(critBonus = 0) {
  let totalWeight = 0;
  for (const tier of DAMAGE_TIERS) totalWeight += tier.weight;

  const extraCritWeight = critBonus * totalWeight;
  let roll = Math.random() * (totalWeight + extraCritWeight);

  for (const tier of DAMAGE_TIERS) {
    const weight = tier.name === 'critical' ? tier.weight + extraCritWeight : tier.weight;
    if (roll < weight) return tier;
    roll -= weight;
  }

  // Floating-point safety net — return the last tier.
  return DAMAGE_TIERS[DAMAGE_TIERS.length - 1];
}

// Apply a tier's multiplier to a base damage value, rounded to an integer.
function calculateDamage(baseDamage, tier) {
  return Math.round(baseDamage * tier.multiplier);
}

// Single object holding all game state. Kept flat and mutable for speed.
class GameState {
  constructor() {
    this.players = [createPlayer(), createPlayer()];
    this.currentPlayerIndex = 0;
    this.turnNumber = 1;
    this.phase = 'playing'; // 'playing' | 'gameOver'
    this.winner = null;
  }
}

module.exports = {
  GameState,
  createPlayer,
  createCardInstance,
  rollDamageTier,
  calculateDamage,
};
