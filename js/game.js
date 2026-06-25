class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d', { alpha: false });
        this.ui = new UI(this);
        
        this.state = 'start'; // start, playing, paused, gameover, complete, victory
        this.keys = { left: false, right: false, jump: false, action: false };
        
        this.lastTime = 0;
        this.cameraX = 0;
        
        // Game Data
        this.lives = 3;
        this.score = 0;
        this.coins = 0;
        this.currentLevelIndex = 0;
        this.timeLeft = 300;
        this.highScore = parseInt(localStorage.getItem('mario_highScore')) || 0;
        
        this.player = new Player(50, 50);
        this.level = null;
        
        requestAnimationFrame((t) => this.loop(t));
    }

    resetGame() {
        this.lives = 3;
        this.score = 0;
        this.coins = 0;
        this.startLevel(0);
    }

    startLevel(index) {
        if (index >= levelMaps.length) {
            this.state = 'victory';
            this.ui.showScreen('victory');
            audio.win();
            return;
        }
        audio.init(); // Ensure audio context is ready after user interaction
        this.currentLevelIndex = index;
        this.level = new Level(index);
        this.player.reset(this.level.startX, this.level.startY);
        this.cameraX = 0;
        this.timeLeft = 300;
        this.levelComplete = false;
        
        this.state = 'playing';
        this.ui.showScreen(null); // Hide menus
    }

    addCoin() {
        this.coins++;
        this.addScore(100);
        if (this.coins >= 100) {
            this.coins = 0;
            this.lives++;
            audio.powerup(); // 1-UP sound
        }
    }

    addScore(points) {
        this.score += points;
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('mario_highScore', this.highScore);
        }
    }

    handlePlayerDamage(forceDeath = false) {
        if (forceDeath || this.player.damage()) {
            this.lives--;
            setTimeout(() => {
                if (this.lives > 0) {
                    this.startLevel(this.currentLevelIndex);
                } else {
                    this.state = 'gameover';
                    this.ui.showScreen('gameOver');
                }
            }, 2000);
            return true;
        }
        return false;
    }

    triggerLevelComplete() {
        this.levelComplete = true;
        this.state = 'complete';
        this.ui.showScreen('levelComplete');
        audio.win();
        
        // Add time score
        this.addScore(Math.floor(this.timeLeft) * 10);
        
        setTimeout(() => {
            this.startLevel(this.currentLevelIndex + 1);
        }, 3000);
    }

    togglePause() {
        if (this.state === 'playing') {
            this.state = 'paused';
            this.ui.showScreen('pause');
        } else if (this.state === 'paused') {
            this.state = 'playing';
            this.ui.showScreen(null);
            this.lastTime = performance.now(); // Prevent time jump
        }
    }

    update(dt) {
        if (this.state !== 'playing') return;

        // Timer
        this.timeLeft -= dt;
        if (this.timeLeft <= 0) {
            this.handlePlayerDamage(true); // Die from time out
        }

        this.player.update(dt, this.keys, this.level, this);
        this.level.update(dt);

        // Camera follow
        if (!this.player.dead) {
            const targetX = this.player.x - 300;
            if (targetX > this.cameraX) {
                this.cameraX = targetX;
            }
            // Clamp camera to level bounds
            if (this.cameraX > this.level.width - 800) {
                this.cameraX = this.level.width - 800;
            }
        }
    }

    draw() {
        // Clear background
        this.ctx.fillStyle = '#5C94FC';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.level) {
            this.level.draw(this.ctx, this.cameraX);
        }
        
        this.player.draw(this.ctx, this.cameraX);

        this.ui.updateHUD({
            level: this.currentLevelIndex,
            lives: this.lives,
            coins: this.coins,
            score: this.score,
            highScore: this.highScore,
            time: this.timeLeft
        });
    }

    loop(timestamp) {
        const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1); // Max dt 0.1s to prevent physics breaking on lag
        this.lastTime = timestamp;

        if (this.state === 'playing') {
            this.update(dt);
        }
        
        // Always draw to keep visual state behind menus
        if (this.state !== 'start') {
            this.draw();
        }

        requestAnimationFrame((t) => this.loop(t));
    }
}

// Start Game Engine when window loads
window.onload = () => {
    const game = new Game();
};
