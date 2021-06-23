import React from 'react';
import '../css/Tile.css';

type BoardProps = {
    number: number,
    onClick: React.MouseEventHandler<HTMLButtonElement>
};

const Tile: React.FC<BoardProps> = ({ number, onClick }) => {
    return (
        <button type="button" className="mine-button" onClick={onClick}>
            <div className="mine-tile" style={{
                visibility: number === 0 ? "hidden" : "visible"
            }}>
                {number >= 0 ? number : <i className="fas fa-bomb" />}
            </div>
        </button>
    );
};

export default Tile;
