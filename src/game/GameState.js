const { STARTING_WORLD_TREE_HEALTH } = require('./constants');
const { CARD_TEMPLATES } = require('./cards');
const { rollDamageTier, calculateDamage } = require('./combat');

// Monotonic counter for unique card instance ids. Cheap and fast — we run
// thousands of self-play games, so we avoid UUIDs and other allocation-heavy
// id schemes.
let instanceCounter = 0;

// Create a concrete in-game card instance from a template.
//
// Why instances at all (and not just use the template directly)? The same card
// can be in play multiple times at once — two Bears, say — and each copy needs
// its OWN mutable state: current health, the elements attached to it, whether
// it has acted this turn, and a unique id so abilities can target it. The
// template is the shared, immutable definition; mutating it would clobber every
// copy. So templates stay frozen-in-spirit and we spin up a lightweight plain
// object (no class hierarchy) per copy. Ability definitions, by contrast, are
// immutable functions, so instances just reference the template's abilities.
function createCardInstance(cardId) {
  const template = CARD_TEMPLATES[cardId];
  if (!template) throw new Error(`Unknown cardId: ${cardId}`);

  const id = `${cardId}_${++instanceCounter}`;

  if (template.type === 'beast') {
    return {
      type: 'beast',
      id,
      cardId,
      name: template.name,
      playCost: template.playCost,
      maintenanceCost: template.maintenanceCost,
      maxHealth: template.maxHealth,
      health: template.maxHealth, // current health; damage persists across turns
      abilities: template.abilities, // immutable fn defs — safe to share
      elements: [], // element instances attached in play
      hasActed: false, // used its action this turn?
    };
  }

  if (template.type === 'element') {
    return {
      type: 'element',
      id,
      cardId,
      name: template.name,
      attachCost: template.attachCost,
      grantsAbility: template.grantsAbility, // immutable fn def — safe to share
    };
  }

  if (template.type === 'spell') {
    return {
      type: 'spell',
      id,
      cardId,
      name: template.name,
      cost: template.cost,
      canUse: template.canUse,
      use: template.use,
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
  // Combat helpers re-exported for convenience (defined in combat.js).
  rollDamageTier,
  calculateDamage,
};
