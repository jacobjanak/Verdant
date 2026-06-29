const express = require('express');
const path = require('path');
const { createVisualGame } = require('./game/visualPlayer');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Single global game instance — debug UI only, not multi-user.
let currentGame = null;

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Create a new game and return the initial state.
app.post('/api/game/new', (req, res) => {
  currentGame = createVisualGame();
  res.json(currentGame.getState());
});

// Execute one random legal action and return the new state + log message.
app.post('/api/game/step', (req, res) => {
  if (!currentGame) {
    return res.status(400).json({ error: 'No game in progress. Call POST /api/game/new first.' });
  }
  res.json(currentGame.step());
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

module.exports = app;
