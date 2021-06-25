import React, { useEffect, useRef, useState } from 'react';
import '../css/TopBar.css';
import { GameState } from './App';

type TopBarProps = {
    gameState: GameState,
    boardWidth: number,
    boardHeight: number,
    mines: number,
    onReset(): void | React.MouseEventHandler,
    onStartAI(): void,
    onChangeWidth(newWidth: number): void,
    onChangeHeight(newHeight: number): void,
    onChangeMines(newMines: number): void
};

const TopBar: React.FC<TopBarProps> = (
    { gameState, boardWidth, boardHeight, mines, onReset, onStartAI, onChangeWidth, onChangeHeight, onChangeMines }
) => {
    const [timer, setTimer] = useState<number>(0);
    const timeInterval = useRef<NodeJS.Timeout>();

    useEffect(() => {
        switch (gameState) {
            case GameState.Playing:
                timeInterval.current = setInterval(() => {
                    setTimer(timer => timer + 1);
                }, 1000);
                break;
            case GameState.Win:
            case GameState.Lose:
                if (timeInterval.current !== undefined) {
                    clearInterval(timeInterval.current);
                }

                break;
            default:
                if (timeInterval.current !== undefined) {
                    clearInterval(timeInterval.current);
                }

                setTimer(0);
        }
    }, [gameState]);

    const timerToString = (): string => {
        // Add a leading zero if the number is a single digit
        const mins: string = Math.floor(timer / 60).toString().padStart(2, "0");
        const secs: string = (timer % 60).toString().padStart(2, "0");
        return `${mins}:${secs}`;
    };

    const handleInput = (event: React.FormEvent, callback: (newVal: number) => void) => {
        // Get the input value and call the corresponding set function from the parent
        const inputElement = event.target as HTMLInputElement;
        const newVal: number = parseInt(inputElement.value);
        const min: number = parseInt(inputElement.min);
        const max: number = parseInt(inputElement.max);

        // Check to make sure the inputs are valid
        if (isNaN(newVal)) {
            inputElement.setCustomValidity(`Invalid number: It must be between ${min} and ${max} inclusive.`);
            return;
        } else if (newVal < min || newVal > max) {
            inputElement.setCustomValidity(`Input is out of range: It must be between ${min} and ${max} inclusive.`);
            return;
        }

        callback(newVal);
        onReset(); // restart the game
    };

    return (
        <header className="mine-header">
            <button type="reset" className="reset-button" onClick={onReset}>Reset</button>
            <button type="button" className="ai-button" onClick={onStartAI}>AI</button>
            <time className="timer" style={{
                color: gameState === GameState.Win ? "green"
                    : gameState === GameState.Lose ? "red" : "white"
            }}>{timerToString()}</time>
            <div className="size-field">
                <p>Size: </p>
                <input
                    type="number"
                    className="size-width"
                    value={boardWidth}
                    min="4"
                    max="16"
                    onChange={event => handleInput(event, onChangeWidth)}
                />
                <p>x</p>
                <input
                    type="number"
                    className="size-height"
                    value={boardHeight}
                    min="4"
                    max="16"
                    onChange={event => handleInput(event, onChangeHeight)}
                />
            </div>
            <div className="mine-field">
                <p>Mines: </p>
                <input
                    type="number"
                    className="mine-count"
                    value={mines}
                    min={Math.floor(boardWidth * boardHeight * 0.1)}
                    max={Math.floor(boardWidth * boardHeight * 0.3)}
                    onChange={event => handleInput(event, onChangeMines)}
                />
            </div>
        </header>
    );
};

export default TopBar;
