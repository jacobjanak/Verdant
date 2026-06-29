// Beast card definitions.
//
// Abilities are defined INLINE on each beast as function-based objects
// (`canUse` / `use`). They are specific to the beast — not shared, reusable
// entries in a lookup table — and the function form lets each card do whatever
// it needs without us inventing a new hardcoded property for every effect. This
// is what scales to thousands of unique cards.
//
// Abilities don't roll damage tiers themselves: they just hand a base damage to
// `dealDamage`, which owns the roll + multiplier. A card customizes how its
// hits roll by overriding a global (e.g. `DAMAGE_TIERS`) ON ITSELF, derived
// from the global value. See docs/MECHANICS.md.
const { DAMAGE_TIERS } = require('../constants');
const { dealDamage } = require('../combat');

const BEASTS = {
  bear: {
    type: 'beast',
    id: 'bear',
    name: 'Bear',
    latinName: 'Ursus arctos',
    playCost: 50,
    maintenanceCost: 10,
    maxHealth: 200,
    abilities: [
      {
        name: 'Maul',
        cost: 15,
        passive: false,
        canUse: (state, caster, target) => target != null,
        use: (state, caster, target) => dealDamage(caster, target, 80),
      },
    ],
  },

  rabbit: {
    type: 'beast',
    id: 'rabbit',
    name: 'Rabbit',
    latinName: 'Oryctolagus cuniculus',
    playCost: 20,
    maintenanceCost: 5,
    maxHealth: 80,

    // "Lucky" passive (GAME_DESIGN §11): Rabbit rolls on its own damage-tier
    // table, which makes criticals more likely. It's a plain override defined
    // ON THE CARD — combat.dealDamage checks `caster.DAMAGE_TIERS` before the
    // global table, so simply having this property here is what activates the
    // passive (no hook to wire up, nothing to "call"). We DERIVE it from the
    // global table by tripling critical's weight rather than hardcoding numbers,
    // so it can't drift out of sync if the base table is retuned. This is the
    // general pattern for per-card overrides — see docs/MECHANICS.md.
    DAMAGE_TIERS: DAMAGE_TIERS.map((tier) =>
      tier.name === 'critical' ? { ...tier, weight: tier.weight * 3 } : tier
    ),

    abilities: [
      {
        name: 'Nibble',
        cost: 5,
        passive: false,
        canUse: (state, caster, target) => target != null,
        use: (state, caster, target) => dealDamage(caster, target, 20),
      },
    ],
  },

  // ── Aquatic Deck ──────────────────────────────────────────────────────────

  shark: {
    type: 'beast',
    id: 'shark',
    name: 'Great White Shark',
    latinName: 'Carcharodon carcharias',
    playCost: 70,
    maintenanceCost: 15,
    maxHealth: 180,
    abilities: [
      {
        name: 'Bite',
        cost: 20,
        passive: false,
        canUse: (state, caster, target) => target != null,
        use: (state, caster, target) => dealDamage(caster, target, 100),
      },
    ],
  },

  octopus: {
    type: 'beast',
    id: 'octopus',
    name: 'Octopus',
    latinName: 'Octopus vulgaris',
    playCost: 40,
    maintenanceCost: 8,
    maxHealth: 120,
    abilities: [
      {
        name: 'Tentacle Barrage',
        cost: 10,
        passive: false,
        canUse: (state, caster, target) => target != null,
        // Three quick hits from different tentacles
        use: (state, caster, target) => {
          dealDamage(caster, target, 20);
          dealDamage(caster, target, 20);
          dealDamage(caster, target, 20);
        },
      },
    ],
  },

  dolphin: {
    type: 'beast',
    id: 'dolphin',
    name: 'Bottlenose Dolphin',
    latinName: 'Tursiops truncatus',
    playCost: 35,
    maintenanceCost: 8,
    maxHealth: 110,
    // Agile hunter: higher crit weight makes hits more decisive
    DAMAGE_TIERS: DAMAGE_TIERS.map((tier) =>
      tier.name === 'critical' ? { ...tier, weight: tier.weight * 2 } : tier
    ),
    abilities: [
      {
        name: 'Sonar Strike',
        cost: 10,
        passive: false,
        canUse: (state, caster, target) => target != null,
        use: (state, caster, target) => dealDamage(caster, target, 45),
      },
    ],
  },

  jellyfish: {
    type: 'beast',
    id: 'jellyfish',
    name: 'Moon Jellyfish',
    latinName: 'Aurelia aurita',
    playCost: 20,
    maintenanceCost: 5,
    maxHealth: 60,
    abilities: [
      {
        name: 'Sting',
        cost: 5,
        passive: false,
        canUse: (state, caster, target) => target != null,
        use: (state, caster, target) => dealDamage(caster, target, 25),
      },
    ],
  },

  crab: {
    type: 'beast',
    id: 'crab',
    name: 'European Edible Crab',
    latinName: 'Cancer pagurus',
    playCost: 45,
    maintenanceCost: 10,
    maxHealth: 250,
    abilities: [
      {
        name: 'Pinch',
        cost: 15,
        passive: false,
        canUse: (state, caster, target) => target != null,
        use: (state, caster, target) => dealDamage(caster, target, 40),
      },
    ],
  },

  electric_eel: {
    type: 'beast',
    id: 'electric_eel',
    name: 'Electric Eel',
    latinName: 'Electrophorus electricus',
    playCost: 55,
    maintenanceCost: 12,
    maxHealth: 130,
    abilities: [
      {
        name: 'Electric Shock',
        cost: 15,
        passive: false,
        canUse: (state, caster, target) => target != null,
        use: (state, caster, target) => dealDamage(caster, target, 75),
      },
    ],
  },

  sea_turtle: {
    type: 'beast',
    id: 'sea_turtle',
    name: 'Green Sea Turtle',
    latinName: 'Chelonia mydas',
    playCost: 60,
    maintenanceCost: 15,
    maxHealth: 300,
    abilities: [
      {
        name: 'Shell Ram',
        cost: 20,
        passive: false,
        canUse: (state, caster, target) => target != null,
        use: (state, caster, target) => dealDamage(caster, target, 45),
      },
    ],
  },

  anglerfish: {
    type: 'beast',
    id: 'anglerfish',
    name: 'Anglerfish',
    latinName: 'Lophius piscatorius',
    playCost: 50,
    maintenanceCost: 12,
    maxHealth: 150,
    // Lure passive: rolls more often on the glancing tier (low damage), drawing
    // enemies in close, but when it lands a critical it hits hard. We double
    // the critical weight to represent the ambush payoff.
    DAMAGE_TIERS: DAMAGE_TIERS.map((tier) =>
      tier.name === 'critical' ? { ...tier, weight: tier.weight * 2 } : tier
    ),
    abilities: [
      {
        name: 'Lure and Devour',
        cost: 15,
        passive: false,
        canUse: (state, caster, target) => target != null,
        use: (state, caster, target) => dealDamage(caster, target, 65),
      },
    ],
  },

  // ── Cat Deck ──────────────────────────────────────────────────────────────

  lion: {
    type: 'beast',
    id: 'lion',
    name: 'Lion',
    latinName: 'Panthera leo',
    playCost: 80,
    maintenanceCost: 20,
    maxHealth: 220,
    abilities: [
      {
        name: 'Roar and Strike',
        cost: 25,
        passive: false,
        canUse: (state, caster, target) => target != null,
        use: (state, caster, target) => dealDamage(caster, target, 95),
      },
    ],
  },

  tiger: {
    type: 'beast',
    id: 'tiger',
    name: 'Tiger',
    latinName: 'Panthera tigris',
    playCost: 70,
    maintenanceCost: 15,
    maxHealth: 190,
    abilities: [
      {
        name: 'Pounce',
        cost: 20,
        passive: false,
        canUse: (state, caster, target) => target != null,
        use: (state, caster, target) => dealDamage(caster, target, 100),
      },
    ],
  },

  cheetah: {
    type: 'beast',
    id: 'cheetah',
    name: 'Cheetah',
    latinName: 'Acinonyx jubatus',
    playCost: 55,
    maintenanceCost: 12,
    maxHealth: 140,
    // Fastest land animal: higher crit weight for decisive bursts
    DAMAGE_TIERS: DAMAGE_TIERS.map((tier) =>
      tier.name === 'critical' ? { ...tier, weight: tier.weight * 2 } : tier
    ),
    abilities: [
      {
        name: 'Sprint Strike',
        cost: 15,
        passive: false,
        canUse: (state, caster, target) => target != null,
        // Two rapid hits representing its burst speed
        use: (state, caster, target) => {
          dealDamage(caster, target, 35);
          dealDamage(caster, target, 35);
        },
      },
    ],
  },

  leopard: {
    type: 'beast',
    id: 'leopard',
    name: 'Leopard',
    latinName: 'Panthera pardus',
    playCost: 60,
    maintenanceCost: 12,
    maxHealth: 170,
    abilities: [
      {
        name: 'Ambush',
        cost: 15,
        passive: false,
        canUse: (state, caster, target) => target != null,
        use: (state, caster, target) => dealDamage(caster, target, 80),
      },
    ],
  },

  lynx: {
    type: 'beast',
    id: 'lynx',
    name: 'Eurasian Lynx',
    latinName: 'Lynx lynx',
    playCost: 40,
    maintenanceCost: 10,
    maxHealth: 135,
    abilities: [
      {
        name: 'Stalk',
        cost: 10,
        passive: false,
        canUse: (state, caster, target) => target != null,
        use: (state, caster, target) => dealDamage(caster, target, 55),
      },
    ],
  },

  house_cat: {
    type: 'beast',
    id: 'house_cat',
    name: 'House Cat',
    latinName: 'Felis catus',
    playCost: 20,
    maintenanceCost: 5,
    maxHealth: 70,
    // Lucky passive like Rabbit: unpredictable little menace
    DAMAGE_TIERS: DAMAGE_TIERS.map((tier) =>
      tier.name === 'critical' ? { ...tier, weight: tier.weight * 3 } : tier
    ),
    abilities: [
      {
        name: 'Scratch',
        cost: 5,
        passive: false,
        canUse: (state, caster, target) => target != null,
        use: (state, caster, target) => dealDamage(caster, target, 20),
      },
    ],
  },

  serval: {
    type: 'beast',
    id: 'serval',
    name: 'Serval',
    latinName: 'Leptailurus serval',
    playCost: 45,
    maintenanceCost: 10,
    maxHealth: 150,
    abilities: [
      {
        name: 'Leap',
        cost: 12,
        passive: false,
        canUse: (state, caster, target) => target != null,
        use: (state, caster, target) => dealDamage(caster, target, 60),
      },
    ],
  },

  caracal: {
    type: 'beast',
    id: 'caracal',
    name: 'Caracal',
    latinName: 'Caracal caracal',
    playCost: 50,
    maintenanceCost: 10,
    maxHealth: 155,
    abilities: [
      {
        name: 'Slash',
        cost: 12,
        passive: false,
        canUse: (state, caster, target) => target != null,
        use: (state, caster, target) => dealDamage(caster, target, 65),
      },
    ],
  },
};

module.exports = { BEASTS };
