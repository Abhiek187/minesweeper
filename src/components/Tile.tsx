import React from 'react';
import '../css/Tile.css';

type BoardProps = {
    number: number
};

const Tile: React.FC<BoardProps> = ({ number }) => {
    return (
        <div className="mine-tile">
            {number}
        </div>
    );
};

export default Tile;
