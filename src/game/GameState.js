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

  // Shallow-copy every template field, then overwrite `id` with a unique
  // instance id and tag the originating `cardId`. Functions (abilities,
  // grantsAbility) and override tables (DAMAGE_TIERS) are immutable, so sharing
  // the references the spread copied is safe and cheap. Only the per-copy
  // MUTABLE fields below need fresh values.
  const instance = {
    ...template,
    id: `${cardId}_${++instanceCounter}`,
    cardId,
  };

  if (template.type === 'beast') {
    instance.health = template.maxHealth; // current health; damage persists across turns
    instance.elements = []; // element instances attached in play
    instance.hasActed = false; // used its action this turn?
  }

  return instance;
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

// --- Shared lookup/mutation helpers -----------------------------------------
// Small, allocation-light helpers used by the actions and turn-flow layers
// (actions.js, turnFlow.js). Kept here next to the state they operate on so
// every layer agrees on how to find and remove beasts.

// Two-player game: the opponent is always the other index.
function getOpponentIndex(playerIndex) {
  return playerIndex === 0 ? 1 : 0;
}

// Find a beast instance owned by `player` (in either zone) by its instance id.
// Returns undefined if it isn't in play.
function findBeastInPlay(player, beastId) {
  return (
    player.frontline.find((b) => b.id === beastId) ||
    player.backline.find((b) => b.id === beastId)
  );
}

// Which zone a beast currently occupies for `player`: 'frontline', 'backline',
// or null if it isn't in play.
function getBeastZone(player, beast) {
  if (player.frontline.includes(beast)) return 'frontline';
  if (player.backline.includes(beast)) return 'backline';
  return null;
}

// Remove a beast from play and send it to the graveyard. Its attached elements
// ride along on `beast.elements` and go to the graveyard with it (GAME_DESIGN
// §7). No-op if the beast isn't actually in play.
function killBeast(player, beast) {
  const zone = getBeastZone(player, beast);
  if (!zone) return;
  player[zone].splice(player[zone].indexOf(beast), 1);
  player.graveyard.push(beast);
}

module.exports = {
  GameState,
  createPlayer,
  createCardInstance,
  // Combat helpers re-exported for convenience (defined in combat.js).
  rollDamageTier,
  calculateDamage,
  // Shared lookup/mutation helpers.
  getOpponentIndex,
  findBeastInPlay,
  getBeastZone,
  killBeast,
};
