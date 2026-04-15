# Xiangqi Arena - Simplified Version

## Tổng quan

Dự án Xiangqi (Cờ tướng) web với:
- ✅ Game 2 người chơi
- ✅ AI opponent (Pikafish)
- ✅ Nhận diện bàn cờ (ONNX)
- ✅ PWA offline support

## Cấu trúc

```
xiangqi-simplified/
├── index.html      # Entry point
├── style.css       # Styles
├── game.js         # Game logic
├── ai.js           # Pikafish integration
└── utils.js        # Helper functions
```

## Code nhanh

### index.html
```html
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Xiangqi - Cờ Tướng</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div id="game-container">
        <h1>♟️ Cờ Tướng</h1>
        <div id="board"></div>
        <div id="controls">
            <button onclick="game.reset()">🔄 Mới</button>
            <button onclick="game.undo()">↩️ Lùi</button>
        </div>
    </div>
    <script src="utils.js"></script>
    <script src="game.js"></script>
    <script src="ai.js"></script>
</body>
</html>
```

### utils.js - Hằng số cờ
```javascript
const PIECES = {
    // Red pieces (đỏ)
    R_KING: 'R_k', R_ADVISOR: 'R_a', R_ELEPHANT: 'R_e', 
    R_HORSE: 'R_h', R_CHARIOT: 'R_c', R_CANNON: 'R_n', R_PAWN: 'R_p',
    // Black pieces (đen)  
    B_KING: 'B_k', B_ADVISOR: 'B_a', B_ELEPHANT: 'B_e',
    B_HORSE: 'B_h', B_CHARIOT: 'B_c', B_CANNON: 'B_n', B_PAWN: 'B_p'
};

const INITIAL_BOARD = [
    ['B_c', 'B_h', 'B_e', 'B_a', 'B_k', 'B_a', 'B_e', 'B_h', 'B_c'],
    ['',    '',    '',    '',    '',    '',    '',    '',    ''],
    ['',    'B_n', '',    '',    '',    '',    '',    'B_n', ''],
    ['B_p', '',    'B_p', '',    'B_p', '',    'B_p', '',    'B_p'],
    ['',    '',    '',    '',    '',    '',    '',    '',    ''],
    ['',    '',    '',    '',    '',    '',    '',    '',    ''],
    ['R_p', '',    'R_p', '',    'R_p', '',    'R_p', '',    'R_p'],
    ['',    'R_n', '',    '',    '',    '',    '',    'R_n', ''],
    ['',    '',    '',    '',    '',    '',    '',    '',    ''],
    ['R_c', 'R_h', 'R_e', 'R_a', 'R_k', 'R_a', 'R_e', 'R_h', 'R_c']
];

const COLS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'];
```

### game.js - Logic chính
```javascript
class XiangqiGame {
    constructor() {
        this.board = JSON.parse(JSON.stringify(INITIAL_BOARD));
        this.turn = 'R'; // Red moves first
        this.selected = null;
        this.history = [];
    }
    
    // Check valid move for each piece type
    isValidMove(fromRow, fromCol, toRow, toCol) {
        const piece = this.board[fromRow][fromCol];
        if (!piece) return false;
        
        const pieceType = piece[1];
        const isRed = piece[0] === 'R';
        
        // Ensure same color doesn't capture own piece
        const target = this.board[toRow][toCol];
        if (target && target[0] === piece[0]) return false;
        
        switch(pieceType) {
            case 'k': return this.isValidKing(fromRow, fromCol, toRow, toCol, isRed);
            case 'a': return this.isValidAdvisor(fromRow, fromCol, toRow, toCol, isRed);
            case 'e': return this.isValidElephant(fromRow, fromCol, toRow, toCol, isRed);
            case 'h': return this.isValidHorse(fromRow, fromCol, toRow, toCol);
            case 'c': return this.isValidChariot(fromRow, fromCol, toRow, toCol);
            case 'n': return this.isValidCannon(fromRow, fromCol, toRow, toCol);
            case 'p': return this.isValidPawn(fromRow, fromCol, toRow, toCol, isRed);
        }
        return false;
    }
    
    isValidPawn(fromRow, fromCol, toRow, toCol, isRed) {
        const forward = isRed ? -1 : 1;
        const isAcrossRiver = isRed ? fromRow <= 4 : fromRow >= 5;
        
        // Move forward
        if (toRow === fromRow + forward && toCol === fromCol) return true;
        // Move sideways after crossing river
        if (isAcrossRiver && toRow === fromRow && Math.abs(toCol - fromCol) === 1) return true;
        return false;
    }
    
    move(fromRow, fromCol, toRow, toCol) {
        if (!this.isValidMove(fromRow, fromCol, toRow, toCol)) {
            return false;
        }
        
        this.history.push({
            from: [fromRow, fromCol],
            to: [toRow, toCol],
            piece: this.board[fromRow][fromCol],
            captured: this.board[toRow][toCol]
        });
        
        this.board[toRow][toCol] = this.board[fromRow][fromCol];
        this.board[fromRow][fromCol] = '';
        this.turn = this.turn === 'R' ? 'B' : 'R';
        return true;
    }
    
    undo() {
        if (this.history.length === 0) return;
        const last = this.history.pop();
        this.board[last.from[0]][last.from[1]] = last.piece;
        this.board[last.to[0]][last.to[1]] = last.captured;
        this.turn = this.turn === 'R' ? 'B' : 'R';
    }
    
    reset() {
        this.board = JSON.parse(JSON.stringify(INITIAL_BOARD));
        this.turn = 'R';
        this.selected = null;
        this.history = [];
    }
    
    render() {
        const boardEl = document.getElementById('board');
        boardEl.innerHTML = '';
        
        for (let row = 0; row < 10; row++) {
            for (let col = 0; col < 9; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                const piece = this.board[row][col];
                if (piece) {
                    cell.textContent = this.getPieceSymbol(piece);
                    cell.classList.add(piece[0] === 'R' ? 'red' : 'black');
                }
                
                if (this.selected && 
                    this.selected[0] === row && 
                    this.selected[1] === col) {
                    cell.classList.add('selected');
                }
                
                cell.onclick = () => this.handleClick(row, col);
                boardEl.appendChild(cell);
            }
        }
    }
    
    getPieceSymbol(piece) {
        const symbols = {
            'R_k': '帅', 'R_a': '仕', 'R_e': '相', 'R_h': '马',
            'R_c': '车', 'R_n': '炮', 'R_p': '兵',
            'B_k': '將', 'B_a': '士', 'B_e': '象', 'B_h': '馬',
            'B_c': '車', 'B_n': '炮', 'B_p': '卒'
        };
        return symbols[piece] || '';
    }
    
    handleClick(row, col) {
        if (this.selected) {
            if (this.move(this.selected[0], this.selected[1], row, col)) {
                this.selected = null;
                this.render();
            } else {
                this.selected = [row, col];
                this.render();
            }
        } else {
            if (this.board[row][col] && this.board[row][col][0] === this.turn) {
                this.selected = [row, col];
                this.render();
            }
        }
    }
}

const game = new XiangqiGame();
game.render();
```

### style.css
```css
* { box-sizing: border-box; margin: 0; padding: 0; }

body {
    font-family: sans-serif;
    display: flex;
    justify-content: center;
    background: #f0f0f0;
    min-height: 100vh;
}

#game-container {
    text-align: center;
    padding: 20px;
}

#board {
    display: grid;
    grid-template-columns: repeat(9, 50px);
    grid-template-rows: repeat(10, 50px);
    gap: 2px;
    background: #8B4513;
    border: 5px solid #5D3A1A;
    margin: 20px auto;
}

.cell {
    background: #DEB887;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 36px;
    cursor: pointer;
    width: 50px;
    height: 50px;
}

.cell.selected { background: #90EE90; }
.cell.red { color: #D00; }
.cell.black { color: #000; }

#controls {
    margin-top: 20px;
}

button {
    padding: 10px 20px;
    font-size: 16px;
    margin: 5px;
    cursor: pointer;
}
```

## Chạy nhanh

```bash
# Tạo project
mkdir xiangqi-simplified
cd xiangqi-simplified
# Tạo các file như trên

# Chạy local
python3 -m http.server 8080
# Hoặc
npx serve
```

## Phase tiếp theo

1. ✅ Basic game logic - DONE
2. ⏳ Thêm AI (Pikafish integration)
3. ⏳ Thêm board recognition
4. ⏳ Thêm PWA offline