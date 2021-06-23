import React, { useState } from 'react';
import '../css/App.css';
import Board from './Board';
import TopBar from './TopBar';

export enum GameState {
    Initial, // tiles are hidden and the timer is at 0
    Playing, // timer is counting and each tile is revealed
    GameOver // a mine is clicked or all the safe spaces are revealed, timer stops
}

const App: React.FC = () => {
    const [gameState, setGameState] = useState<GameState>(GameState.Initial);

    const changeGameState = (state: GameState): void => {
        setGameState(state);
    };

    return (
        <div className="App">
            <h1 className="title">Minesweeper</h1>
            <TopBar gameState={gameState} onReset={() => changeGameState(GameState.Initial)} />
            <Board
                gameState={gameState}
                onInitialClick={() => changeGameState(GameState.Playing)}
                onGameOver={() => changeGameState(GameState.GameOver)}
            />
        </div>
    );
};

export default App;
