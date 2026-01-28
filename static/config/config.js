// ==================== GAME CONFIGURATION ====================

export const CONFIG = {
    CANVAS: {
        BASE_WIDTH: 400,
        BASE_HEIGHT: 600,
        ASPECT_RATIO: 2 / 3,  
        MAX_WIDTH: 600,
        MIN_WIDTH: 300
    },
    LANES: {
        COUNT: 5
    },
    PLAYER: {
        SIZE: 86,
        STARTING_LIVES: 3,
        BOTTOM_OFFSET: 10,
        SPRITE: 'static/img/Player.png'
    },
    GAME_OBJECT: {
        MIN_SPEED: 2,
        MAX_SPEED: 4,
        SPAWN_CHANCE_PER_FRAME: 0.02
    },
    OBJECT_TYPES: {
        COIN: {
            value: 1,
            spawnWeight: 0.40,
            sprite: 'static/img/Coin.png',
            size: 42
        },
        GEM: {
            value: 10,
            spawnWeight: 0.15,
            sprite: 'static/img/Gem.png',
            size: 42
        },
        HEART: {
            value: -1,   
            spawnWeight: 0.10,
            sprite: 'static/img/Heart.png',
            size: 38
        },
        OBSTACLE: {
            value: 0,
            spawnWeight: 0.35,
            sprite: 'static/img/Obstenence.png',
            size: 58
        }
    },
    LEVELS: [
        {
            level: 1,
            coinsToWin: 20,
            minSpeed: 2,
            maxSpeed: 3.5,
            spawnChance: 0.018,
            spawnWeights: {
                coin: 0.45,
                gem: 0.18,
                heart: 0.12,
                obstacle: 0.25
            }
        },
        {
            level: 2,
            coinsToWin: 40,
            minSpeed: 2.5,
            maxSpeed: 4.2,
            spawnChance: 0.020,
            spawnWeights: {
                coin: 0.42,
                gem: 0.16,
                heart: 0.10,
                obstacle: 0.32
            }
        },
        {
            level: 3,
            coinsToWin: 60,
            minSpeed: 3,
            maxSpeed: 5,
            spawnChance: 0.022,
            spawnWeights: {
                coin: 0.38,
                gem: 0.15,
                heart: 0.09,
                obstacle: 0.38
            }
        },
        {
            level: 4,
            coinsToWin: 80,
            minSpeed: 3.5,
            maxSpeed: 5.8,
            spawnChance: 0.024,
            spawnWeights: {
                coin: 0.35,
                gem: 0.13,
                heart: 0.08,
                obstacle: 0.44
            }
        },
        {
            level: 5,
            coinsToWin: 100,
            minSpeed: 4,
            maxSpeed: 6.5,
            spawnChance: 0.026,
            spawnWeights: {
                coin: 0.32,
                gem: 0.12,
                heart: 0.06,
                obstacle: 0.50
            }
        }
    ],
    GAME: {
        COINS_TO_WIN: 100
    }
};
