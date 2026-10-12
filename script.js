class SimonGame {
    constructor() {
        this.sequence = [];
        this.playerSequence = [];
        this.score = 0;
        this.round = 1;
        this.highScore = parseInt(localStorage.getItem('simonHighScore')) || 0;
        this.isPlaying = false;
        this.isStrictMode = false;
        this.difficulty = 'medium';
        this.speeds = {
            easy: 1000,
            medium: 600,
            hard: 300
        };
        this.audioContext = null;
        
        this.colors = ['green', 'red', 'yellow', 'blue'];
        this.frequencies = {
            green: 392,
            red: 329.63,
            yellow: 261.63,
            blue: 220
        };
        
        this.init();
    }
    
    init() {
        this.buttons = document.querySelectorAll('.button');
        this.startBtn = document.getElementById('startBtn');
        this.restartBtn = document.getElementById('restartBtn');
        this.strictBtn = document.getElementById('strictBtn');
        this.darkModeBtn = document.getElementById('darkModeBtn');
        this.difficultySelect = document.getElementById('difficulty');
        this.scoreDisplay = document.getElementById('score');
        this.roundDisplay = document.getElementById('round');
        this.highScoreDisplay = document.getElementById('highScore');
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        this.statusMessage = document.getElementById('statusMessage');
        this.container = document.querySelector('.container');
        
        this.highScoreDisplay.textContent = this.highScore;
        
        this.addEventListeners();
        this.loadDarkMode();
    }
    
    addEventListeners() {
        this.startBtn.addEventListener('click', () => this.startGame());
        this.restartBtn.addEventListener('click', () => this.restartGame());
        this.strictBtn.addEventListener('click', () => this.toggleStrictMode());
        this.darkModeBtn.addEventListener('click', () => this.toggleDarkMode());
        this.difficultySelect.addEventListener('change', (e) => {
            this.difficulty = e.target.value;
        });
        
        this.buttons.forEach(button => {
            button.addEventListener('click', (e) => this.handlePlayerInput(e));
            button.addEventListener('mousedown', (e) => this.activateButton(e.target));
            button.addEventListener('mouseup', (e) => this.deactivateButton(e.target));
            button.addEventListener('mouseleave', (e) => this.deactivateButton(e.target));
            
            button.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.activateButton(e.target);
            });
            button.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.deactivateButton(e.target);
            });
        });
    }
    
    initAudio() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
    }
    
    playSound(color) {
        this.initAudio();
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = this.frequencies[color];
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.3);
    }
    
    playErrorSound() {
        this.initAudio();
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = 150;
        oscillator.type = 'sawtooth';
        
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.5);
    }
    
    activateButton(button) {
        if (!button.classList.contains('button')) return;
        
        const color = button.dataset.color;
        button.classList.add('active');
        this.playSound(color);
    }
    
    deactivateButton(button) {
        if (!button.classList.contains('button')) return;
        button.classList.remove('active');
    }
    
    async startGame() {
        this.initAudio();
        this.sequence = [];
        this.playerSequence = [];
        this.score = 0;
        this.round = 1;
        this.isPlaying = true;
        
        this.updateDisplays();
        this.startBtn.disabled = true;
        this.difficultySelect.disabled = true;
        
        this.statusMessage.textContent = 'Watch the sequence...';
        
        await this.delay(500);
        this.nextRound();
    }
    
    restartGame() {
        this.isPlaying = false;
        this.startBtn.disabled = false;
        this.difficultySelect.disabled = false;
        this.sequence = [];
        this.playerSequence = [];
        this.score = 0;
        this.round = 1;
        
        this.updateDisplays();
        this.progressFill.style.width = '0%';
        this.progressText.textContent = 'Press Start to Begin';
        this.statusMessage.textContent = '';
    }
    
    toggleStrictMode() {
        this.isStrictMode = !this.isStrictMode;
        this.strictBtn.classList.toggle('active', this.isStrictMode);
        this.strictBtn.textContent = `Strict Mode: ${this.isStrictMode ? 'ON' : 'OFF'}`;
    }
    
    toggleDarkMode() {
        document.body.classList.toggle('dark-mode');
        const isDarkMode = document.body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isDarkMode);
        this.darkModeBtn.textContent = isDarkMode ? '☀️' : '🌙';
    }
    
    loadDarkMode() {
        const isDarkMode = localStorage.getItem('darkMode') === 'true';
        if (isDarkMode) {
            document.body.classList.add('dark-mode');
            this.darkModeBtn.textContent = '☀️';
        }
    }
    
    async nextRound() {
        this.playerSequence = [];
        this.addColorToSequence();
        this.updateDisplays();
        
        this.statusMessage.textContent = 'Watch the sequence...';
        this.progressText.textContent = `Round ${this.round}`;
        
        await this.delay(500);
        await this.playSequence();
        
        this.statusMessage.textContent = 'Your turn!';
    }
    
    addColorToSequence() {
        const randomColor = this.colors[Math.floor(Math.random() * this.colors.length)];
        this.sequence.push(randomColor);
    }
    
    async playSequence() {
        const speed = this.speeds[this.difficulty];
        
        for (let i = 0; i < this.sequence.length; i++) {
            const color = this.sequence[i];
            const button = document.querySelector(`[data-color="${color}"]`);
            
            this.activateButton(button);
            await this.delay(speed);
            this.deactivateButton(button);
            await this.delay(speed / 2);
        }
    }
    
    handlePlayerInput(e) {
        if (!this.isPlaying) return;
        
        const button = e.target;
        const color = button.dataset.color;
        
        this.playerSequence.push(color);
        
        const currentIndex = this.playerSequence.length - 1;
        
        if (this.playerSequence[currentIndex] !== this.sequence[currentIndex]) {
            this.handleMistake();
            return;
        }
        
        this.updateProgress();
        
        if (this.playerSequence.length === this.sequence.length) {
            this.score += this.round * 10;
            this.round++;
            this.updateDisplays();
            this.updateHighScore();
            
            this.statusMessage.textContent = 'Correct!';
            
            setTimeout(() => {
                this.nextRound();
            }, 1000);
        }
    }
    
    updateProgress() {
        const progress = (this.playerSequence.length / this.sequence.length) * 100;
        this.progressFill.style.width = `${progress}%`;
    }
    
    async handleMistake() {
        this.playErrorSound();
        this.statusMessage.textContent = 'Wrong!';
        
        this.container.classList.add('shake');
        document.body.classList.add('flash');
        
        await this.delay(500);
        
        this.container.classList.remove('shake');
        document.body.classList.remove('flash');
        
        if (this.isStrictMode) {
            this.statusMessage.textContent = 'Game Over! Strict Mode';
            this.restartGame();
        } else {
            this.statusMessage.textContent = 'Try again!';
            this.playerSequence = [];
            this.progressFill.style.width = '0%';
            
            await this.delay(1000);
            await this.playSequence();
            
            this.statusMessage.textContent = 'Your turn!';
        }
    }
    
    updateDisplays() {
        this.scoreDisplay.textContent = this.score;
        this.roundDisplay.textContent = this.round;
    }
    
    updateHighScore() {
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.highScoreDisplay.textContent = this.highScore;
            localStorage.setItem('simonHighScore', this.highScore);
        }
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new SimonGame();
});
