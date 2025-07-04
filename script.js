class Tetris {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.context = this.canvas.getContext('2d');
        this.nextCanvas = document.getElementById('next-canvas');
        this.nextContext = this.nextCanvas.getContext('2d');
        
        this.BOARD_WIDTH = 10;
        this.BOARD_HEIGHT = 20;
        this.BLOCK_SIZE = 30;
        
        this.board = [];
        this.currentPiece = null;
        this.nextPiece = null;
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.dropCounter = 0;
        this.dropInterval = 1000;
        this.lastTime = 0;
        
        this.gameState = 'start'; // start, playing, paused, gameOver
        this.audioEnabled = true;
        
        this.pieces = {
            'I': [
                [0,0,0,0],
                [1,1,1,1],
                [0,0,0,0],
                [0,0,0,0]
            ],
            'O': [
                [1,1],
                [1,1]
            ],
            'T': [
                [0,1,0],
                [1,1,1],
                [0,0,0]
            ],
            'S': [
                [0,1,1],
                [1,1,0],
                [0,0,0]
            ],
            'Z': [
                [1,1,0],
                [0,1,1],
                [0,0,0]
            ],
            'J': [
                [1,0,0],
                [1,1,1],
                [0,0,0]
            ],
            'L': [
                [0,0,1],
                [1,1,1],
                [0,0,0]
            ]
        };
        
        this.colors = {
            'I': '#00f5ff',
            'O': '#ffff00',
            'T': '#800080',
            'S': '#00ff00',
            'Z': '#ff0000',
            'J': '#0000ff',
            'L': '#ff8c00'
        };
        
        this.init();
    }
    
    init() {
        this.createBoard();
        this.setupEventListeners();
        this.showStartScreen();
        this.setupCanvasScale();
    }
    
    setupCanvasScale() {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.context.scale(dpr, dpr);
        
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
    }
    
    createBoard() {
        this.board = Array(this.BOARD_HEIGHT).fill().map(() => Array(this.BOARD_WIDTH).fill(0));
    }
    
    setupEventListeners() {
        // Button events
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        document.getElementById('pause-btn').addEventListener('click', () => this.togglePause());
        document.getElementById('resume-btn').addEventListener('click', () => this.togglePause());
        document.getElementById('restart-btn').addEventListener('click', () => this.restartGame());
        document.getElementById('new-game-btn').addEventListener('click', () => this.startGame());
        document.getElementById('mute-btn').addEventListener('click', () => this.toggleMute());
        
        // Keyboard events
        document.addEventListener('keydown', (event) => this.handleKeyPress(event));
        
        // Touch events for mobile
        this.setupTouchControls();
    }
    
    setupTouchControls() {
        let touchStartX = 0;
        let touchStartY = 0;
        
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            
            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;
            
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                if (Math.abs(deltaX) > 30) {
                    if (deltaX > 0) {
                        this.movePiece(1);
                    } else {
                        this.movePiece(-1);
                    }
                }
            } else {
                if (deltaY > 30) {
                    this.dropPiece();
                } else if (deltaY < -30) {
                    this.rotatePiece();
                }
            }
        });
    }
    
    handleKeyPress(event) {
        if (this.gameState !== 'playing') return;
        
        switch(event.code) {
            case 'ArrowLeft':
                this.movePiece(-1);
                break;
            case 'ArrowRight':
                this.movePiece(1);
                break;
            case 'ArrowDown':
                this.dropPiece();
                break;
            case 'ArrowUp':
                this.rotatePiece();
                break;
            case 'Space':
                this.hardDrop();
                break;
            case 'KeyP':
                this.togglePause();
                break;
        }
    }
    
    startGame() {
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.dropInterval = 1000;
        this.createBoard();
        this.currentPiece = this.createPiece();
        this.nextPiece = this.createPiece();
        this.gameState = 'playing';
        this.hideAllScreens();
        this.updateDisplay();
        this.gameLoop();
    }
    
    restartGame() {
        this.startGame();
    }
    
    togglePause() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            this.showPauseScreen();
        } else if (this.gameState === 'paused') {
            this.gameState = 'playing';
            this.hidePauseScreen();
            this.gameLoop();
        }
    }
    
    toggleMute() {
        this.audioEnabled = !this.audioEnabled;
        document.getElementById('mute-btn').textContent = this.audioEnabled ? '音声ON/OFF' : '音声OFF';
    }
    
    createPiece() {
        const types = Object.keys(this.pieces);
        const type = types[Math.floor(Math.random() * types.length)];
        return {
            shape: this.pieces[type],
            type: type,
            x: Math.floor(this.BOARD_WIDTH / 2) - Math.floor(this.pieces[type][0].length / 2),
            y: 0,
            color: this.colors[type]
        };
    }
    
    movePiece(direction) {
        this.currentPiece.x += direction;
        if (this.checkCollision()) {
            this.currentPiece.x -= direction;
        }
    }
    
    dropPiece() {
        this.currentPiece.y++;
        if (this.checkCollision()) {
            this.currentPiece.y--;
            this.placePiece();
        }
    }
    
    hardDrop() {
        while (!this.checkCollision()) {
            this.currentPiece.y++;
        }
        this.currentPiece.y--;
        this.placePiece();
    }
    
    rotatePiece() {
        const original = this.currentPiece.shape;
        this.currentPiece.shape = this.rotateMatrix(this.currentPiece.shape);
        
        if (this.checkCollision()) {
            // Try wall kicks
            const originalX = this.currentPiece.x;
            this.currentPiece.x += 1;
            if (this.checkCollision()) {
                this.currentPiece.x = originalX - 1;
                if (this.checkCollision()) {
                    this.currentPiece.x = originalX;
                    this.currentPiece.shape = original;
                }
            }
        }
    }
    
    rotateMatrix(matrix) {
        const rotated = matrix[0].map((_, index) => 
            matrix.map(row => row[index]).reverse()
        );
        return rotated;
    }
    
    checkCollision() {
        for (let y = 0; y < this.currentPiece.shape.length; y++) {
            for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                if (this.currentPiece.shape[y][x]) {
                    const newX = this.currentPiece.x + x;
                    const newY = this.currentPiece.y + y;
                    
                    if (newX < 0 || newX >= this.BOARD_WIDTH || 
                        newY >= this.BOARD_HEIGHT ||
                        (newY >= 0 && this.board[newY][newX])) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    
    placePiece() {
        for (let y = 0; y < this.currentPiece.shape.length; y++) {
            for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                if (this.currentPiece.shape[y][x]) {
                    const boardY = this.currentPiece.y + y;
                    const boardX = this.currentPiece.x + x;
                    
                    if (boardY >= 0) {
                        this.board[boardY][boardX] = this.currentPiece.color;
                    }
                }
            }
        }
        
        this.clearLines();
        this.currentPiece = this.nextPiece;
        this.nextPiece = this.createPiece();
        
        if (this.checkCollision()) {
            this.gameOver();
        }
    }
    
    clearLines() {
        let linesCleared = 0;
        
        for (let y = this.BOARD_HEIGHT - 1; y >= 0; y--) {
            if (this.board[y].every(cell => cell !== 0)) {
                this.board.splice(y, 1);
                this.board.unshift(Array(this.BOARD_WIDTH).fill(0));
                linesCleared++;
                y++; // Check the same line again
            }
        }
        
        if (linesCleared > 0) {
            this.lines += linesCleared;
            this.score += this.calculateScore(linesCleared);
            this.level = Math.floor(this.lines / 10) + 1;
            this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 100);
            this.updateDisplay();
        }
    }
    
    calculateScore(linesCleared) {
        const baseScore = [0, 40, 100, 300, 1200];
        return baseScore[linesCleared] * this.level;
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        this.showGameOverScreen();
    }
    
    gameLoop(currentTime = 0) {
        if (this.gameState !== 'playing') return;
        
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        this.dropCounter += deltaTime;
        if (this.dropCounter > this.dropInterval) {
            this.dropPiece();
            this.dropCounter = 0;
        }
        
        this.draw();
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    draw() {
        // Clear canvas
        this.context.fillStyle = 'rgba(0, 0, 0, 0.1)';
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw board
        this.drawBoard();
        
        // Draw current piece
        if (this.currentPiece) {
            this.drawPiece(this.currentPiece, this.context);
        }
        
        // Draw ghost piece
        if (this.currentPiece) {
            this.drawGhostPiece();
        }
        
        // Draw next piece
        this.drawNextPiece();
    }
    
    drawBoard() {
        for (let y = 0; y < this.BOARD_HEIGHT; y++) {
            for (let x = 0; x < this.BOARD_WIDTH; x++) {
                if (this.board[y][x]) {
                    this.context.fillStyle = this.board[y][x];
                    this.context.fillRect(x * this.BLOCK_SIZE, y * this.BLOCK_SIZE, 
                                        this.BLOCK_SIZE - 1, this.BLOCK_SIZE - 1);
                }
            }
        }
    }
    
    drawPiece(piece, context, offsetX = 0, offsetY = 0) {
        context.fillStyle = piece.color;
        for (let y = 0; y < piece.shape.length; y++) {
            for (let x = 0; x < piece.shape[y].length; x++) {
                if (piece.shape[y][x]) {
                    context.fillRect(
                        (piece.x + x + offsetX) * this.BLOCK_SIZE,
                        (piece.y + y + offsetY) * this.BLOCK_SIZE,
                        this.BLOCK_SIZE - 1,
                        this.BLOCK_SIZE - 1
                    );
                }
            }
        }
    }
    
    drawGhostPiece() {
        const ghost = { ...this.currentPiece };
        while (!this.checkCollisionForPiece(ghost)) {
            ghost.y++;
        }
        ghost.y--;
        
        this.context.fillStyle = this.currentPiece.color + '40';
        for (let y = 0; y < ghost.shape.length; y++) {
            for (let x = 0; x < ghost.shape[y].length; x++) {
                if (ghost.shape[y][x]) {
                    this.context.fillRect(
                        (ghost.x + x) * this.BLOCK_SIZE,
                        (ghost.y + y) * this.BLOCK_SIZE,
                        this.BLOCK_SIZE - 1,
                        this.BLOCK_SIZE - 1
                    );
                }
            }
        }
    }
    
    checkCollisionForPiece(piece) {
        for (let y = 0; y < piece.shape.length; y++) {
            for (let x = 0; x < piece.shape[y].length; x++) {
                if (piece.shape[y][x]) {
                    const newX = piece.x + x;
                    const newY = piece.y + y;
                    
                    if (newX < 0 || newX >= this.BOARD_WIDTH || 
                        newY >= this.BOARD_HEIGHT ||
                        (newY >= 0 && this.board[newY][newX])) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    
    drawNextPiece() {
        this.nextContext.fillStyle = 'rgba(0, 0, 0, 0.1)';
        this.nextContext.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
        
        if (this.nextPiece) {
            const blockSize = 20;
            const offsetX = (this.nextCanvas.width - this.nextPiece.shape[0].length * blockSize) / 2 / blockSize;
            const offsetY = (this.nextCanvas.height - this.nextPiece.shape.length * blockSize) / 2 / blockSize;
            
            this.nextContext.fillStyle = this.nextPiece.color;
            for (let y = 0; y < this.nextPiece.shape.length; y++) {
                for (let x = 0; x < this.nextPiece.shape[y].length; x++) {
                    if (this.nextPiece.shape[y][x]) {
                        this.nextContext.fillRect(
                            (x + offsetX) * blockSize,
                            (y + offsetY) * blockSize,
                            blockSize - 1,
                            blockSize - 1
                        );
                    }
                }
            }
        }
    }
    
    updateDisplay() {
        document.getElementById('score').textContent = this.score.toLocaleString();
        document.getElementById('level').textContent = this.level;
        document.getElementById('lines').textContent = this.lines;
        document.getElementById('final-score').textContent = this.score.toLocaleString();
    }
    
    showStartScreen() {
        this.hideAllScreens();
        document.getElementById('start-screen').classList.add('active');
        document.getElementById('game-overlay').style.display = 'flex';
    }
    
    showPauseScreen() {
        this.hideAllScreens();
        document.getElementById('pause-screen').classList.add('active');
        document.getElementById('game-overlay').style.display = 'flex';
    }
    
    hidePauseScreen() {
        document.getElementById('game-overlay').style.display = 'none';
    }
    
    showGameOverScreen() {
        this.hideAllScreens();
        document.getElementById('game-over-screen').classList.add('active');
        document.getElementById('game-overlay').style.display = 'flex';
    }
    
    hideAllScreens() {
        document.getElementById('start-screen').classList.remove('active');
        document.getElementById('pause-screen').classList.remove('active');
        document.getElementById('game-over-screen').classList.remove('active');
        document.getElementById('game-overlay').style.display = 'none';
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const tetris = new Tetris();
});

// Prevent scrolling when using arrow keys
window.addEventListener('keydown', (e) => {
    if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].indexOf(e.code) > -1) {
        e.preventDefault();
    }
}, false);