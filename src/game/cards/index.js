// Card registry — entry point for the cards/ folder. The actual definitions
// live in one file per card type alongside this file — beasts.js, elements.js,
// spells.js (each card carries its own abilities). This file just merges them
// into a single id-keyed map so a card can be looked up by id (e.g. by
// createCardInstance in GameState.js, which requires './cards').
const { BEASTS } = require('./beasts');
const { ELEMENTS } = require('./elements');
const { SPELLS } = require('./spells');

const CARD_TEMPLATES = { ...BEASTS, ...ELEMENTS, ...SPELLS };

module.exports = { CARD_TEMPLATES, BEASTS, ELEMENTS, SPELLS };
