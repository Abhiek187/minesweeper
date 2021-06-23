import React, { useEffect, useRef, useState } from 'react';
import '../css/TopBar.css';
import { GameState } from './App';

type TopBarProps = {
    gameState: GameState,
    onReset: React.MouseEventHandler<HTMLButtonElement>
};

const TopBar: React.FC<TopBarProps> = ({ gameState, onReset }) => {
    const [timer, setTimer] = useState<number>(0);
    const timeInterval = useRef<NodeJS.Timeout>();

    useEffect(() => {
        switch (gameState) {
            case GameState.Playing:
                timeInterval.current = setInterval(() => {
                    setTimer(timer => timer + 1);
                }, 1000);
                break;
            case GameState.GameOver:
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

    return (
        <header className="mine-header">
            <button type="reset" onClick={onReset}>Reset</button>
            <time>{timerToString()}</time>
            <p>Size:</p>
            <p>Mines:</p>
        </header>
    );
};

export default TopBar;
