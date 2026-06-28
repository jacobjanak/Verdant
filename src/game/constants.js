// Core tuning values for the simulation. These are placeholders meant to be
// tuned via self-play later; keep them flat and easy to change.
module.exports = {
  STARTING_WORLD_TREE_HEALTH: 1000,
  REGEN_PER_TURN: 50, // placeholder tuning value
  STARTING_HAND_SIZE: 7,
  CARDS_DRAWN_PER_TURN: 1,

  // Damage tiers: weighted random roll determines the multiplier applied to a
  // hit. Weights are relative (not required to sum to 1).
  DAMAGE_TIERS: [
    { name: 'veryWeak', multiplier: 0.75, weight: 1 },
    { name: 'weak', multiplier: 0.875, weight: 2 },
    { name: 'normal', multiplier: 1.0, weight: 3 },
    { name: 'effective', multiplier: 1.125, weight: 2 },
    { name: 'superEffective', multiplier: 1.25, weight: 1 },
    { name: 'critical', multiplier: 2.0, weight: 0.2 },
  ],
};
