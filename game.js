const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30; // px
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// Game grid: 2D array, initially empty
let grid = Array.from({ length: ROWS }, () => Array(COLS).fill(''));

let nextLetter = randomLetter();

function updateNextLetterDisplay() {
    document.getElementById('next-letter-value').textContent = nextLetter;
}

// Update currentLetter to use nextLetter, and generate a new nextLetter after placing
let currentLetter = {
    col: Math.floor(COLS / 2),
    row: 0,
    value: nextLetter
};
updateNextLetterDisplay();

function randomLetter() {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    return alphabet[Math.floor(Math.random() * alphabet.length)];
}

function canMoveDown() {
    const { row, col } = currentLetter;
    if (row + 1 >= ROWS) return false;
    if (grid[row + 1][col]) return false;
    return true;
}

function placeLetter() {
    grid[currentLetter.row][currentLetter.col] = currentLetter.value;
}

function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            ctx.strokeStyle = '#444';
            ctx.strokeRect(col * BLOCK_SIZE, row * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
            if (grid[row][col]) {
                ctx.fillStyle = '#4ecdc4';
                ctx.fillRect(col * BLOCK_SIZE + 2, row * BLOCK_SIZE + 2, BLOCK_SIZE - 4, BLOCK_SIZE - 4);
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 20px Segoe UI, Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(grid[row][col], col * BLOCK_SIZE + BLOCK_SIZE / 2, row * BLOCK_SIZE + BLOCK_SIZE / 2);
            }
        }
    }
}

function drawCurrentLetter() {
    const { row, col, value } = currentLetter;
    // Only draw if the cell is empty (not already placed)
    if (row < 0 || row >= ROWS) return;
    if (!grid[row][col]) {
        ctx.fillStyle = '#ffb400';
        ctx.fillRect(col * BLOCK_SIZE + 2, row * BLOCK_SIZE + 2, BLOCK_SIZE - 4, BLOCK_SIZE - 4);
        ctx.fillStyle = '#222';
        ctx.font = 'bold 20px Segoe UI, Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(value, col * BLOCK_SIZE + BLOCK_SIZE / 2, row * BLOCK_SIZE + BLOCK_SIZE / 2);
    }
}

function render() {
    drawGrid();
    drawCurrentLetter();
}

function dropLetter() {
    if (canMoveDown()) {
        currentLetter.row++;
    } else {
        placeLetter();
        render();
        const { foundWords, toClear } = findWordsOnBoard ? findWordsOnBoard() : { foundWords: [], toClear: [] };
        if (foundWords && foundWords.length > 0 && typeof clearAndCollapse === 'function') {
            clearAndCollapse(toClear, () => {
                const result = findWordsOnBoard();
                if (result.foundWords.length > 0) {
                    clearAndCollapse(result.toClear);
                }
            });
        }
        // Use the nextLetter as the new falling letter
        currentLetter = {
            col: Math.floor(COLS / 2),
            row: 0,
            value: nextLetter
        };
        nextLetter = randomLetter();
        updateNextLetterDisplay();
    }
    render();
}

function canMoveTo(row, col) {
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return false;
    if (grid[row][col]) return false;
    return true;
}

function moveLeft() {
    if (canMoveTo(currentLetter.row, currentLetter.col - 1)) {
        currentLetter.col--;
        render();
    }
}

function moveRight() {
    if (canMoveTo(currentLetter.row, currentLetter.col + 1)) {
        currentLetter.col++;
        render();
    }
}

function hardDrop() {
    while (canMoveDown()) {
        currentLetter.row++;
    }
    dropLetter();
}

window.addEventListener('keydown', (e) => {
    if (e.code === 'ArrowLeft') {
        moveLeft();
        e.preventDefault();
    } else if (e.code === 'ArrowRight') {
        moveRight();
        e.preventDefault();
    } else if (e.code === 'Space') {
        hardDrop();
        e.preventDefault();
    }
});

render();
setInterval(dropLetter, 1000);

let vocab = [];

// Load vocab from JSON file
fetch('vocab/vocab-gr1.json')
    .then(res => res.json())
    .then(data => {
        vocab = data.grade_1.map(w => w.toUpperCase());
    });

function findWordsOnBoard() {
    const foundWords = [];
    const toClear = Array.from({ length: ROWS }, () => Array(COLS).fill(false));

    // Horizontal scan
    for (let row = 0; row < ROWS; row++) {
        let seq = '';
        let startCol = 0;
        for (let col = 0; col <= COLS; col++) {
            if (col < COLS && grid[row][col]) {
                if (seq === '') startCol = col;
                seq += grid[row][col];
            } else {
                if (seq.length >= 3 && vocab.includes(seq)) {
                    foundWords.push(seq);
                    for (let c = startCol; c < startCol + seq.length; c++) {
                        toClear[row][c] = true;
                    }
                }
                seq = '';
            }
        }
    }
    // Vertical scan
    for (let col = 0; col < COLS; col++) {
        let seq = '';
        let startRow = 0;
        for (let row = 0; row <= ROWS; row++) {
            if (row < ROWS && grid[row][col]) {
                if (seq === '') startRow = row;
                seq += grid[row][col];
            } else {
                if (seq.length >= 3 && vocab.includes(seq)) {
                    foundWords.push(seq);
                    for (let r = startRow; r < startRow + seq.length; r++) {
                        toClear[r][col] = true;
                    }
                }
                seq = '';
            }
        }
    }
    return { foundWords, toClear };
}

function clearAndCollapse(toClear, callback) {
    // Visual feedback: highlight cells to clear
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            if (toClear[row][col]) {
                ctx.save();
                ctx.globalAlpha = 0.7;
                ctx.fillStyle = '#ff4e50';
                ctx.fillRect(col * BLOCK_SIZE + 2, row * BLOCK_SIZE + 2, BLOCK_SIZE - 4, BLOCK_SIZE - 4);
                ctx.restore();
            }
        }
    }
    setTimeout(() => {
        // Clear marked cells and collapse
        for (let col = 0; col < COLS; col++) {
            for (let row = ROWS - 1; row >= 0; row--) {
                if (toClear[row][col]) {
                    for (let r = row; r > 0; r--) {
                        grid[r][col] = grid[r - 1][col];
                    }
                    grid[0][col] = '';
                }
            }
        }
        render();
        if (callback) callback();
    }, 400); // Highlight for 400ms
}
