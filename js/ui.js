class UI {
    constructor(game) {
        this.game = game;
        this.hud = {
            world: document.getElementById('hud-world'),
            lives: document.getElementById('hud-lives'),
            coins: document.getElementById('hud-coins'),
            score: document.getElementById('hud-score'),
            high: document.getElementById('hud-high'),
            time: document.getElementById('hud-time')
        };
        this.screens = {
            start: document.getElementById('start-screen'),
            pause: document.getElementById('pause-screen'),
            gameOver: document.getElementById('game-over-screen'),
            levelComplete: document.getElementById('level-complete-screen'),
            victory: document.getElementById('victory-screen')
        };
        this.bindEvents();
    }

    bindEvents() {
        // Keyboard
        window.addEventListener('keydown', (e) => this.handleKey(e, true));
        window.addEventListener('keyup', (e) => this.handleKey(e, false));

        // Mobile Controls
        const bindTouch = (id, key) => {
            const el = document.getElementById(id);
            if(!el) return;
            el.addEventListener('touchstart', (e) => { e.preventDefault(); this.game.keys[key] = true; });
            el.addEventListener('touchend', (e) => { e.preventDefault(); this.game.keys[key] = false; });
        };
        bindTouch('btn-left', 'left');
        bindTouch('btn-right', 'right');
        bindTouch('btn-jump', 'jump');
        
        const actionBtn = document.getElementById('btn-action');
        if(actionBtn) {
            actionBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this.game.player.shoot(); });
        }

        // Screen Taps
        document.querySelectorAll('.menu').forEach(menu => {
            menu.addEventListener('click', () => {
                if (this.game.state === 'start') this.game.startLevel(0);
                else if (this.game.state === 'gameover' || this.game.state === 'victory') this.game.resetGame();
                else if (this.game.state === 'paused') this.game.togglePause();
            });
        });

        // UI Buttons
        document.getElementById('btn-fullscreen').addEventListener('click', (e) => {
            e.stopPropagation();
            if (!document.fullscreenElement) document.documentElement.requestFullscreen();
            else document.exitFullscreen();
        });
        document.getElementById('btn-mute').addEventListener('click', (e) => {
            e.stopPropagation();
            const muted = audio.toggleMute();
            e.target.innerText = `Mute: ${muted ? 'ON' : 'OFF'}`;
        });
    }

    handleKey(e, isDown) {
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.game.keys.left = isDown;
        if (e.code === 'ArrowRight' || e.code === 'KeyD') this.game.keys.right = isDown;
        if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
            this.game.keys.jump = isDown;
        }
        if (e.code === 'ShiftLeft' || e.code === 'KeyF') {
            if (isDown && !this.game.keys.action) this.game.player.shoot();
            this.game.keys.action = isDown;
        }

        if (isDown && e.code === 'Enter') {
            if (this.game.state === 'start') this.game.startLevel(0);
            else if (this.game.state === 'gameover' || this.game.state === 'victory') this.game.resetGame();
        }
        if (isDown && e.code === 'Escape') {
            if (this.game.state === 'playing' || this.game.state === 'paused') this.game.togglePause();
        }
    }

    updateHUD(data) {
        this.hud.world.innerText = `1-${data.level + 1}`;
        this.hud.lives.innerText = data.lives;
        this.hud.coins.innerText = data.coins.toString().padStart(2, '0');
        this.hud.score.innerText = data.score.toString().padStart(6, '0');
        this.hud.high.innerText = data.highScore.toString().padStart(6, '0');
        this.hud.time.innerText = Math.ceil(data.time).toString().padStart(3, '0');
    }

    showScreen(screenName) {
        Object.values(this.screens).forEach(s => s.classList.remove('active'));
        if (screenName && this.screens[screenName]) {
            this.screens[screenName].classList.add('active');
        }
    }
}
