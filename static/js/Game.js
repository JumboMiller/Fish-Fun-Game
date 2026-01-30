// ==================== GAME - MAIN CONTROLLER ====================

import { CONFIG } from '../config/config.js';
import { images } from './images.js';
import { Player } from './Player.js';
import { GameObject } from './GameObject.js';
import { ImageLoader } from './ImageLoader.js';
import { StorageManager } from './StorageManager.js';

export class Game {
    constructor(canvasId, statsId, gameOverId, gameWinId, restartButtonId, playAgainButtonId, nicknameModalId, nicknameInputId, startGameButtonId, statsButtonId, playerStatsModalId, closeStatsButtonId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.statsElement = document.getElementById(statsId);
        this.gameOverScreen = document.getElementById(gameOverId);
        this.gameWinScreen = document.getElementById(gameWinId);
        this.restartButton = document.getElementById(restartButtonId);
        this.playAgainButton = document.getElementById(playAgainButtonId);
        this.nicknameModal = document.getElementById(nicknameModalId);
        this.nicknameInput = document.getElementById(nicknameInputId);
        this.startGameButton = document.getElementById(startGameButtonId);
        this.statsButton = document.getElementById(statsButtonId);
        this.playerStatsModal = document.getElementById(playerStatsModalId);
        this.closeStatsButton = document.getElementById(closeStatsButtonId);

        this.config = CONFIG;
        this.imageLoader = new ImageLoader();
        this.storage = new StorageManager();
        this.player = null;
        
        this.currentLevel = 1;
        this.totalCoins = 0;
        this.coins = 0;
        this.lives = this.config.PLAYER.STARTING_LIVES;
        this.gameObjects = [];
        this.isRunning = false;
        this.isPaused = false;
        this.isLevelTransition = false;
        this.animationFrameId = null;

        // Animation effects
        this.particles = [];
        this.screenShake = 0;
        this.flashAlpha = 0;
        this.collectAnimations = [];

        // Timer for tracking game duration
        this.startTime = null;
        this.gameTime = 0;

        // Event handlers (для правильного удаления)
        this.resizeHandler = null;
        this.keyPressHandler = null;

        // Calculate responsive canvas size
        this.calculateCanvasSize();
        this.laneWidth = this.canvasWidth / this.config.LANES.COUNT;

        this.setupEventListeners();
        this.setupResizeHandler();
    }

    calculateCanvasSize() {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // H5 approach: Always use full viewport height
        let calculatedHeight = viewportHeight;
        
        // Calculate width based on aspect ratio
        let calculatedWidth = calculatedHeight * this.config.CANVAS.ASPECT_RATIO;
        
        // If width exceeds viewport, scale down to fit width and recalculate height
        if (calculatedWidth > viewportWidth) {
            calculatedWidth = viewportWidth;
            calculatedHeight = calculatedWidth / this.config.CANVAS.ASPECT_RATIO;
        }
        
        this.canvasWidth = Math.floor(calculatedWidth);
        this.canvasHeight = Math.floor(calculatedHeight);
        
        // Update canvas element
        this.canvas.width = this.canvasWidth;
        this.canvas.height = this.canvasHeight;
        
        // Update config dynamically
        this.config.CANVAS.WIDTH = this.canvasWidth;
        this.config.CANVAS.HEIGHT = this.canvasHeight;
    }

    setupResizeHandler() {
        this.resizeTimeout = null;
        this.resizeHandler = () => {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(() => {
                const wasRunning = this.isRunning;
                const wasPaused = this.isPaused;
                
                this.calculateCanvasSize();
                this.laneWidth = this.canvasWidth / this.config.LANES.COUNT;
                
                // Recreate player with new dimensions
                if (this.player) {
                    this.player = new Player(this.config, this.imageLoader);
                }
                
                // Update game objects positions
                this.gameObjects.forEach(obj => {
                    obj.laneWidth = this.canvasWidth / this.config.LANES.COUNT;
                });
                
                // Resume if was running
                if (wasRunning && !wasPaused) {
                    this.draw();
                }
            }, 250);
        };
        window.addEventListener('resize', this.resizeHandler);
    }

    setupEventListeners() {
        this.keyPressHandler = (e) => this.handleKeyPress(e);
        document.addEventListener('keydown', this.keyPressHandler);
        
        this.restartButton.addEventListener('click', () => this.restart());
        this.playAgainButton.addEventListener('click', () => this.restart());
        this.startGameButton.addEventListener('click', () => this.handleNicknameSubmit());
        this.statsButton.addEventListener('click', () => this.showPlayerStats());
        this.closeStatsButton.addEventListener('click', () => this.hidePlayerStats());
        this.nicknameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleNicknameSubmit();
            }
        });
    }

    handleKeyPress(event) {
        if (!this.isRunning || this.isPaused) return;

        const key = event.key.toLowerCase();
        if (key === 'arrowleft' || key === 'a') {
            this.player.moveLeft();
        } else if (key === 'arrowright' || key === 'd') {
            this.player.moveRight();
        }
    }

    togglePause() {
        if (!this.isRunning) return;

        this.isPaused = !this.isPaused;
        this.pauseButton.textContent = this.isPaused ? 'Resume' : 'Pause';
        this.pauseButton.classList.toggle('paused', this.isPaused);

        if (!this.isPaused) {
            this.gameLoop();
        }
    }

    getRandomObjectType() {
        const rand = Math.random();
        let cumulativeWeight = 0;
        const levelData = this.config.LEVELS[this.currentLevel - 1];
        const weights = levelData.spawnWeights;

        // Check coins
        cumulativeWeight += weights.coin;
        if (rand < cumulativeWeight) return this.config.OBJECT_TYPES.COIN;
        
        // Check gems
        cumulativeWeight += weights.gem;
        if (rand < cumulativeWeight) return this.config.OBJECT_TYPES.GEM;
        
        // Check hearts
        cumulativeWeight += weights.heart;
        if (rand < cumulativeWeight) return this.config.OBJECT_TYPES.HEART;
        
        // Default to obstacle
        return this.config.OBJECT_TYPES.OBSTACLE;
    }

    spawnGameObject() {
        const lane = Math.floor(Math.random() * this.config.LANES.COUNT);
        const type = this.getRandomObjectType();
        const levelData = this.config.LEVELS[this.currentLevel - 1];
        const obj = new GameObject(lane, type, this.config, this.imageLoader, levelData);
        this.gameObjects.push(obj);
    }

    checkCollision(obj) {
        const playerCenterX = this.player.getCenterX();
        const objX = obj.getX();

        const distance = Math.sqrt(
            Math.pow(playerCenterX - objX, 2) + 
            Math.pow(this.player.y - obj.y, 2)
        );

        return distance < (this.player.size + obj.size) / 2;
    }

    handleCollision(obj) {
        if (obj.type === this.config.OBJECT_TYPES.OBSTACLE) {
            this.lives--;
            // Screen shake and red flash on hit
            this.screenShake = 15;
            this.flashAlpha = 0.5;
            this.createHitParticles(obj.getX(), obj.y);
            
            if (this.lives <= 0) {
                this.endGame(false);
            }
        } else if (obj.type === this.config.OBJECT_TYPES.HEART) {
            // Heal player
            this.lives = Math.min(this.lives + 1, this.config.PLAYER.STARTING_LIVES);
            // Create healing particles
            this.createHealParticles(obj.getX(), obj.y);
            this.createCollectAnimation(obj.getX(), obj.y, obj.type);
        } else {
            // Coins and Gems
            this.coins += obj.type.value;
            this.totalCoins += obj.type.value;
            // Save coins to stats immediately
            this.storage.addCoins(obj.type.value);
            // Create collect animation
            this.createCollectAnimation(obj.getX(), obj.y, obj.type);
            this.createCollectParticles(obj.getX(), obj.y, obj.type);
            
            // Check if level goal reached
            const currentLevelData = this.config.LEVELS[this.currentLevel - 1];
            if (this.coins >= currentLevelData.coinsToWin) {
                this.levelUp();
            }
        }
        this.updateStats();
    }

    createCollectAnimation(x, y, type) {
        this.collectAnimations.push({
            x: x,
            y: y,
            targetX: this.canvasWidth / 2,
            targetY: 30,
            alpha: 1,
            scale: 1,
            life: 1,
            type: type
        });
    }

    createCollectParticles(x, y, type) {
        const color = type.value === 10 ? '#00edd5' : '#ffce38';
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * 3,
                vy: Math.sin(angle) * 3,
                life: 1,
                color: color,
                size: Math.random() * 4 + 2
            });
        }
    }

    createHitParticles(x, y) {
        for (let i = 0; i < 12; i++) {
            const angle = Math.random() * Math.PI * 2;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * (Math.random() * 4 + 2),
                vy: Math.sin(angle) * (Math.random() * 4 + 2),
                life: 1,
                color: '#ff4444',
                size: Math.random() * 6 + 3
            });
        }
    }

    createHealParticles(x, y) {
        for (let i = 0; i < 10; i++) {
            const angle = (Math.PI * 2 * i) / 10;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * 2,
                vy: Math.sin(angle) * 2 - 1,
                life: 1,
                color: '#ff69b4',
                size: Math.random() * 5 + 2
            });
        }
    }

    updateEffects() {
        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.2; // gravity
            p.life -= 0.02;
            
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }

        // Update collect animations
        for (let i = this.collectAnimations.length - 1; i >= 0; i--) {
            const anim = this.collectAnimations[i];
            const dx = anim.targetX - anim.x;
            const dy = anim.targetY - anim.y;
            
            anim.x += dx * 0.1;
            anim.y += dy * 0.1;
            anim.life -= 0.015;
            anim.alpha = anim.life;
            anim.scale = 1 + (1 - anim.life) * 0.5;
            
            if (anim.life <= 0) {
                this.collectAnimations.splice(i, 1);
            }
        }

        // Update screen shake
        if (this.screenShake > 0) {
            this.screenShake *= 0.9;
            if (this.screenShake < 0.5) this.screenShake = 0;
        }

        // Update flash
        if (this.flashAlpha > 0) {
            this.flashAlpha *= 0.9;
            if (this.flashAlpha < 0.01) this.flashAlpha = 0;
        }
    }

    update() {
        if (!this.isRunning || this.isPaused) return;

        // Update and check all game objects (оптимизировано - без splice)
        const objectsToKeep = [];
        
        for (const obj of this.gameObjects) {
            obj.update();

            if (obj.isOutOfBounds(this.config.CANVAS.HEIGHT)) {
                continue; // Пропускаем объект вне границ
            }

            if (this.checkCollision(obj)) {
                this.handleCollision(obj);
                continue; // Пропускаем объект после коллизии
            }
            
            objectsToKeep.push(obj);
        }
        
        this.gameObjects = objectsToKeep;

        // Randomly spawn new objects based on current level
        const levelData = this.config.LEVELS[this.currentLevel - 1];
        if (Math.random() < levelData.spawnChance) {
            this.spawnGameObject();
        }

        // Update visual effects
        this.updateEffects();
    }

    drawLanes() {
        this.ctx.strokeStyle = '#ddd';
        this.ctx.lineWidth = 1;
        
        for (let i = 1; i < this.config.LANES.COUNT; i++) {
            const x = i * this.laneWidth;
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvasHeight);
            this.ctx.stroke();
        }
    }

    draw() {
        // Apply screen shake
        this.ctx.save();
        if (this.screenShake > 0) {
            const shakeX = (Math.random() - 0.5) * this.screenShake;
            const shakeY = (Math.random() - 0.5) * this.screenShake;
            this.ctx.translate(shakeX, shakeY);
        }

        this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

        // Update player animation
        if (this.player) {
            this.player.update();
        }

        // this.drawLanes(); // Убрали серые полосы
        this.player.draw(this.ctx);

        for (const obj of this.gameObjects) {
            obj.draw(this.ctx);
        }

        // Draw particles
        for (const p of this.particles) {
            this.ctx.globalAlpha = p.life;
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // Draw collect animations
        for (const anim of this.collectAnimations) {
            const sprite = this.imageLoader?.getImage(anim.type.value === 10 ? 'gem' : 'coin');
            this.ctx.globalAlpha = anim.alpha;
            this.ctx.save();
            this.ctx.translate(anim.x, anim.y);
            this.ctx.scale(anim.scale, anim.scale);
            if (sprite) {
                this.ctx.drawImage(sprite, -anim.type.size / 2, -anim.type.size / 2, anim.type.size, anim.type.size);
            }
            this.ctx.restore();
        }

        this.ctx.globalAlpha = 1;
        this.ctx.restore();

        // Draw red flash overlay on hit
        if (this.flashAlpha > 0) {
            this.ctx.fillStyle = `rgba(255, 0, 0, ${this.flashAlpha})`;
            this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
        }
    }

    gameLoop() {
        if (!this.isRunning || this.isPaused) {
            // Правильная отмена анимации при паузе/остановке
            if (this.animationFrameId) {
                cancelAnimationFrame(this.animationFrameId);
                this.animationFrameId = null;
            }
            return;
        }

        this.update();
        this.draw();
        this.animationFrameId = requestAnimationFrame(() => this.gameLoop());
    }

    updateStats() {
        const coinsElement = this.statsElement.querySelector('#coins-text');
        const livesContainer = this.statsElement.querySelector('#lives-container');
        const levelElement = this.statsElement.querySelector('#level-text');
        
        if (coinsElement) {
            const currentLevelData = this.config.LEVELS[this.currentLevel - 1];
            coinsElement.textContent = `${this.coins}/${currentLevelData.coinsToWin}`;
        }
        
        if (levelElement) {
            levelElement.textContent = this.currentLevel;
        }
        
        if (livesContainer) {
            // Generate heart icons based on lives count
            livesContainer.innerHTML = '';
            for (let i = 0; i < this.lives; i++) {
                const heart = document.createElement('img');
                heart.src = images.heart;
                heart.alt = 'Life';
                heart.className = 'heart-icon';
                livesContainer.appendChild(heart);
            }
        }
    }

    levelUp() {
        // Check if final level completed
        if (this.currentLevel >= this.config.LEVELS.length) {
            this.endGame(true);
            return;
        }

        // Pause game temporarily
        this.isPaused = true;
        
        // Show level up message
        const currentLevelData = this.config.LEVELS[this.currentLevel - 1];
        const nextLevel = this.currentLevel + 1;
        const nextLevelData = this.config.LEVELS[nextLevel - 1];
        
        // Update win screen for level up
        const winMessage = document.getElementById('win-message');
        const winStats = document.getElementById('win-stats');
        const playAgainBtn = document.getElementById('play-again-button');
        
        winMessage.textContent = `Level ${this.currentLevel} Complete!`;
        winStats.textContent = `Next Goal: ${nextLevelData.coinsToWin} coins`;
        playAgainBtn.textContent = 'Next Level';
        
        this.gameWinScreen.style.display = 'block';
        
        // Store level progress
        this.storage.setMaxLevel(nextLevel);
        
        // Prepare for next level
        this.currentLevel = nextLevel;
        this.coins = 0; // Reset current level coins
        this.lives = Math.min(this.lives + 1, this.config.PLAYER.STARTING_LIVES); // Bonus life
        this.gameObjects = []; // Clear objects
        
        // Set flag to indicate this is a level transition, not game over
        this.isLevelTransition = true;
        
        // Game will resume when player clicks "Play Again"
        this.isRunning = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    endGame(isWin) {
        this.isRunning = false;
        
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        // Calculate game time
        if (this.startTime) {
            this.gameTime = (Date.now() - this.startTime) / 1000;
        }

        // Update statistics
        this.storage.incrementTotalGames();

        if (isWin) {
            this.storage.incrementWins();
            const isNewRecord = this.storage.setBestTime(this.gameTime);
            
            // Update win screen text
            const winMessage = document.getElementById('win-message');
            const winStatsElement = document.getElementById('win-stats');
            const playAgainBtn = document.getElementById('play-again-button');
            const timeText = this.storage.formatTime(this.gameTime);
            const recordText = isNewRecord ? ' 🏆 NEW RECORD!' : '';
            
            winMessage.textContent = 'Victory! All Levels Completed! 🏆';
            winStatsElement.textContent = `Time: ${timeText}${recordText} | Total Coins: ${this.totalCoins}`;
            playAgainBtn.textContent = 'Play Again';
            
            this.gameWinScreen.style.display = 'block';
        } else {
            this.gameOverScreen.style.display = 'block';
        }
    }

    restart() {
        // Check if this is a level transition or full restart
        if (this.isLevelTransition) {
            // Continue to next level (currentLevel already incremented in levelUp)
            this.isLevelTransition = false;
            // Don't reset totalCoins and currentLevel
        } else {
            // Full restart from level 1
            this.currentLevel = 1;
            this.totalCoins = 0;
        }
        
        this.coins = 0;
        this.lives = this.config.PLAYER.STARTING_LIVES;
        this.gameObjects = [];
        
        // Очистка массивов эффектов для предотвращения утечек памяти
        this.particles = [];
        this.collectAnimations = [];
        this.screenShake = 0;
        this.flashAlpha = 0;
        
        this.isRunning = true;
        this.isPaused = false;
        this.startTime = Date.now();
        this.gameTime = 0;

        if (this.player) {
            this.player.reset();
        }
        this.gameOverScreen.style.display = 'none';
        this.gameWinScreen.style.display = 'none';

        this.updateStats();
        this.gameLoop();
    }

    async initialize() {
        console.log('Loading game assets...');
        await this.imageLoader.loadAll(this.config);
        console.log('Assets loaded successfully!');
        
        // Create player after images are loaded
        this.player = new Player(this.config, this.imageLoader);

        // Check if player has nickname
        if (!this.storage.hasNickname()) {
            this.showNicknameModal();
        } else {
            this.restart();
        }
    }

    showNicknameModal() {
        this.nicknameModal.classList.add('active');
        this.nicknameInput.focus();
    }

    hideNicknameModal() {
        this.nicknameModal.classList.remove('active');
    }

    handleNicknameSubmit() {
        const nickname = this.nicknameInput.value.trim();
        if (nickname) {
            this.storage.setNickname(nickname);
            this.hideNicknameModal();
            this.restart();
        } else {
            this.nicknameInput.placeholder = 'Please enter a nickname!';
            this.nicknameInput.classList.add('error');
        }
    }

    showPlayerStats() {
        // Save pause state and pause the game
        this.wasPausedBeforeStats = this.isPaused;
        if (this.isRunning && !this.isPaused) {
            this.isPaused = true;
        }
        
        const stats = this.storage.getAllStats();
        
        // Update modal content
        document.getElementById('stat-nickname').textContent = stats.nickname || 'N/A';
        document.getElementById('stat-best-time').textContent = this.storage.formatTime(stats.bestTime);
        document.getElementById('stat-total-games').textContent = stats.totalGames;
        document.getElementById('stat-wins').textContent = stats.wins;
        document.getElementById('stat-win-rate').textContent = stats.winRate + '%';
        document.getElementById('stat-total-coins').textContent = stats.totalCoins;
        document.getElementById('stat-max-level').textContent = stats.maxLevel;
        
        // Show modal
        this.playerStatsModal.classList.add('active');
    }

    hidePlayerStats() {
        this.playerStatsModal.classList.remove('active');
        
        // Resume game only if it wasn't paused before opening stats
        if (this.isRunning && !this.wasPausedBeforeStats) {
            this.isPaused = false;
            this.gameLoop();
        }
    }

    async start() {
        await this.initialize();
    }

    // Метод для очистки ресурсов и предотвращения утечек памяти
    destroy() {
        // Отмена анимационного цикла
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        // Удаление event listeners
        if (this.resizeHandler) {
            window.removeEventListener('resize', this.resizeHandler);
            this.resizeHandler = null;
        }
        
        if (this.keyPressHandler) {
            document.removeEventListener('keydown', this.keyPressHandler);
            this.keyPressHandler = null;
        }
        
        // Очистка таймаутов
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = null;
        }
        
        // Очистка всех массивов
        this.gameObjects = [];
        this.particles = [];
        this.collectAnimations = [];
        
        // Обнуление ссылок
        this.player = null;
        this.imageLoader = null;
        
        console.log('Game resources cleaned up');
    }
}
