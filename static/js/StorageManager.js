// ==================== STORAGE MANAGER ====================

export class StorageManager {
    constructor() {
        this.KEYS = {
            NICKNAME: 'fishgame_nickname',
            BEST_TIME: 'fishgame_best_time',
            TOTAL_GAMES: 'fishgame_total_games',
            TOTAL_COINS: 'fishgame_total_coins',
            WINS: 'fishgame_wins',
            MAX_LEVEL: 'fishgame_max_level'
        };
    }

    // Nickname management
    getNickname() {
        return localStorage.getItem(this.KEYS.NICKNAME) || null;
    }

    setNickname(nickname) {
        localStorage.setItem(this.KEYS.NICKNAME, nickname);
    }

    hasNickname() {
        return this.getNickname() !== null;
    }

    // Best time management (in seconds)
    getBestTime() {
        const time = localStorage.getItem(this.KEYS.BEST_TIME);
        return time ? parseFloat(time) : null;
    }

    setBestTime(timeInSeconds) {
        const currentBest = this.getBestTime();
        
        if (currentBest === null || timeInSeconds < currentBest) {
            localStorage.setItem(this.KEYS.BEST_TIME, timeInSeconds.toString());
            return true; // New record!
        }
        
        return false;
    }

    // Statistics management
    getTotalGames() {
        return parseInt(localStorage.getItem(this.KEYS.TOTAL_GAMES) || '0');
    }

    incrementTotalGames() {
        const total = this.getTotalGames() + 1;
        localStorage.setItem(this.KEYS.TOTAL_GAMES, total.toString());
    }

    getTotalCoins() {
        return parseInt(localStorage.getItem(this.KEYS.TOTAL_COINS) || '0');
    }

    addCoins(amount) {
        const total = this.getTotalCoins() + amount;
        localStorage.setItem(this.KEYS.TOTAL_COINS, total.toString());
    }

    getWins() {
        return parseInt(localStorage.getItem(this.KEYS.WINS) || '0');
    }

    incrementWins() {
        const wins = this.getWins() + 1;
        localStorage.setItem(this.KEYS.WINS, wins.toString());
    }

    // Max level management
    getMaxLevel() {
        return parseInt(localStorage.getItem(this.KEYS.MAX_LEVEL) || '1');
    }

    setMaxLevel(level) {
        const currentMax = this.getMaxLevel();
        if (level > currentMax) {
            localStorage.setItem(this.KEYS.MAX_LEVEL, level.toString());
        }
    }

    // Get all statistics
    getAllStats() {
        return {
            nickname: this.getNickname(),
            bestTime: this.getBestTime(),
            totalGames: this.getTotalGames(),
            totalCoins: this.getTotalCoins(),
            wins: this.getWins(),
            maxLevel: this.getMaxLevel(),
            winRate: this.getTotalGames() > 0 
                ? ((this.getWins() / this.getTotalGames()) * 100).toFixed(1) 
                : 0
        };
    }

    // Clear all data
    clearAll() {
        Object.values(this.KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
    }

    // Format time for display
    formatTime(seconds) {
        if (seconds === null) return 'N/A';
        
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 100);
        
        return `${minutes}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
    }
}
