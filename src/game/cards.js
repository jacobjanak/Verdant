// Card registry. The actual definitions live in one file per card type —
// beasts.js, elements.js, spells.js (each card carries its own abilities). This
// file just merges them into a single id-keyed map so a card can be looked up
// by id (e.g. by createCardInstance in GameState.js).
const { BEASTS } = require('./beasts');
const { ELEMENTS } = require('./elements');
const { SPELLS } = require('./spells');

const CARD_TEMPLATES = { ...BEASTS, ...ELEMENTS, ...SPELLS };

module.exports = { CARD_TEMPLATES, BEASTS, ELEMENTS, SPELLS };
