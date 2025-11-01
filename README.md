# WeiQi (Go) Board Game Project

A web-based implementation of WeiQi (Go), the ancient board game, featuring a 9x9 board.

## Features

- ✅ 9x9 Go board with wooden aesthetic
- ✅ Stone placement (Black and White)
- ✅ Turn-based gameplay
- ✅ Capture logic (removing surrounded stones)
- ✅ Suicide prevention (illegal move detection)
- ✅ Ko rule (preventing immediate repetition)
- ✅ Captured stone tracking
- ✅ Visual feedback and game status

## How to Play

1. Open `index.html` in your web browser
2. Click on any intersection to place a stone
3. Black plays first, then White alternates
4. Surround opponent stones to capture them
5. Click "New Game" to reset

## Game Rules (Basic)

- **Placement**: Players alternate placing stones (Black first)
- **Capture**: Stones with no liberties (empty adjacent spaces) are captured
- **Suicide**: You cannot place a stone that would have no liberties unless it captures opponent stones
- **Ko**: You cannot immediately repeat the previous board position

## Running the Game

Simply open `index.html` in any modern web browser. No installation or server required!

For a better experience, you can also use a local server:
```bash
# Python 3
python3 -m http.server 8000

# Node.js (if you have http-server installed)
npx http-server

# Then open http://localhost:8000 in your browser
```

## Project Structure

```
WeiQi/
├── index.html      # Main HTML file
├── styles.css      # Styling for the game
├── game.js         # Game logic and board rendering
├── README.md       # This file
└── Agent.txt       # Setup notes and documentation
```

## Future Enhancements

- Pass/resign functionality
- Score calculation (territory scoring)
- Undo/redo moves
- Move history
- Save/load games
- AI opponent
- Different board sizes (13x13, 19x19)
