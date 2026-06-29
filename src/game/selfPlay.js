// Headless self-play runner for the Verdant simulation (Issue #5).
//
// This drives the rules engine with uniformly random legal moves. It exercises
// the action layer end to end and is the foundation for the simulation-first
// pillar (GAME_DESIGN.md §2.2): we want to run thousands of games per second to
// validate the rules and, later, tune the card numbers.
//
// It is purely additive — it imports the existing engine (GameState, turnFlow,
// actions) and never reaches inside it. The move generator (`getLegalActions`)
// and the action functions are the engine's public surface; this file just
// picks a legal action at random and dispatches it.

const { GameState } = require('./GameState');
const { initializeGame } = require('./turnFlow');
const {
  playBeast,
  attachElement,
  castSpell,
  moveBeast,
  useAbility,
  endTurn,
  mulligan,
  getLegalActions,
} = require('./actions');

// Loop-iteration cap so a pathological random game (e.g. neither player ever
// fields a beast that can reach the other) can't spin forever. Random games
// finish in ~150 actions in practice, so this only ever fires as a safety net
// and a hit is reported as a draw, not a win.
const DEFAULT_MAX_TURNS = 2000;

// A reasonable mixed test deck (47 cards): enough beasts to keep the board
// populated plus a few elements and spells so every action path gets exercised.
// Entries are card ids — turnFlow.toInstances turns them into instances when the
// game is initialized.
function createTestDeck() {
  const deck = [];
  for (let i = 0; i < 15; i++) deck.push('bear');
  for (let i = 0; i < 15; i++) deck.push('rabbit');
  for (let i = 0; i < 10; i++) deck.push('fireball');
  for (let i = 0; i < 7; i++) deck.push('heal');
  return deck;
}

// Aquatic-themed deck: 8 unique species, each appearing 4 times, plus spells.
function createAquaticDeck() {
  const beasts = ['shark', 'octopus', 'dolphin', 'jellyfish', 'crab', 'electric_eel', 'sea_turtle', 'anglerfish'];
  const deck = [];
  for (let i = 0; i < 4; i++) beasts.forEach((id) => deck.push(id));
  for (let i = 0; i < 8; i++) deck.push('fireball');
  for (let i = 0; i < 8; i++) deck.push('heal');
  return deck;
}

// Cat-themed deck: 8 unique felines, each appearing 4 times, plus spells.
function createCatDeck() {
  const beasts = ['lion', 'tiger', 'cheetah', 'leopard', 'lynx', 'house_cat', 'serval', 'caracal'];
  const deck = [];
  for (let i = 0; i < 4; i++) beasts.forEach((id) => deck.push(id));
  for (let i = 0; i < 8; i++) deck.push('fireball');
  for (let i = 0; i < 8; i++) deck.push('heal');
  return deck;
}

// Dispatch a single legal action object (as produced by getLegalActions) to the
// matching action function. The acting player is always the current player, so
// we don't trust a playerIndex off the action object except for mulligan, where
// getLegalActions already stamps it. Returns the action functions' usual
// { success, error } result.
function executeAction(state, action) {
  const playerIndex = state.currentPlayerIndex;
  switch (action.type) {
    case 'playBeast':
      return playBeast(state, playerIndex, action.cardId);
    case 'attachElement':
      return attachElement(state, playerIndex, action.cardId, action.targetBeastId);
    case 'castSpell':
      return castSpell(state, playerIndex, action.cardId, action.targetBeastId);
    case 'moveBeast':
      return moveBeast(state, playerIndex, action.beastId);
    case 'useAbility':
      return useAbility(state, playerIndex, action.beastId, action.abilityIndex, action.targetId);
    case 'mulligan':
      return mulligan(state, action.playerIndex);
    case 'endTurn':
      return endTurn(state, playerIndex);
    default:
      throw new Error(`Unknown action type: ${action.type}`);
  }
}

// Play one complete game between two decks, choosing a uniformly random legal
// action each step until someone wins or the iteration cap is hit. Mulligans
// happen organically: getLegalActions offers a `mulligan` action during the
// pre-game phase, so it's taken ~half the time under random play.
//
// Returns { winner, turnCount, finalState }:
//   winner    — winning player index (0 or 1), or null on a cap-hit draw.
//   turnCount — number of actions executed (loop iterations).
//   finalState— the GameState at the end, for inspection.
function playGame(deck1, deck2, options = {}) {
  const maxTurns = options.maxTurns || DEFAULT_MAX_TURNS;
  const state = new GameState();
  initializeGame(state, deck1, deck2);

  let turnCount = 0;
  while (state.phase !== 'gameOver' && turnCount < maxTurns) {
    const legal = getLegalActions(state);
    if (legal.length === 0) break; // defensive: endTurn is always legal mid-game
    const action = legal[Math.floor(Math.random() * legal.length)];
    executeAction(state, action);
    turnCount++;
  }

  return { winner: state.winner, turnCount, finalState: state };
}

// Run many games with fresh test decks and aggregate the outcomes. This is the
// simulation harness proper — a quick way to sanity-check that games terminate
// and to eyeball the win distribution.
function runBatch(numGames, options = {}) {
  const stats = {
    numGames,
    player1Wins: 0,
    player2Wins: 0,
    draws: 0,
    totalTurns: 0,
  };

  for (let i = 0; i < numGames; i++) {
    const { winner, turnCount } = playGame(createAquaticDeck(), createCatDeck(), options);
    if (winner === 0) stats.player1Wins++;
    else if (winner === 1) stats.player2Wins++;
    else stats.draws++;
    stats.totalTurns += turnCount;
  }

  stats.averageTurns = numGames > 0 ? stats.totalTurns / numGames : 0;
  return stats;
}

module.exports = {
  createTestDeck,
  createAquaticDeck,
  createCatDeck,
  executeAction,
  playGame,
  runBatch,
  DEFAULT_MAX_TURNS,
};
