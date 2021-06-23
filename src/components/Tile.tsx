import React from 'react';
import '../css/Tile.css';

type BoardProps = {
    number: number,
    isHidden: boolean,
    onClick: React.MouseEventHandler<HTMLButtonElement>
};

const Tile: React.FC<BoardProps> = ({ number, isHidden, onClick }) => {
    return (
        <button type="button" className="mine-button" onClick={onClick} style={{
            backgroundColor: isHidden ? "#ededed" : "#959595"
        }}>
            <div className="mine-tile" style={{
                visibility: isHidden || number === 0 ? "hidden" : "visible"
            }}>
                {number >= 0 ? number : <i className="fas fa-bomb" />}
            </div>
        </button>
    );
};

export default Tile;
