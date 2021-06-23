import React, { useState } from 'react';
import '../css/App.css';
import Board from './Board';
import TopBar from './TopBar';

export enum GameState {
    Initial, // tiles are hidden and the timer is at 0
    Playing, // timer is counting and each tile is revealed
    Win, // all the safe spaces are revealed and the timer stops
    Lose // a mine is clicked and the timer stops
}

const App: React.FC = () => {
    const [gameState, setGameState] = useState<GameState>(GameState.Initial);
    const [width, setWidth] = useState<number>(9);
    const [height, setHeight] = useState<number>(9);
    const [mines, setMines] = useState<number>(Math.floor(width * height * 0.2));

    return (
        <div className="App">
            <h1 className="title">Minesweeper</h1>
            <TopBar
                gameState={gameState}
                boardWidth={width}
                boardHeight={height}
                mines={mines}
                onReset={() => setGameState(GameState.Initial)}
            />
            <Board
                gameState={gameState}
                boardWidth={width}
                boardHeight={height}
                mines={mines}
                onInitialClick={() => setGameState(GameState.Playing)}
                onWin={() => setGameState(GameState.Win)}
                onLose={() => setGameState(GameState.Lose)}
            />
        </div>
    );
};

export default App;
