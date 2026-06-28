// Player actions for the Verdant simulation. Each action mutates the GameState in place and
// returns { success: boolean, error?: string }. Logic is kept straightforward, one action per
// function with minimal branching (CLAUDE.md / Issue #4).
//
// Abilities are function-based objects living on the beast (and on element/spell cards):
// `{ name, cost, passive, canUse(state, caster, target), use(state, caster, target) }`. This
// layer never computes damage itself — it pays costs, enforces targeting, then delegates the
// effect to `ability.use`, which owns the damage roll via combat.dealDamage. Validity is
// checked with `ability.canUse`. See GAME_DESIGN.md §6 and the cards/ folder.

const {
  getOpponentIndex,
  findBeastInPlay,
  getBeastZone,
  killBeast,
} = require('./GameState');
const {
  startTurn,
  endTurn: switchTurn,
  shuffle,
  drawCards,
} = require('./turnFlow');
const { STARTING_HAND_SIZE } = require('./constants');

const ok = () => ({ success: true });
const fail = (error) => ({ success: false, error });

// Synthetic target id for a player's World Tree (it isn't backed by a card instance). The tree
// IS the player object — it carries `worldTreeHealth`, so combat.isTree(player) is true and
// dealDamage subtracts from the shared pool (GAME_DESIGN.md §4.1).
function treeTargetId(playerIndex) {
  return `tree_${playerIndex}`;
}

// Common guard: the game is in play and it's this player's turn.
function canAct(state, playerIndex) {
  if (state.phase !== 'playing') return 'game is not in the playing phase';
  if (playerIndex !== state.currentPlayerIndex) return 'not your turn';
  return null;
}

// Resolve an enemy target id (a beast id or the World Tree) to the object an ability acts on.
// Returns undefined for an unknown beast id.
function resolveEnemyTarget(state, opponentIndex, targetId) {
  if (targetId === treeTargetId(opponentIndex)) return state.players[opponentIndex];
  return findBeastInPlay(state.players[opponentIndex], targetId);
}

// After any effect that can deal damage, sweep both players for dead beasts and a destroyed
// World Tree (the only loss condition — GAME_DESIGN.md §4.1). Cheap: only a handful of beasts.
function resolveDeaths(state) {
  state.players.forEach((player, index) => {
    [...player.frontline, ...player.backline].forEach((beast) => {
      if (beast.health <= 0) killBeast(player, beast);
    });
    if (player.worldTreeHealth <= 0 && state.phase !== 'gameOver') {
      player.worldTreeHealth = 0;
      state.phase = 'gameOver';
      state.winner = getOpponentIndex(index);
    }
  });
}

// Play a beast from hand to the backline (GAME_DESIGN.md §4.2: beasts always enter on the backline).
function playBeast(state, playerIndex, cardInstanceId) {
  const blocked = canAct(state, playerIndex);
  if (blocked) return fail(blocked);

  const player = state.players[playerIndex];
  const idx = player.hand.findIndex((c) => c.id === cardInstanceId);
  if (idx === -1) return fail('card not in hand');

  const card = player.hand[idx];
  if (card.type !== 'beast') return fail('card is not a beast');
  if (card.playCost > player.worldTreeHealth) return fail('not enough power to play this beast');

  player.worldTreeHealth -= card.playCost;
  player.hand.splice(idx, 1);
  player.backline.push(card);
  return ok();
}

// Attach an element from hand to a beast in play, paying its attach cost and granting its
// ability. Elements are permanent and unlimited per beast (GAME_DESIGN.md §7).
function attachElement(state, playerIndex, elementCardId, targetBeastId) {
  const blocked = canAct(state, playerIndex);
  if (blocked) return fail(blocked);

  const player = state.players[playerIndex];
  const idx = player.hand.findIndex((c) => c.id === elementCardId);
  if (idx === -1) return fail('card not in hand');

  const card = player.hand[idx];
  if (card.type !== 'element') return fail('card is not an element');

  const beast = findBeastInPlay(player, targetBeastId);
  if (!beast) return fail('target beast not in play');
  if (card.attachCost > player.worldTreeHealth) return fail('not enough power to attach this element');

  player.worldTreeHealth -= card.attachCost;
  player.hand.splice(idx, 1);
  beast.elements.push(card); // kept on the beast so it joins it in the graveyard on death
  if (card.grantsAbility) beast.abilities.push(card.grantsAbility);
  return ok();
}

// Cast a spell from hand against a friendly beast. The spell's own function-based effect does
// the work; spells are utility, not power (GAME_DESIGN.md §8). Heal is the only one so far.
function castSpell(state, playerIndex, spellCardId, targetBeastId) {
  const blocked = canAct(state, playerIndex);
  if (blocked) return fail(blocked);

  const player = state.players[playerIndex];
  const idx = player.hand.findIndex((c) => c.id === spellCardId);
  if (idx === -1) return fail('card not in hand');

  const card = player.hand[idx];
  if (card.type !== 'spell') return fail('card is not a spell');
  if (card.cost > player.worldTreeHealth) return fail('not enough power to cast this spell');

  const target = findBeastInPlay(player, targetBeastId);
  if (card.canUse && !card.canUse(state, player, target)) return fail('invalid spell target');

  player.worldTreeHealth -= card.cost;
  player.hand.splice(idx, 1);
  player.graveyard.push(card);
  card.use(state, player, target);
  resolveDeaths(state);
  return ok();
}

// Move a beast between frontline and backline. Free in power, but it uses the beast's action
// for the turn (GAME_DESIGN.md §5.3).
function moveBeast(state, playerIndex, beastId) {
  const blocked = canAct(state, playerIndex);
  if (blocked) return fail(blocked);

  const player = state.players[playerIndex];
  const beast = findBeastInPlay(player, beastId);
  if (!beast) return fail('beast not in play');
  if (beast.hasActed) return fail('beast has already acted this turn');

  const from = getBeastZone(player, beast);
  const to = from === 'frontline' ? 'backline' : 'frontline';
  player[from].splice(player[from].indexOf(beast), 1);
  player[to].push(beast);
  beast.hasActed = true;
  return ok();
}

// Valid target ids for a beast's ability, honoring the zone targeting rules (GAME_DESIGN.md
// §4.2): a backline beast can only strike the enemy frontline; a frontline beast strikes the
// enemy backline or the World Tree directly. The ability's own `canUse` then has final say.
function getValidTargets(state, playerIndex, beastId, abilityIndex) {
  const player = state.players[playerIndex];
  const beast = findBeastInPlay(player, beastId);
  if (!beast) return [];

  const ability = beast.abilities[abilityIndex];
  if (!ability || ability.passive) return [];

  const opponentIndex = getOpponentIndex(playerIndex);
  const opponent = state.players[opponentIndex];
  const zone = getBeastZone(player, beast);
  const candidates = [];

  if (zone === 'backline') {
    opponent.frontline.forEach((b) => candidates.push(b.id));
  } else {
    opponent.backline.forEach((b) => candidates.push(b.id));
    candidates.push(treeTargetId(opponentIndex));
  }

  return candidates.filter((targetId) => {
    const target = resolveEnemyTarget(state, opponentIndex, targetId);
    return !ability.canUse || ability.canUse(state, beast, target);
  });
}

// Use a beast's active ability against a target. Pays the ability cost and delegates the effect
// to `ability.use` (which rolls its own damage tier). Uses the beast's action for the turn.
function useAbility(state, playerIndex, beastId, abilityIndex, targetId) {
  const blocked = canAct(state, playerIndex);
  if (blocked) return fail(blocked);

  const player = state.players[playerIndex];
  const beast = findBeastInPlay(player, beastId);
  if (!beast) return fail('beast not in play');
  if (beast.hasActed) return fail('beast has already acted this turn');

  const ability = beast.abilities[abilityIndex];
  if (!ability) return fail('unknown ability');
  if (ability.passive) return fail('cannot actively use a passive ability');

  const cost = ability.cost || 0;
  if (cost > player.worldTreeHealth) return fail('not enough power to use this ability');

  if (!getValidTargets(state, playerIndex, beastId, abilityIndex).includes(targetId)) {
    return fail('invalid target');
  }

  const opponentIndex = getOpponentIndex(playerIndex);
  const target = resolveEnemyTarget(state, opponentIndex, targetId);

  player.worldTreeHealth -= cost;
  beast.hasActed = true;
  ability.use(state, beast, target);
  resolveDeaths(state);
  return ok();
}

// End the current player's turn. During the pre-game mulligan phase this instead passes the
// mulligan decision along (keeping the current hand).
function endTurn(state, playerIndex) {
  if (state.phase === 'gameOver') return fail('the game is over');
  if (playerIndex !== undefined && playerIndex !== state.currentPlayerIndex) {
    return fail('not your turn');
  }
  if (state.phase === 'mulligan') {
    advanceMulligan(state);
    return ok();
  }
  switchTurn(state);
  return ok();
}

// Mulligan: shuffle the opening hand back, redraw a fresh hand, and pass the decision along.
// Allowed once per player, only during the pre-game mulligan phase (GAME_DESIGN.md §9).
function mulligan(state, playerIndex) {
  if (state.phase !== 'mulligan') return fail('can only mulligan before the game starts');
  if (playerIndex !== state.currentPlayerIndex) return fail('not your decision to make');

  const player = state.players[playerIndex];
  if (player.hasMulliganed) return fail('already mulliganed');

  player.deck.push(...player.hand);
  player.hand = [];
  shuffle(player.deck);
  drawCards(player, STARTING_HAND_SIZE);
  player.hasMulliganed = true;
  advanceMulligan(state);
  return ok();
}

// Advance the pre-game mulligan sequence: player 0 decides, then player 1, then play begins.
function advanceMulligan(state) {
  if (state.currentPlayerIndex === 0) {
    state.currentPlayerIndex = 1;
  } else {
    state.currentPlayerIndex = 0;
    state.phase = 'playing';
    startTurn(state); // first real turn: regen, maintenance, draw, reset actions
  }
}

// All legal actions for the current player, as plain action objects ready to feed back into
// the action functions above. This is the move generator for self-play.
function getLegalActions(state) {
  if (state.phase === 'gameOver') return [];

  const playerIndex = state.currentPlayerIndex;
  const player = state.players[playerIndex];
  const actions = [];

  if (state.phase === 'mulligan') {
    if (!player.hasMulliganed) actions.push({ type: 'mulligan', playerIndex });
    actions.push({ type: 'endTurn' }); // keep the current hand
    return actions;
  }

  // Cards in hand: play beasts, attach elements, cast spells.
  const inPlay = [...player.frontline, ...player.backline];
  player.hand.forEach((card) => {
    if (card.type === 'beast' && card.playCost <= player.worldTreeHealth) {
      actions.push({ type: 'playBeast', cardId: card.id });
    } else if (card.type === 'element' && card.attachCost <= player.worldTreeHealth) {
      inPlay.forEach((beast) => {
        actions.push({ type: 'attachElement', cardId: card.id, targetBeastId: beast.id });
      });
    } else if (card.type === 'spell' && card.cost <= player.worldTreeHealth) {
      inPlay.forEach((beast) => {
        if (!card.canUse || card.canUse(state, player, beast)) {
          actions.push({ type: 'castSpell', cardId: card.id, targetBeastId: beast.id });
        }
      });
    }
  });

  // Beasts that still have their action: move, or use an active ability against a valid target.
  inPlay.forEach((beast) => {
    if (beast.hasActed) return;
    actions.push({ type: 'moveBeast', beastId: beast.id });
    beast.abilities.forEach((ability, abilityIndex) => {
      if (!ability || ability.passive) return;
      if ((ability.cost || 0) > player.worldTreeHealth) return;
      getValidTargets(state, playerIndex, beast.id, abilityIndex).forEach((targetId) => {
        actions.push({ type: 'useAbility', beastId: beast.id, abilityIndex, targetId });
      });
    });
  });

  actions.push({ type: 'endTurn' });
  return actions;
}

module.exports = {
  playBeast,
  attachElement,
  castSpell,
  moveBeast,
  useAbility,
  endTurn,
  mulligan,
  getValidTargets,
  getLegalActions,
  treeTargetId,
};
