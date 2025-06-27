class WordleGame {
    constructor() {
        this.words = [];
        this.targetWord = '';
        this.currentGuess = '';
        this.currentRow = 0;
        this.gameOver = false;
        this.gameWon = false;
        this.maxGuesses = 6;
        this.wordLength = 5;
        
        this.gameBoard = document.getElementById('game-board');
        this.keyboard = document.getElementById('keyboard');
        this.message = document.getElementById('message');
        this.newGameBtn = document.getElementById('new-game-btn');
        
        this.init();
    }
    
    async init() {
        try {
            await this.loadWords();
            this.createGameBoard();
            this.addEventListeners();
            this.startNewGame();
        } catch (error) {
            this.showMessage('Error loading word list. Please refresh the page.', 'error');
        }
    }
    
    async loadWords() {
        try {
            const response = await fetch('words.txt');
            const text = await response.text();
            this.words = text.split('\n')
                .map(word => word.trim().toUpperCase())
                .filter(word => word.length === this.wordLength);
            
            if (this.words.length === 0) {
                throw new Error('No valid words found');
            }
        } catch (error) {
            console.error('Error loading words:', error);
            // Fallback words if file loading fails
            this.words = [
                'REACT', 'WORLD', 'ABOUT', 'HEART', 'WATER', 'HAPPY', 'LIGHT',
                'MUSIC', 'PEACE', 'SMILE', 'DREAM', 'POWER', 'VOICE', 'FOCUS',
                'MAGIC', 'BRAVE', 'QUIET', 'STORY', 'DANCE', 'GRACE'
            ];
        }
    }
    
    createGameBoard() {
        this.gameBoard.innerHTML = '';
        
        for (let i = 0; i < this.maxGuesses; i++) {
            const row = document.createElement('div');
            row.className = 'board-row';
            row.id = `row-${i}`;
            
            for (let j = 0; j < this.wordLength; j++) {
                const tile = document.createElement('div');
                tile.className = 'tile';
                tile.id = `tile-${i}-${j}`;
                row.appendChild(tile);
            }
            
            this.gameBoard.appendChild(row);
        }
    }
    
    addEventListeners() {
        // Physical keyboard events
        document.addEventListener('keydown', (e) => {
            if (this.gameOver) return;
            
            const key = e.key.toUpperCase();
            
            if (key === 'ENTER') {
                this.submitGuess();
            } else if (key === 'BACKSPACE') {
                this.deleteLetter();
            } else if (key.match(/^[A-Z]$/) && key.length === 1) {
                this.addLetter(key);
            }
        });
        
        // On-screen keyboard events
        this.keyboard.addEventListener('click', (e) => {
            if (this.gameOver) return;
            
            const key = e.target.getAttribute('data-key');
            if (!key) return;
            
            if (key === 'Enter') {
                this.submitGuess();
            } else if (key === 'Backspace') {
                this.deleteLetter();
            } else if (key.match(/^[A-Z]$/)) {
                this.addLetter(key);
            }
        });

        // Touch events for mobile
        this.keyboard.addEventListener('touchstart', (e) => {
            if (this.gameOver) return;

            const key = e.target.getAttribute('data-key');
            if (!key) return;

            if (key === 'Enter') {
                this.submitGuess();
            } else if (key === 'Backspace') {
                this.deleteLetter();
            } else if (key.match(/^[A-Z]$/)) {
                this.addLetter(key);
            }
        });
        
        // New game button
        this.newGameBtn.addEventListener('click', () => {
            this.startNewGame();
        });
        
        // Touch events for mobile
        this.keyboard.addEventListener('touchstart', (e) => {
            e.preventDefault();
        });
    }
    
    startNewGame() {
        this.targetWord = this.words[Math.floor(Math.random() * this.words.length)];
        this.currentGuess = '';
        this.currentRow = 0;
        this.gameOver = false;
        this.gameWon = false;
        
        // Reset board
        this.createGameBoard();
        
        // Reset keyboard
        const keys = document.querySelectorAll('.key');
        keys.forEach(key => {
            key.classList.remove('correct', 'present', 'absent');
        });
        
        // Hide message
        this.hideMessage();
        
        //console.log('Target word:', this.targetWord); // For debugging
    }
    
    addLetter(letter) {
        if (this.currentGuess.length < this.wordLength) {
            this.currentGuess += letter;
            this.updateDisplay();
        }
    }
    
    deleteLetter() {
        if (this.currentGuess.length > 0) {
            this.currentGuess = this.currentGuess.slice(0, -1);
            this.updateDisplay();
        }
    }
    
    updateDisplay() {
        const row = document.getElementById(`row-${this.currentRow}`);
        const tiles = row.querySelectorAll('.tile');
        
        // Clear all tiles in current row
        tiles.forEach((tile, index) => {
            tile.textContent = '';
            tile.classList.remove('filled');
        });
        
        // Fill tiles with current guess
        for (let i = 0; i < this.currentGuess.length; i++) {
            tiles[i].textContent = this.currentGuess[i];
            tiles[i].classList.add('filled');
        }
    }
    
    submitGuess() {
        if (this.currentGuess.length !== this.wordLength) {
            this.showMessage('Not enough letters', 'error');
            return;
        }
        
        if (!this.words.includes(this.currentGuess)) {
            this.showMessage('Not in word list', 'error');
            return;
        }
        
        this.evaluateGuess();
        this.currentGuess = '';
        this.currentRow++;
        
        if (this.gameWon) {
            this.showMessage('Congratulations! You won!', 'success');
            this.gameOver = true;
        } else if (this.currentRow >= this.maxGuesses) {
            this.showMessage(`Game over! The word was: ${this.targetWord}`, 'error');
            this.gameOver = true;
        }
    }
    
    evaluateGuess() {
        const row = document.getElementById(`row-${this.currentRow}`);
        const tiles = row.querySelectorAll('.tile');
        const letterStatus = {};
        
        // Count letters in target word
        const targetLetterCount = {};
        for (const letter of this.targetWord) {
            targetLetterCount[letter] = (targetLetterCount[letter] || 0) + 1;
        }
        
        // First pass: mark correct letters
        for (let i = 0; i < this.wordLength; i++) {
            const letter = this.currentGuess[i];
            if (letter === this.targetWord[i]) {
                letterStatus[letter] = 'correct';
                targetLetterCount[letter]--;
            }
        }
        
        // Second pass: mark present and absent letters
        for (let i = 0; i < this.wordLength; i++) {
            const letter = this.currentGuess[i];
            const tile = tiles[i];
            
            if (letter === this.targetWord[i]) {
                // Already marked as correct
                tile.classList.add('correct');
            } else if (targetLetterCount[letter] > 0) {
                tile.classList.add('present');
                if (letterStatus[letter] !== 'correct') {
                    letterStatus[letter] = 'present';
                }
                targetLetterCount[letter]--;
            } else {
                tile.classList.add('absent');
                if (!letterStatus[letter]) {
                    letterStatus[letter] = 'absent';
                }
            }
            
            // Add flip animation
            tile.classList.add('flip');
        }
        
        // Update keyboard
        this.updateKeyboard(letterStatus);
        
        // Check if won
        if (this.currentGuess === this.targetWord) {
            this.gameWon = true;
        }
    }
    
    updateKeyboard(letterStatus) {
        for (const [letter, status] of Object.entries(letterStatus)) {
            const key = document.querySelector(`[data-key="${letter}"]`);
            if (key) {
                // Only update if the new status is better than current
                if (!key.classList.contains('correct')) {
                    key.classList.remove('present', 'absent');
                    key.classList.add(status);
                }
            }
        }
    }
    
    showMessage(text, type) {
        this.message.textContent = text;
        this.message.className = `message ${type}`;
        this.message.classList.remove('hidden');
        
        // Auto-hide error and info messages
        if (type === 'error' || type === 'info') {
            setTimeout(() => {
                this.hideMessage();
            }, 3000);
        }
    }
    
    hideMessage() {
        this.message.classList.add('hidden');
    }
}

// Start the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new WordleGame();
});

// Prevent zoom on double tap for mobile
let lastTouchEnd = 0;
document.addEventListener('touchend', function (event) {
    const now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
        event.preventDefault();
    }
    lastTouchEnd = now;
}, false);

// Prevent scroll bounce on iOS
document.addEventListener('touchmove', function (event) {
    if (event.scale !== 1) {
        event.preventDefault();
    }
}, { passive: false });
