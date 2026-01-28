// ==================== PLAYER CLASS ====================

export class Player {
    constructor(config, imageLoader = null) {
        this.config = config;
        this.imageLoader = imageLoader;
        this.lane = Math.floor(config.LANES.COUNT / 2);
        this.targetLane = this.lane;
        this.currentX = 0;
        this.targetX = 0;
        this.size = config.PLAYER.SIZE;
        this.y = config.CANVAS.HEIGHT - this.size - config.PLAYER.BOTTOM_OFFSET;
        this.laneWidth = config.CANVAS.WIDTH / config.LANES.COUNT;
        
        // Animation properties
        this.animationSpeed = 0.25;
        this.rotation = 0;
        this.targetRotation = 0;
        this.scale = 1;
        this.bobOffset = 0;
        this.bobSpeed = 0.1;
        
        // Initialize positions
        this.currentX = this.calculateLaneX(this.lane);
        this.targetX = this.currentX;
    }

    calculateLaneX(lane) {
        return lane * this.laneWidth + (this.laneWidth - this.size) / 2;
    }

    moveLeft() {
        if (this.lane > 0) {
            this.lane--;
            this.targetLane = this.lane;
            this.targetX = this.calculateLaneX(this.lane);
            this.targetRotation = -0.2; // Tilt left
        }
    }

    moveRight() {
        if (this.lane < this.config.LANES.COUNT - 1) {
            this.lane++;
            this.targetLane = this.lane;
            this.targetX = this.calculateLaneX(this.lane);
            this.targetRotation = 0.2; // Tilt right
        }
    }

    update() {
        // Smooth lane transition
        const dx = this.targetX - this.currentX;
        this.currentX += dx * this.animationSpeed;
        
        // Smooth rotation
        const dr = this.targetRotation - this.rotation;
        this.rotation += dr * 0.15;
        
        // Return to neutral rotation when reached target
        if (Math.abs(dx) < 1) {
            this.targetRotation = 0;
        }
        
        // Bobbing animation
        this.bobOffset += this.bobSpeed;
        
        // Scale pulse when moving
        if (Math.abs(dx) > 5) {
            this.scale = 1 + Math.sin(this.bobOffset * 2) * 0.05;
        } else {
            this.scale = 1;
        }
    }

    getX() {
        return this.currentX;
    }

    getCenterX() {
        return this.currentX + this.size / 2;
    }

    draw(ctx) {
        const sprite = this.imageLoader?.getImage('player');
        const x = this.getX();
        const bobY = Math.sin(this.bobOffset) * 3; // Subtle vertical bobbing
        
        ctx.save();
        
        // Translate to center for rotation
        ctx.translate(x + this.size / 2, this.y + this.size / 2 + bobY);
        ctx.rotate(this.rotation);
        ctx.scale(this.scale, this.scale);
        
        if (sprite) {
            ctx.drawImage(sprite, -this.size / 2, -this.size / 2, this.size, this.size);
        } else {
            // Fallback to colored rectangle
            ctx.fillStyle = 'blue';
            ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        }
        
        ctx.restore();
    }

    reset() {
        this.lane = Math.floor(this.config.LANES.COUNT / 2);
        this.targetLane = this.lane;
        this.currentX = this.calculateLaneX(this.lane);
        this.targetX = this.currentX;
        this.rotation = 0;
        this.targetRotation = 0;
        this.scale = 1;
        this.bobOffset = 0;
    }
}
