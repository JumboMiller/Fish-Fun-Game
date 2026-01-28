// ==================== MAIN - GAME INITIALIZATION ====================

import { Game } from './Game.js';

// Initialize and start the game
const game = new Game(
    'gameCanvas',
    'game-stats',
    'game-over',
    'game-win',
    'restart-button',
    'play-again-button',
    'nickname-modal',
    'nickname-input',
    'start-game-button',
    'stats-button',
    'player-stats-modal',
    'close-stats-button'
);

game.start();
