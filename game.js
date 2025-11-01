class GoGame {
    constructor() {
        this.boardSize = 9;
        this.board = Array(this.boardSize).fill(null).map(() => Array(this.boardSize).fill(null));
        this.currentPlayer = 'black'; // 'black' or 'white'
        this.capturedBlack = 0;
        this.capturedWhite = 0;
        this.lastMove = null;
        this.gameMode = 'cpu'; // 'cpu' or '2players'
        this.cpuPlayer = 'white'; // CPU plays as white
        
        this.canvas = document.getElementById('gameBoard');
        this.ctx = this.canvas.getContext('2d');
        this.cellSize = this.canvas.width / (this.boardSize + 1);
        this.hoverRow = null;
        this.hoverCol = null;
        
        this.initializeBoard();
        this.setupEventListeners();
        this.drawBoard();
    }

    initializeBoard() {
        // Initialize empty board
        this.board = Array(this.boardSize).fill(null).map(() => 
            Array(this.boardSize).fill(null)
        );
    }

    setupEventListeners() {
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('touchstart', (e) => this.handleTouch(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseleave', () => this.handleMouseLeave());
        document.getElementById('resetBtn').addEventListener('click', () => this.resetGame());
        document.getElementById('gameMode').addEventListener('change', (e) => this.changeGameMode(e.target.value));
    }

    getGridPosition(x, y) {
        const col = Math.round((x / this.cellSize) - 1);
        const row = Math.round((y / this.cellSize) - 1);
        return { row, col };
    }

    handleMouseMove(event) {
        // Don't show hover preview if it's CPU's turn
        if (this.gameMode === 'cpu' && this.currentPlayer === this.cpuPlayer) {
            if (this.hoverRow !== null || this.hoverCol !== null) {
                this.hoverRow = null;
                this.hoverCol = null;
                this.drawBoard();
            }
            return;
        }

        const { x, y } = this.getEventCoordinates(event);
        const { row, col } = this.getGridPosition(x, y);

        // Check if hovering over a valid intersection
        if (row >= 0 && row < this.boardSize && col >= 0 && col < this.boardSize) {
            // Only update if position changed
            if (this.hoverRow !== row || this.hoverCol !== col) {
                this.hoverRow = row;
                this.hoverCol = col;
                this.drawBoard(); // Redraw to show hover preview
            }
        } else {
            // Outside board bounds
            if (this.hoverRow !== null || this.hoverCol !== null) {
                this.hoverRow = null;
                this.hoverCol = null;
                this.drawBoard(); // Redraw to hide hover preview
            }
        }
    }

    handleMouseLeave() {
        this.hoverRow = null;
        this.hoverCol = null;
        this.drawBoard(); // Redraw to hide hover preview
    }

    getEventCoordinates(event) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        let clientX, clientY;
        if (event.touches && event.touches.length > 0) {
            // Touch event
            clientX = event.touches[0].clientX;
            clientY = event.touches[0].clientY;
        } else {
            // Mouse event
            clientX = event.clientX;
            clientY = event.clientY;
        }
        
        const x = (clientX - rect.left) * scaleX;
        const y = (clientY - rect.top) * scaleY;
        
        return { x, y };
    }

    handleTouch(event) {
        event.preventDefault(); // Prevent scrolling and double-firing
        this.handleClick(event);
    }

    handleClick(event) {
        // Don't allow clicks if it's CPU's turn
        if (this.gameMode === 'cpu' && this.currentPlayer === this.cpuPlayer) {
            return;
        }

        const { x, y } = this.getEventCoordinates(event);
        const { row, col } = this.getGridPosition(x, y);

        if (this.isValidMove(row, col)) {
            this.placeStone(row, col);
            
            // Check if CPU should play next
            if (this.gameMode === 'cpu' && this.currentPlayer === this.cpuPlayer) {
                setTimeout(() => this.makeCPUMove(), 500); // Small delay for visual feedback
            }
        } else {
            this.showStatus('Invalid move!', 'error');
            setTimeout(() => this.showStatus('Place a stone to continue', ''), 2000);
        }
    }

    changeGameMode(mode) {
        this.gameMode = mode;
        this.showStatus(`Game mode: ${mode === 'cpu' ? 'vs CPU' : '2 Players'}`, 'success');
        
        // If switching to CPU mode and it's CPU's turn, make CPU move
        if (mode === 'cpu' && this.currentPlayer === this.cpuPlayer) {
            setTimeout(() => this.makeCPUMove(), 500);
        }
    }

    isValidMove(row, col) {
        // Check bounds
        if (row < 0 || row >= this.boardSize || col < 0 || col >= this.boardSize) {
            return false;
        }

        // Check if position is empty
        if (this.board[row][col] !== null) {
            return false;
        }

        // Place stone temporarily to check for captures and suicide
        this.board[row][col] = this.currentPlayer;
        
        // Check if this move captures any groups
        const captured = this.checkCaptures(row, col, this.getOpponent());
        
        // Remove captured stones temporarily to check suicide
        let hadCaptures = false;
        if (captured.length > 0) {
            hadCaptures = true;
            captured.forEach(([r, c]) => this.board[r][c] = null);
        }

        // Check if the placed stone has liberties (not suicide)
        const hasLiberties = this.hasLiberties(row, col);
        
        // Check for Ko rule (simple version - can't repeat last board state)
        const wouldRepeat = this.wouldRepeatLastMove(row, col);
        
        // Restore board state
        this.board[row][col] = null;
        captured.forEach(([r, c]) => this.board[r][c] = this.getOpponent());
        
        // Valid if: has liberties OR captures opponent stones
        // AND doesn't repeat last move
        return (hasLiberties || hadCaptures) && !wouldRepeat;
    }

    placeStone(row, col) {
        this.board[row][col] = this.currentPlayer;
        
        // Check and remove captured opponent stones
        const captured = this.checkCaptures(row, col, this.getOpponent());
        if (captured.length > 0) {
            captured.forEach(([r, c]) => {
                this.board[r][c] = null;
            });
            
            // Update captured counts
            if (this.currentPlayer === 'black') {
                this.capturedWhite += captured.length;
            } else {
                this.capturedBlack += captured.length;
            }
            
            this.updateCapturedCounts();
        }

        // Update last move
        this.lastMove = { row, col, player: this.currentPlayer, boardState: this.getBoardState() };

        // Switch player
        this.currentPlayer = this.currentPlayer === 'black' ? 'white' : 'black';
        this.drawBoard();
        this.showStatus(`${this.currentPlayer === 'black' ? 'White' : 'Black'} placed a stone. ${this.currentPlayer === 'black' ? 'Black' : 'White'}'s turn.`, 'success');
    }

    makeCPUMove() {
        if (this.gameMode !== 'cpu' || this.currentPlayer !== this.cpuPlayer) {
            return;
        }

        this.showStatus('CPU is thinking...', '');
        
        // Add a small delay to make it feel more natural
        setTimeout(() => {
            const move = this.getCPUMove();
            if (move) {
                this.placeStone(move.row, move.col);
                this.showStatus('CPU placed a stone. Your turn.', 'success');
            } else {
                this.showStatus('CPU could not find a valid move', 'error');
            }
        }, 300);
    }

    getCPUMove() {
        // Easy CPU: Prefers moves that capture, then center positions, then random valid moves
        
        // 1. First, try to find moves that capture opponent stones
        const captureMoves = [];
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.isValidMove(row, col)) {
                    // Temporarily place stone to check captures
                    this.board[row][col] = this.currentPlayer;
                    const captured = this.checkCaptures(row, col, this.getOpponent());
                    this.board[row][col] = null;
                    
                    if (captured.length > 0) {
                        captureMoves.push({ row, col, captures: captured.length });
                    }
                }
            }
        }
        
        // If we have capture moves, choose one with most captures
        if (captureMoves.length > 0) {
            captureMoves.sort((a, b) => b.captures - a.captures);
            return captureMoves[0];
        }
        
        // 2. Try center and strategic positions (corners, edges near center)
        const strategicPositions = [
            [4, 4], // Center
            [3, 3], [3, 4], [3, 5],
            [4, 3], [4, 5],
            [5, 3], [5, 4], [5, 5],
            [2, 2], [2, 6], [6, 2], [6, 6], // Corner areas
            [2, 4], [4, 2], [4, 6], [6, 4], // Edge centers
        ];
        
        for (const [row, col] of strategicPositions) {
            if (row >= 0 && row < this.boardSize && col >= 0 && col < this.boardSize) {
                if (this.isValidMove(row, col)) {
                    return { row, col };
                }
            }
        }
        
        // 3. Fall back to random valid move
        const validMoves = [];
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.isValidMove(row, col)) {
                    validMoves.push({ row, col });
                }
            }
        }
        
        if (validMoves.length > 0) {
            return validMoves[Math.floor(Math.random() * validMoves.length)];
        }
        
        return null; // No valid moves
    }

    checkCaptures(row, col, player) {
        const captured = [];
        const visited = new Set();

        // Check all adjacent opponent groups
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        
        for (const [dr, dc] of directions) {
            const newRow = row + dr;
            const newCol = col + dc;
            
            if (this.isValidPosition(newRow, newCol) && 
                this.board[newRow][newCol] === player) {
                const group = this.getGroup(newRow, newCol, player);
                const groupKey = group.map(([r, c]) => `${r},${c}`).sort().join(';');
                
                if (!visited.has(groupKey) && !this.hasGroupLiberties(group, row, col)) {
                    visited.add(groupKey);
                    captured.push(...group);
                }
            }
        }

        return captured;
    }

    getGroup(row, col, player) {
        const group = [];
        const visited = new Set();
        const stack = [[row, col]];

        while (stack.length > 0) {
            const [r, c] = stack.pop();
            const key = `${r},${c}`;
            
            if (visited.has(key)) continue;
            if (!this.isValidPosition(r, c) || this.board[r][c] !== player) continue;

            visited.add(key);
            group.push([r, c]);

            // Check all adjacent stones
            const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
            for (const [dr, dc] of directions) {
                const newRow = r + dr;
                const newCol = c + dc;
                if (this.isValidPosition(newRow, newCol) && 
                    this.board[newRow][newCol] === player) {
                    stack.push([newRow, newCol]);
                }
            }
        }

        return group;
    }

    hasGroupLiberties(group, excludeRow = -1, excludeCol = -1) {
        for (const [r, c] of group) {
            const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
            for (const [dr, dc] of directions) {
                const newRow = r + dr;
                const newCol = c + dc;
                
                // Check if this adjacent position is a liberty
                if (!this.isValidPosition(newRow, newCol)) continue;
                if (newRow === excludeRow && newCol === excludeCol) continue; // Don't count the placed stone
                if (this.board[newRow][newCol] === null) {
                    return true; // Found a liberty
                }
            }
        }
        return false;
    }

    hasLiberties(row, col) {
        const player = this.board[row][col];
        if (player === null) return false;

        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        for (const [dr, dc] of directions) {
            const newRow = row + dr;
            const newCol = col + dc;
            
            if (!this.isValidPosition(newRow, newCol)) continue;
            if (this.board[newRow][newCol] === null) {
                return true; // Found a liberty
            }
        }

        // Check if connected to a group with liberties
        const group = this.getGroup(row, col, player);
        return this.hasGroupLiberties(group, row, col);
    }

    wouldRepeatLastMove(row, col) {
        if (!this.lastMove) return false;
        
        // Temporarily place the stone
        this.board[row][col] = this.currentPlayer;
        
        // Check captures
        const captured = this.checkCaptures(row, col, this.getOpponent());
        captured.forEach(([r, c]) => this.board[r][c] = null);
        
        // Get current board state
        const currentState = this.getBoardState();
        
        // Restore
        this.board[row][col] = null;
        captured.forEach(([r, c]) => this.board[r][c] = this.getOpponent());
        
        // Simple Ko check: compare with last move's board state
        return this.lastMove.boardState === currentState;
    }

    getBoardState() {
        return this.board.map(row => row.join('')).join('');
    }

    isValidPosition(row, col) {
        return row >= 0 && row < this.boardSize && col >= 0 && col < this.boardSize;
    }

    getOpponent() {
        return this.currentPlayer === 'black' ? 'white' : 'black';
    }


    updateCapturedCounts() {
        document.getElementById('blackCaptured').textContent = this.capturedBlack;
        document.getElementById('whiteCaptured').textContent = this.capturedWhite;
    }

    showStatus(message, type = '') {
        const statusEl = document.getElementById('gameStatus');
        statusEl.textContent = message;
        statusEl.className = `status ${type}`;
    }

    drawBoard() {
        const ctx = this.ctx;
        const size = this.canvas.width;
        const cellSize = size / (this.boardSize + 1);
        
        // Clear canvas
        ctx.clearRect(0, 0, size, size);
        
        // Draw board background (matched to reference color)
        ctx.fillStyle = 'rgb(209, 175, 135)'; // Matched to reference image #D1AF87
        ctx.fillRect(0, 0, size, size);
        
        // Draw grid lines
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.5;
        
        for (let i = 0; i < this.boardSize; i++) {
            const pos = (i + 1) * cellSize;
            
            // Horizontal lines
            ctx.beginPath();
            ctx.moveTo(cellSize, pos);
            ctx.lineTo(this.boardSize * cellSize, pos);
            ctx.stroke();
            
            // Vertical lines
            ctx.beginPath();
            ctx.moveTo(pos, cellSize);
            ctx.lineTo(pos, this.boardSize * cellSize);
            ctx.stroke();
        }
        
        // Draw hoshi points (star points) - center for 9x9
        ctx.fillStyle = '#000000';
        const centerPos = (Math.floor(this.boardSize / 2) + 1) * cellSize;
        ctx.beginPath();
        ctx.arc(centerPos, centerPos, 4, 0, 2 * Math.PI);
        ctx.fill();
        
        // Draw stone shadows first (for white stones), then draw all stones
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.board[row][col] === 'white') {
                    this.drawStoneShadow(row, col);
                }
            }
        }
        
        // Draw stones
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.board[row][col] !== null) {
                    this.drawStone(row, col, this.board[row][col]);
                }
            }
        }
        
        // Draw hover preview (semi-transparent stone)
        if (this.hoverRow !== null && this.hoverCol !== null && 
            this.board[this.hoverRow][this.hoverCol] === null &&
            this.isValidMove(this.hoverRow, this.hoverCol)) {
            this.drawHoverPreview(this.hoverRow, this.hoverCol);
        }
        
        // Highlight last move
        if (this.lastMove) {
            this.highlightMove(this.lastMove.row, this.lastMove.col);
        }
    }

    drawHoverPreview(row, col) {
        const ctx = this.ctx;
        const cellSize = this.canvas.width / (this.boardSize + 1);
        const x = (col + 1) * cellSize;
        const y = (row + 1) * cellSize;
        const radius = cellSize * 0.4;
        
        // Draw semi-transparent preview stone
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        
        if (this.currentPlayer === 'black') {
            // Semi-transparent dark gray/brown for black stone preview
            ctx.fillStyle = 'rgba(60, 60, 60, 0.4)';
        } else {
            // Semi-transparent light yellow/beige for white stone preview
            ctx.fillStyle = 'rgba(240, 220, 180, 0.4)';
        }
        
        ctx.fill();
        
        // Optional: subtle border
        ctx.strokeStyle = this.currentPlayer === 'black' ? 'rgba(40, 40, 40, 0.5)' : 'rgba(200, 180, 140, 0.5)';
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    drawStone(row, col, color) {
        const ctx = this.ctx;
        const cellSize = this.canvas.width / (this.boardSize + 1);
        const x = (col + 1) * cellSize;
        const y = (row + 1) * cellSize;
        const radius = cellSize * 0.4;
        
        // Draw the main stone circle
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        
        if (color === 'black') {
            // Black stone with subtle 3D effect
            // Base gradient - subtle lightening on top-left, darker on bottom-right
            const baseGradient = ctx.createRadialGradient(
                x - radius * 0.25, y - radius * 0.25, 0,
                x, y, radius
            );
            // Very subtle dark gray highlight transitioning to pure black
            baseGradient.addColorStop(0, 'rgba(40, 40, 40, 1)'); // Very dark gray at center of highlight
            baseGradient.addColorStop(0.3, 'rgba(30, 30, 30, 1)'); // Slightly darker
            baseGradient.addColorStop(0.6, 'rgba(15, 15, 15, 1)'); // Dark
            baseGradient.addColorStop(1, 'rgba(0, 0, 0, 1)'); // Pure black at edges
            
            ctx.fillStyle = baseGradient;
            ctx.fill();
            
            // Very subtle, nuanced highlight in top-left quadrant (not a bright white spot)
            const highlightGradient = ctx.createRadialGradient(
                x - radius * 0.3, y - radius * 0.3, 0,
                x - radius * 0.3, y - radius * 0.3, radius * 0.6
            );
            // Gentle shift from dark gray to black, very subtle
            highlightGradient.addColorStop(0, 'rgba(50, 50, 50, 0.3)'); // Very subtle dark gray
            highlightGradient.addColorStop(0.4, 'rgba(30, 30, 30, 0.15)'); // Fading to darker
            highlightGradient.addColorStop(1, 'rgba(0, 0, 0, 0)'); // Transparent
            
            ctx.fillStyle = highlightGradient;
            ctx.fill();
            
            // Subtle shadow on bottom-right for depth
            const shadowGradient = ctx.createRadialGradient(
                x + radius * 0.25, y + radius * 0.25, 0,
                x + radius * 0.25, y + radius * 0.25, radius * 0.6
            );
            shadowGradient.addColorStop(0, 'rgba(0, 0, 0, 0.4)');
            shadowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            
            ctx.fillStyle = shadowGradient;
            ctx.fill();
            
            // Soft shadow cast on board
            ctx.beginPath();
            ctx.ellipse(x + radius * 0.15, y + radius * 0.15, radius * 0.8, radius * 0.5, 0, 0, 2 * Math.PI);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
            ctx.fill();
            
            // Outer border
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, 2 * Math.PI);
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 1;
            ctx.stroke();
            
        } else {
            // White stone with 3D glossy effect
            // Base gradient - lighter on top-left, slightly darker on bottom-right
            const baseGradient = ctx.createRadialGradient(
                x - radius * 0.3, y - radius * 0.3, 0,
                x, y, radius
            );
            baseGradient.addColorStop(0, 'rgba(255, 255, 255, 1)'); // Bright white at highlight
            baseGradient.addColorStop(0.6, 'rgba(245, 245, 245, 1)'); // Slightly off-white
            baseGradient.addColorStop(1, 'rgba(230, 230, 230, 1)'); // Light grey at edges
            
            ctx.fillStyle = baseGradient;
            ctx.fill();
            
            // Bright white highlight on top-left
            const highlightGradient = ctx.createRadialGradient(
                x - radius * 0.35, y - radius * 0.35, 0,
                x - radius * 0.35, y - radius * 0.35, radius * 0.35
            );
            highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
            highlightGradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.6)');
            highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            ctx.fillStyle = highlightGradient;
            ctx.fill();
            
            // Very subtle, diffused darker area on bottom-right of stone surface
            const surfaceShadow = ctx.createRadialGradient(
                x + radius * 0.25, y + radius * 0.25, 0,
                x + radius * 0.25, y + radius * 0.25, radius * 0.6
            );
            surfaceShadow.addColorStop(0, 'rgba(220, 220, 220, 0.25)'); // Very subtle darkening
            surfaceShadow.addColorStop(0.5, 'rgba(235, 235, 235, 0.1)'); // Fading
            surfaceShadow.addColorStop(1, 'rgba(255, 255, 255, 0)'); // Transparent
            
            ctx.fillStyle = surfaceShadow;
            ctx.fill();
            
            // Outer border
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, 2 * Math.PI);
            ctx.strokeStyle = '#b0b0b0';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    }

    drawStoneShadow(row, col) {
        const ctx = this.ctx;
        const cellSize = this.canvas.width / (this.boardSize + 1);
        const x = (col + 1) * cellSize;
        const y = (row + 1) * cellSize;
        const radius = cellSize * 0.4;
        
        // Draw soft, diffused shadow cast on the board (beneath and slightly to bottom-right)
        ctx.beginPath();
        ctx.ellipse(x + radius * 0.15, y + radius * 0.2, radius * 0.9, radius * 0.5, 0, 0, 2 * Math.PI);
        const boardShadow = ctx.createRadialGradient(
            x + radius * 0.15, y + radius * 0.2, 0,
            x + radius * 0.15, y + radius * 0.2, radius * 0.9
        );
        boardShadow.addColorStop(0, 'rgba(0, 0, 0, 0.25)'); // Darker at center of shadow
        boardShadow.addColorStop(0.4, 'rgba(0, 0, 0, 0.15)'); // Medium
        boardShadow.addColorStop(0.7, 'rgba(0, 0, 0, 0.08)'); // Light
        boardShadow.addColorStop(1, 'rgba(0, 0, 0, 0)'); // Fades out completely
        
        ctx.fillStyle = boardShadow;
        ctx.fill();
    }

    highlightMove(row, col) {
        const ctx = this.ctx;
        const cellSize = this.canvas.width / (this.boardSize + 1);
        const x = (col + 1) * cellSize;
        const y = (row + 1) * cellSize;
        
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
        ctx.fillStyle = '#e74c3c';
        ctx.fill();
    }

    resetGame() {
        this.board = Array(this.boardSize).fill(null).map(() => 
            Array(this.boardSize).fill(null)
        );
        this.currentPlayer = 'black';
        this.capturedBlack = 0;
        this.capturedWhite = 0;
        this.lastMove = null;
        
        this.updateCapturedCounts();
        this.drawBoard();
        
        const modeText = this.gameMode === 'cpu' ? 'vs CPU' : '2 Players';
        this.showStatus(`New game started. Black to play. (${modeText})`, 'success');
    }
}

// Initialize game when page loads
window.addEventListener('DOMContentLoaded', () => {
    new GoGame();
});

