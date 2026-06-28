// Turn flow and game setup for the Verdant simulation.
// Kept deliberately simple: one concern per function, minimal branching (CLAUDE.md).

const {
  createCardInstance,
  getOpponentIndex,
  killBeast,
} = require('./GameState');
const {
  STARTING_WORLD_TREE_HEALTH,
  REGEN_PER_TURN,
  STARTING_HAND_SIZE,
  CARDS_DRAWN_PER_TURN,
} = require('./constants');

// Fisher-Yates in-place shuffle.
function shuffle(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

// Draw up to n cards from the top of the deck. Drawing from an empty deck is a no-op
// (no fatigue / deck-out — GAME_DESIGN.md §9).
function drawCards(player, n) {
  for (let i = 0; i < n; i++) {
    if (player.deck.length === 0) break;
    player.hand.push(player.deck.pop());
  }
}

// Pay each beast's maintenance from the World Tree, frontline first then backline, so a
// broke player loses their aggressive position first (GAME_DESIGN.md §5.2). A beast the
// player can't pay for dies (and its elements go with it).
function payMaintenance(player) {
  const beasts = [...player.frontline, ...player.backline]; // snapshot before any deaths
  beasts.forEach((beast) => {
    if (player.worldTreeHealth >= beast.maintenanceCost) {
      player.worldTreeHealth -= beast.maintenanceCost;
    } else {
      killBeast(player, beast);
    }
  });
}

// Called at the start of each turn for the current player.
function startTurn(state) {
  const player = state.players[state.currentPlayerIndex];

  // 1. Regenerate the World Tree (capped at its starting size). The World Tree is a
  //    single shared power/health pool (GAME_DESIGN.md §4.1).
  player.worldTreeHealth = Math.min(
    STARTING_WORLD_TREE_HEALTH,
    player.worldTreeHealth + REGEN_PER_TURN
  );

  // 2. Pay maintenance for all beasts (unpaid beasts die).
  payMaintenance(player);

  // 3. Draw for the turn.
  drawCards(player, CARDS_DRAWN_PER_TURN);

  // 4. Reset each surviving beast's action for the new turn.
  [...player.frontline, ...player.backline].forEach((beast) => {
    beast.hasActed = false;
  });
}

// Switch to the other player and begin their turn. (The {success}-returning action wrapper
// that also handles the pre-game mulligan phase lives in actions.js.)
function endTurn(state) {
  state.currentPlayerIndex = getOpponentIndex(state.currentPlayerIndex);
  state.turnNumber += 1;
  startTurn(state);
}

// Build a deck of card instances from a list of card ids (or pass-through instances).
function toInstances(deck) {
  return deck.map((card) => (typeof card === 'string' ? createCardInstance(card) : card));
}

// Set up a new game: shuffle both decks, deal opening hands, and enter the mulligan phase.
function initializeGame(state, deck1, deck2) {
  state.players[0].deck = shuffle(toInstances(deck1));
  state.players[1].deck = shuffle(toInstances(deck2));
  drawCards(state.players[0], STARTING_HAND_SIZE);
  drawCards(state.players[1], STARTING_HAND_SIZE);
  state.currentPlayerIndex = 0;
  state.turnNumber = 1;
  state.phase = 'mulligan';
  return state;
}

module.exports = {
  shuffle,
  drawCards,
  payMaintenance,
  startTurn,
  endTurn,
  initializeGame,
};
