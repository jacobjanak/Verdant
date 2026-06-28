// Hardcoded card templates for testing. A template holds the shared, immutable
// definition of a card; createCardInstance() (in GameState.js) clones one of
// these into a concrete in-game instance with a unique id.
const CARD_TEMPLATES = {
  bear: { type: 'beast', name: 'Bear', playCost: 50, maintenanceCost: 10, maxHealth: 200, abilities: ['maul'] },
  rabbit: { type: 'beast', name: 'Rabbit', playCost: 20, maintenanceCost: 5, maxHealth: 80, abilities: ['nibble', 'lucky'] },
  fireball: { type: 'element', name: 'Fireball', attachCost: 30, grantsAbility: 'fireball_attack' },
  heal: { type: 'spell', name: 'Healing Light', cost: 20, effect: 'heal_beast', healAmount: 50 },
};

module.exports = { CARD_TEMPLATES };
