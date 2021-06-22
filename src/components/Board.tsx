import React, { useState } from 'react';
import '../css/Board.css';
import Tile from './Tile';

const Board: React.FC = () => {
    const [size, setSize] = useState<number>(9);
    const [mines, setMines] = useState<number>(4);
    const [isMine, setIsMine] = useState<boolean[]>([
        true, false, true, false, false, false, true, false, true
    ]);
    const [tiles, setTiles] = useState<number[]>([
        -1, 2, -1, 2, 4, 2, -1, 2, -1
    ]);

    return (
        <main className="mine-board">
            {tiles.map((tile, index) =>
                <Tile key={index} number={tile} />
            )}
        </main>
    );
};

export default Board;
