import React from 'react';
import '../css/Tile.css';

export enum TileState {
    Hidden, // the number or mine is hidden
    Flagged, // a flag is shown after a right click
    Open // the number or mine is revealed
}

type BoardProps = {
    number: number,
    state: TileState,
    onClick: React.MouseEventHandler<HTMLButtonElement>,
    onRightClick: React.MouseEventHandler<HTMLButtonElement>
};

const Tile: React.FC<BoardProps> = ({ number, state, onClick, onRightClick }) => {
    // Context Menu = Right Click
    return (
        <button
            type="button"
            className="mine-button"
            onClick={onClick}
            onContextMenu={onRightClick}
            style={{
                backgroundColor: state === TileState.Open ? "#959595" : "#ededed"
            }}>
            <div className="mine-tile" style={{
                visibility: state === TileState.Hidden ||
                    (number === 0 && state !== TileState.Flagged) ? "hidden" : "visible"
            }}>
                {state === TileState.Flagged ? <i className="fas fa-flag" />
                    : number >= 0 ? number : <i className="fas fa-bomb" />}
            </div>
        </button>
    );
};

export default Tile;
