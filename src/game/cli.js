// CLI entry point for the self-play runner (Issue #5).
//
//   node src/game/cli.js [numGames]
//   npm run play -- [numGames]
//
// Runs a batch of random self-play games and prints win counts, draws, average
// turns, and throughput (games/sec) — the headline number for the
// simulation-first pillar (GAME_DESIGN.md §2.2).

const { runBatch } = require('./selfPlay');

function main() {
  const numGames = parseInt(process.argv[2], 10) || 100;

  console.log(`Running ${numGames} self-play games...`);
  const start = Date.now();
  const stats = runBatch(numGames);
  const elapsedMs = Date.now() - start;
  const gamesPerSec = elapsedMs > 0 ? Math.round((numGames / elapsedMs) * 1000) : numGames;

  console.log('Results:');
  console.log(`  Player 1 wins: ${stats.player1Wins}`);
  console.log(`  Player 2 wins: ${stats.player2Wins}`);
  console.log(`  Draws (max turns): ${stats.draws}`);
  console.log(`  Average turns per game: ${stats.averageTurns.toFixed(1)}`);
  console.log(`  Time: ${elapsedMs}ms (${gamesPerSec} games/sec)`);
}

main();
