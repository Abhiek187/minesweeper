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
    const [isAI, setIsAI] = useState<boolean>(false);
    const [width, setWidth] = useState<number>(9);
    const [height, setHeight] = useState<number>(9);
    const [mines, setMines] = useState<number>(Math.floor(width * height * 0.2));

    const enableAI = (): void => {
        // The AI can only be enabled on the initial game state
        if (gameState === GameState.Initial) {
            setIsAI(true);
        }
    };

    return (
        <div className="App">
            <h1 className="title">Minesweeper</h1>
            <TopBar
                gameState={gameState}
                boardWidth={width}
                boardHeight={height}
                mines={mines}
                onReset={() => {
                    setGameState(GameState.Initial);
                    setIsAI(false); // in case the AI is playing
                }}
                onStartAI={() => enableAI()}
                onChangeWidth={newWidth => setWidth(newWidth)}
                onChangeHeight={newHeight => setHeight(newHeight)}
                onChangeMines={newMines => setMines(newMines)}
            />
            <Board
                gameState={gameState}
                isAI={isAI}
                boardWidth={width}
                boardHeight={height}
                mines={mines}
                onInitialClick={() => setGameState(GameState.Playing)}
                onWin={() => {
                    setGameState(GameState.Win);
                    setIsAI(false);
                }}
                onLose={() => {
                    setGameState(GameState.Lose);
                    setIsAI(false);
                }}
            />
        </div>
    );
};

export default App;
