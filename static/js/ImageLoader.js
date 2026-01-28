// ==================== IMAGE LOADER ====================

export class ImageLoader {
    constructor() {
        this.images = {};
        this.loadedCount = 0;
        this.totalCount = 0;
    }

    loadImage(key, src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            
            img.onload = () => {
                this.images[key] = img;
                this.loadedCount++;
                resolve(img);
            };

            img.onerror = () => {
                console.warn(`Failed to load image: ${src}, using fallback`);
                this.images[key] = null;
                this.loadedCount++;
                resolve(null);
            };

            img.src = src;
        });
    }

    async loadAll(config) {
        const imagesToLoad = [];

        // Load player sprite
        imagesToLoad.push(
            this.loadImage('player', config.PLAYER.SPRITE)
        );

        // Load object sprites
        for (const [key, type] of Object.entries(config.OBJECT_TYPES)) {
            imagesToLoad.push(
                this.loadImage(key.toLowerCase(), type.sprite)
            );
        }

        this.totalCount = imagesToLoad.length;
        await Promise.all(imagesToLoad);

        return this.images;
    }

    getImage(key) {
        return this.images[key] || null;
    }

    isLoaded() {
        return this.loadedCount === this.totalCount;
    }

    getProgress() {
        return this.totalCount > 0 ? this.loadedCount / this.totalCount : 0;
    }
}
