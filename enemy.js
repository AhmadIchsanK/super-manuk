class Enemy {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.vx = -50;
        this.vy = 0;
        this.dead = false;
        this.stompable = true;
        this.type = 'enemy';
    }

    update(dt, level) {
        this.vy += 1500 * dt; // Gravity
        
        // Y Collision
        this.y += this.vy * dt;
        let col = Math.floor((this.x + this.w/2) / TILE_SIZE);
        let row = Math.floor((this.y + this.h) / TILE_SIZE);
        
        if (this.vy > 0 && level.getBlock(this.x + this.w/2, this.y + this.h)) {
            this.y = row * TILE_SIZE - this.h;
            this.vy = 0;
        }

        // X Collision
        this.x += this.vx * dt;
        let checkX = this.vx > 0 ? this.x + this.w : this.x;
        let checkY = this.y + this.h / 2;
        
        if (level.getBlock(checkX, checkY)) {
            this.vx *= -1;
        }
    }
}

class Goomba extends Enemy {
    constructor(x, y) {
        super(x, y, 32, 32);
        this.type = 'goomba';
    }
    draw(ctx, cameraX) {
        ctx.fillStyle = '#883800'; // Brown
        ctx.fillRect(this.x - cameraX, this.y, this.w, this.h);
        ctx.fillStyle = '#000';
        ctx.fillRect(this.x - cameraX + 8, this.y + 10, 4, 8);
        ctx.fillRect(this.x - cameraX + 20, this.y + 10, 4, 8);
    }
}

class Koopa extends Enemy {
    constructor(x, y) {
        super(x, y - 16, 32, 48); // Taller
        this.type = 'koopa';
        this.shellMode = false;
    }
    update(dt, level) {
        super.update(dt, level);
    }
    stomp() {
        if (!this.shellMode) {
            this.shellMode = true;
            this.h = 32;
            this.y += 16;
            this.vx = 0;
        } else {
            this.vx = this.vx === 0 ? 300 : 0; // Kick
        }
    }
    draw(ctx, cameraX) {
        ctx.fillStyle = this.shellMode ? '#00A800' : '#F8D820'; // Green shell or Yellow body
        ctx.fillRect(this.x - cameraX, this.y, this.w, this.h);
        if (!this.shellMode) {
            ctx.fillStyle = '#00A800'; // Shell on back
            ctx.fillRect(this.x - cameraX + (this.vx>0?-10:10), this.y + 16, 20, 24);
        }
    }
