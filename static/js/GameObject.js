// ==================== GAME OBJECT CLASS ====================

export class GameObject {
    constructor(lane, type, config, imageLoader = null, levelData = null) {
        this.lane = lane;
        this.type = type;
        this.imageLoader = imageLoader;
        this.size = type.size || config.GAME_OBJECT.SIZE;
        this.y = -this.size;
        
        // Use level-specific speed if provided, otherwise use default
        if (levelData) {
            this.speed = levelData.minSpeed + 
                         Math.random() * (levelData.maxSpeed - levelData.minSpeed);
        } else {
            this.speed = config.GAME_OBJECT.MIN_SPEED + 
                         Math.random() * (config.GAME_OBJECT.MAX_SPEED - config.GAME_OBJECT.MIN_SPEED);
        }
        
        this.laneWidth = config.CANVAS.WIDTH / config.LANES.COUNT;
        
        // Determine sprite key based on type value
        this.spriteKey = this.getSpriteKey();
    }

    getSpriteKey() {
        if (this.type.value === 1) return 'coin';
        if (this.type.value === 10) return 'gem';
        if (this.type.value === -1) return 'heart';
        if (this.type.value === 0) return 'obstacle';
        return 'coin'; // default fallback
    }

    update() {
        this.y += this.speed;
    }

    isOutOfBounds(canvasHeight) {
        return this.y > canvasHeight;
    }

    getX() {
        return this.lane * this.laneWidth + this.laneWidth / 2;
    }

    draw(ctx) {
        const sprite = this.imageLoader?.getImage(this.spriteKey);
        const x = this.getX();

        if (sprite) {
            // Draw sprite centered
            ctx.drawImage(
                sprite,
                x - this.size / 2,
                this.y - this.size / 2,
                this.size,
                this.size
            );
        } else {
            // Fallback to colored circle if sprite not available
            ctx.fillStyle = '#888';
            ctx.beginPath();
            ctx.arc(x, this.y, this.size / 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}
