class AudioSystem {
    constructor() {
        this.ctx = null;
        this.muted = false;
        this.init();
    }
    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
        }
    }
    playTone(freq, type, duration, vol = 0.1, slideFreq = null) {
        if (this.muted || !this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        if (slideFreq) osc.frequency.exponentialRampToValueAtTime(slideFreq, this.ctx.currentTime + duration);
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }
    jump() { this.playTone(300, 'square', 0.2, 0.1, 600); }
    coin() { this.playTone(1000, 'sine', 0.1, 0.1, 1500); }
    stomp() { this.playTone(200, 'square', 0.1, 0.1, 100); }
    powerup() { this.playTone(400, 'square', 0.4, 0.1, 800); }
    fireball() { this.playTone(800, 'sawtooth', 0.1, 0.05, 400); }
    bump() { this.playTone(150, 'sawtooth', 0.1, 0.1); }
    die() { this.playTone(250, 'sawtooth', 0.5, 0.1, 50); }
    win() { this.playTone(400, 'square', 1.0, 0.1, 600); }
    toggleMute() { this.muted = !this.muted; return this.muted; }
}
const audio = new AudioSystem();
