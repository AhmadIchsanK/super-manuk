class Player {
    constructor(x, y) {
        this.reset(x, y);
    }

    reset(x, y) {
        this.x = x;
        this.y = y;
        this.w = 26;
        this.h = 30; // Small size
        this.vx = 0;
        this.vy = 0;
        this.speed = 200;
        this.maxSpeed = 250;
        this.jumpForce = -550;
        this.gravity = 1500;
        this.onGround = false;
        
        this.state = 'small'; // small, super, fire
        this.invincible = 0;
        this.starTimer = 0;
        this.dead = false;
        this.fireballs = [];
        this.dir = 1;
    }

    upgrade(type) {
        if (type === 'mushroom' && this.state === 'small') {
            this.state = 'super';
            this.y -= 32;
            this.h = 62;
            audio.powerup();
            return 1000;
        } else if (type === 'star') {
            this.starTimer = 10;
            audio.powerup();
            return 1000;
        }
        return 0; // Already upgraded
    }

    damage() {
        if (this.invincible > 0 || this.starTimer > 0) return false;
        if (this.state !== 'small') {
            this.state = 'small';
            this.h = 30;
            this.invincible = 2; // 2 seconds i-frames
            audio.bump();
            return false; // Didn't die
        } else {
            this.dead = true;
            this.vy = -400; // Death hop
            audio.die();
            return true; // Died
        }
    }

    shoot() {
        if (this.state === 'fire' && this.fireballs.length < 2) {
            this.fireballs.push({
                x: this.x + (this.dir===1 ? this.w : -10),
                y: this.y + 16,
                vx: 400 * this.dir,
                vy: 0,
                active: true
            });
            audio.fireball();
        }
    }

    update(dt, keys, level, game) {
        if (this.dead) {
            this.y += this.vy * dt;
            this.vy += this.gravity * dt;
            return;
        }

        if (this.invincible > 0) this.invincible -= dt;
        if (this.starTimer > 0) this.starTimer -= dt;

        // Input
        if (keys.left) { this.vx = -this.speed; this.dir = -1; }
        else if (keys.right) { this.vx = this.speed; this.dir = 1; }
        else { this.vx = 0; }

        if (keys.jump && this.onGround) {
            this.vy = this.jumpForce;
            this.onGround = false;
            audio.jump();
        }

        // Fireball update
        this.fireballs.forEach(fb => {
            fb.x += fb.vx * dt;
            fb.vy += this.gravity * dt;
            fb.y += fb.vy * dt;
            if (level.getBlock(fb.x, fb.y)) {
                fb.vy = -300; // Bounce
            }
            // Simple remove if off screen
            if (fb.x < game.cameraX || fb.x > game.cameraX + 800 || fb.y > 480) fb.active = false;
        });
        this.fireballs = this.fireballs.filter(fb => fb.active);

        // Physics & Collision
        this.vy += this.gravity * dt;
        
        // Y Axis Collision
        this.y += this.vy * dt;
        this.onGround = false;
        this.checkCollision(level, 'y', game);

        // X Axis Collision
        this.x += this.vx * dt;
        if (this.x < game.cameraX) this.x = game.cameraX; // Prevent going backwards offscreen
        this.checkCollision(level, 'x', game);

        // Enemy Collision
        level.enemies.forEach(enemy => {
            if (this.x < enemy.x + enemy.w && this.x + this.w > enemy.x &&
                this.y < enemy.y + enemy.h && this.y + this.h > enemy.y) {
                
                if (this.starTimer > 0) {
                    enemy.dead = true;
                    game.addScore(100);
                    audio.stomp();
                } else if (this.vy > 0 && this.y + this.h < enemy.y + 16) { // Stomp
                    if (enemy.type === 'koopa' && !enemy.shellMode) {
                        enemy.stomp();
                        this.vy = -300;
                    } else if (enemy.type === 'koopa' && enemy.shellMode && enemy.vx === 0) {
                        enemy.stomp();
                        this.vy = -300;
                    } else {
                        enemy.dead = true;
                        this.vy = -400; // Bounce off enemy
                    }
                    audio.stomp();
                    game.addScore(100);
                } else {
                    if (game.handlePlayerDamage()) {
                        // Game handled death
                    }
                }
            }
        });

        // Item Collision
        level.items.forEach(item => {
            if (this.x < item.x + item.w && this.x + this.w > item.x &&
                this.y < item.y + item.h && this.y + this.h > item.y) {
                game.addScore(this.upgrade(item.type));
                item.collected = true;
            }
        });
        level.items = level.items.filter(i => !i.collected);

        // Flag Collision
        if (!game.levelComplete) {
            const centerCol = Math.floor((this.x + this.w/2) / TILE_SIZE);
            const centerRow = Math.floor((this.y + this.h/2) / TILE_SIZE);
            const block = level.getBlock(this.x + this.w/2, this.y + this.h/2);
            if (block && (block.type === 'flagpole' || block.type === 'flagtop')) {
                game.triggerLevelComplete();
            }
        }

        // Death by falling
        if (this.y > 600) {
            this.dead = true;
            game.handlePlayerDamage(true); // force death
        }
    }

    checkCollision(level, axis, game) {
        const leftCol = Math.floor(this.x / TILE_SIZE);
        const rightCol = Math.floor((this.x + this.w - 1) / TILE_SIZE);
        const topRow = Math.floor(this.y / TILE_SIZE);
        const bottomRow = Math.floor((this.y + this.h - 1) / TILE_SIZE);

        for (let row = topRow; row <= bottomRow; row++) {
            for (let col = leftCol; col <= rightCol; col++) {
                if (row < 0 || row >= level.map.length || col < 0 || col >= level.map[0].length) continue;
                
                const block = level.map[row][col];
                if (!block) continue;

                if (block.type === 'ground' || block.type === 'question' || block.type === 'flagpole' || block.type === 'flagtop') {
                    if (block.type === 'flagpole' || block.type === 'flagtop') continue; // Handled separately

                    if (axis === 'y') {
                        if (this.vy > 0) { // Falling
                            this.y = row * TILE_SIZE - this.h;
                            this.vy = 0;
                            this.onGround = true;
                        } else if (this.vy < 0) { // Jumping up
                            this.y = (row + 1) * TILE_SIZE;
                            this.vy = 0;
                            
                            // Hit block
                            if (block.type === 'question' && !block.used) {
                                block.used = true;
                                if (block.item === 'coin') {
                                    game.addCoin();
                                    audio.coin();
                                } else {
                                    level.spawnItem(col * TILE_SIZE, row * TILE_SIZE, block.item);
                                    audio.powerup(); // play spawn sound
                                }
                            } else {
                                audio.bump();
                            }
                        }
                    } else if (axis === 'x') {
                        if (this.vx > 0) {
                            this.x = col * TILE_SIZE - this.w;
                        } else if (this.vx < 0) {
                            this.x = (col + 1) * TILE_SIZE;
                        }
                    }
                } else if (block.type === 'coin') {
                    level.map[row][col] = null; // Remove coin
                    game.addCoin();
                    audio.coin();
                }
            }
        }
    }

    draw(ctx, cameraX) {
        if (this.invincible > 0 && Math.floor(Date.now() / 100) % 2 === 0) return; // Blink

        let color = '#F83800'; // Red
        if (this.starTimer > 0) color = (Math.floor(Date.now() / 50) % 2 === 0) ? '#FFF' : '#F8D820';
        else if (this.state === 'fire') color = '#FFF'; // White for fire

        ctx.fillStyle = color;
        ctx.fillRect(this.x - cameraX, this.y, this.w, this.h);
        
        // Draw face indicator based on direction
        ctx.fillStyle = '#FFA000'; // Skin tone
        ctx.fillRect(this.x - cameraX + (this.dir===1 ? 14 : 2), this.y + 4, 10, 10);

        // Draw fireballs
        ctx.fillStyle = '#F83800';
        this.fireballs.forEach(fb => {
            ctx.beginPath();
            ctx.arc(fb.x - cameraX, fb.y, 6, 0, Math.PI*2);
            ctx.fill();
        });
    }
}
