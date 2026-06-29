// Step-through game runner for the Verdant web UI (Issue #11).
//
// Wraps the game engine to execute one random legal action at a time and return
// a human-readable description of what happened. Intended for the debug UI only —
// the CLI bulk runner (selfPlay.js / cli.js) is completely independent and never
// imports this file.

const { GameState, getOpponentIndex, findBeastInPlay, getBeastZone } = require('./GameState');
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
  treeTargetId,
} = require('./actions');

function createTestDeck() {
  const deck = [];
  for (let i = 0; i < 15; i++) deck.push('bear');
  for (let i = 0; i < 15; i++) deck.push('rabbit');
  for (let i = 0; i < 10; i++) deck.push('fireball');
  for (let i = 0; i < 7; i++) deck.push('heal');
  return deck;
}

function playerLabel(index) {
  return `Player ${index + 1}`;
}

// Build a human-readable description of an action BEFORE it is executed, while
// card/beast references are still accessible in their current positions.
function describeAction(state, action) {
  const playerIndex = state.phase === 'mulligan' && action.type === 'mulligan'
    ? action.playerIndex
    : state.currentPlayerIndex;
  const player = state.players[playerIndex];
  const label = playerLabel(playerIndex);
  const inPlay = [...player.frontline, ...player.backline];

  switch (action.type) {
    case 'playBeast': {
      const card = player.hand.find((c) => c.id === action.cardId);
      return `${label} played ${card ? card.name : 'a beast'} to backline`;
    }
    case 'attachElement': {
      const card = player.hand.find((c) => c.id === action.cardId);
      const beast = inPlay.find((b) => b.id === action.targetBeastId);
      return `${label} attached ${card ? card.name : 'an element'} to ${beast ? beast.name : 'a beast'}`;
    }
    case 'castSpell': {
      const card = player.hand.find((c) => c.id === action.cardId);
      const beast = inPlay.find((b) => b.id === action.targetBeastId);
      return `${label} cast ${card ? card.name : 'a spell'} on ${beast ? beast.name : 'a beast'}`;
    }
    case 'moveBeast': {
      const beast = inPlay.find((b) => b.id === action.beastId);
      const from = beast ? getBeastZone(player, beast) : 'unknown zone';
      const to = from === 'frontline' ? 'backline' : 'frontline';
      return `${label} moved ${beast ? beast.name : 'a beast'} from ${from} to ${to}`;
    }
    case 'useAbility': {
      const beast = inPlay.find((b) => b.id === action.beastId);
      const ability = beast ? beast.abilities[action.abilityIndex] : null;
      const abilityName = ability ? ability.name : 'an ability';
      const opponentIndex = getOpponentIndex(playerIndex);
      const opponent = state.players[opponentIndex];
      let targetDesc;
      if (action.targetId === treeTargetId(opponentIndex)) {
        targetDesc = `${playerLabel(opponentIndex)}'s World Tree`;
      } else {
        const target = findBeastInPlay(opponent, action.targetId);
        targetDesc = target ? `${playerLabel(opponentIndex)}'s ${target.name}` : 'unknown target';
      }
      return `${label}'s ${beast ? beast.name : 'beast'} used ${abilityName} on ${targetDesc}`;
    }
    case 'mulligan':
      return `${playerLabel(action.playerIndex)} took a mulligan`;
    case 'endTurn':
      return `${label} ended their turn`;
    default:
      return `${label}: unknown action (${action.type})`;
  }
}

// Snapshot which beast instance IDs are currently in play for each player.
function snapshotInPlay(state) {
  return state.players.map((p) => new Set([
    ...p.frontline.map((b) => b.id),
    ...p.backline.map((b) => b.id),
  ]));
}

// Find which beasts left play by comparing a before-snapshot to current state.
function findDeaths(state, beforeSnapshots) {
  const lines = [];
  state.players.forEach((player, i) => {
    const after = new Set([
      ...player.frontline.map((b) => b.id),
      ...player.backline.map((b) => b.id),
    ]);
    beforeSnapshots[i].forEach((id) => {
      if (!after.has(id)) {
        const dead = player.graveyard.find((b) => b.id === id);
        lines.push(`${playerLabel(i)}'s ${dead ? dead.name : 'beast'} died`);
      }
    });
  });
  return lines;
}

// Serializable summary of the current game state for the UI.
function serializeState(state) {
  const p1 = state.players[0];
  const p2 = state.players[1];

  const beastSummary = (player) =>
    [...player.frontline, ...player.backline].map((b) => ({
      name: b.name,
      health: b.health,
      maxHealth: b.maxHealth,
      zone: player.frontline.includes(b) ? 'frontline' : 'backline',
      hasActed: b.hasActed,
    }));

  return {
    turn: state.turnNumber,
    phase: state.phase,
    currentPlayer: state.currentPlayerIndex,
    p1Health: p1.worldTreeHealth,
    p2Health: p2.worldTreeHealth,
    p1Beasts: beastSummary(p1),
    p2Beasts: beastSummary(p2),
    p1HandSize: p1.hand.length,
    p2HandSize: p2.hand.length,
    gameOver: state.phase === 'gameOver',
    winner: state.winner,
  };
}

// Dispatch a legal action object to the matching action function.
function executeAction(state, action) {
  const playerIndex = state.currentPlayerIndex;
  switch (action.type) {
    case 'playBeast':       return playBeast(state, playerIndex, action.cardId);
    case 'attachElement':   return attachElement(state, playerIndex, action.cardId, action.targetBeastId);
    case 'castSpell':       return castSpell(state, playerIndex, action.cardId, action.targetBeastId);
    case 'moveBeast':       return moveBeast(state, playerIndex, action.beastId);
    case 'useAbility':      return useAbility(state, playerIndex, action.beastId, action.abilityIndex, action.targetId);
    case 'mulligan':        return mulligan(state, action.playerIndex);
    case 'endTurn':         return endTurn(state, playerIndex);
    default:                throw new Error(`Unknown action type: ${action.type}`);
  }
}

// Create a step-through game. Returns an object with two methods:
//   getState() — initial state snapshot, called once after construction
//   step()     — execute one random legal action, return what happened
function createVisualGame() {
  const state = new GameState();
  initializeGame(state, createTestDeck(), createTestDeck());

  return {
    getState() {
      return {
        state: serializeState(state),
        log: 'Game started. Mulligan phase — each player may redraw once.',
        gameOver: false,
      };
    },

    step() {
      if (state.phase === 'gameOver') {
        const winnerText = state.winner !== null
          ? `${playerLabel(state.winner)} wins!`
          : 'Draw (turn cap reached).';
        return {
          state: serializeState(state),
          log: `Game already over. ${winnerText}`,
          gameOver: true,
        };
      }

      const legal = getLegalActions(state);
      if (legal.length === 0) {
        return {
          state: serializeState(state),
          log: 'No legal actions available.',
          gameOver: false,
        };
      }

      const action = legal[Math.floor(Math.random() * legal.length)];
      const actionLog = describeAction(state, action);
      const before = snapshotInPlay(state);

      executeAction(state, action);

      const deaths = findDeaths(state, before);
      const parts = [actionLog, ...deaths];

      if (state.phase === 'gameOver') {
        const winnerText = state.winner !== null
          ? `${playerLabel(state.winner)} wins!`
          : 'Draw.';
        parts.push(`Game over — ${winnerText}`);
      }

      return {
        state: serializeState(state),
        log: parts.join('. '),
        gameOver: state.phase === 'gameOver',
      };
    },
  };
}

module.exports = { createVisualGame };
