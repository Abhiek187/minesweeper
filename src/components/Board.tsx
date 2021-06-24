import React, { useEffect, useState } from 'react';
import '../css/Board.css';
import { GameState } from './App';
import Tile, { TileState } from './Tile';

type BoardProps = {
    gameState: GameState,
    boardWidth: number,
    boardHeight: number,
    mines: number,
    onInitialClick(): void,
    onWin(): void,
    onLose(): void
};

const Board: React.FC<BoardProps> = (
    { gameState, boardWidth, boardHeight, mines, onInitialClick, onWin, onLose }
) => {
    /* Observations:
     * 9x9 easy, 16x16 medium, 30x16 hard
     * first tile has to be 0
     * open all tiles automatically if 0
     * 10% occupancy easy, 20% medium, 30% hard, 50% impossible
     * select tiles w/ 0% chance of mine
     * flag tiles w/ 100% chance of mine
     * choose tiles w/ lowest chance of mine
     */
    const [tiles, setTiles] = useState<number[]>(Array(boardWidth * boardHeight).fill(0));
    const [tileStates, setTileStates] = useState<TileState[]>(
        Array(boardWidth * boardHeight).fill(TileState.Hidden)
    );
    // # of uncovered tiles
    const [remainingTiles, setRemainingTiles] = useState<number>(boardWidth * boardHeight);

    useEffect(() => {
        if (gameState === GameState.Initial) {
            // Cover the tiles after restarting the game
            setTileStates(Array(boardWidth * boardHeight).fill(TileState.Hidden));
            setRemainingTiles(boardWidth * boardHeight);
        }
    }, [gameState, boardWidth, boardHeight]);

    const excludeIndices = (arr: number[], exs: number[]): number[] => (
        arr.filter((_, i) => !exs.includes(i))
    );

    const getAdjacentTiles = (tile: number): number[] => {
        // Get the x and y position based on the index of the tile
        const [x, y]: [number, number] = [tile % boardWidth, Math.floor(tile / boardWidth)];
        let adjacentTiles: number[] = [
            tile - boardWidth - 1, tile - boardWidth, tile - boardWidth + 1, // upper 3 [0, 1, 2]
            tile - 1, tile + 1, // left and right [3, 4]
            tile + boardWidth - 1, tile + boardWidth, tile + boardWidth + 1 // lower 3 [5, 6, 7]
        ];

        // Exclude tiles outside the board's boundaries
        if (x === 0) {
            if (y === 0) {
                // Top left corner: only keep the 3 on the lower right
                adjacentTiles = excludeIndices(adjacentTiles, [0, 1, 2, 3, 5]);
            } else if (y === boardHeight - 1) {
                // Bottom left corner: only keep the 3 on the upper right
                adjacentTiles = excludeIndices(adjacentTiles, [0, 3, 5, 6, 7]);
            } else {
                // First column: ignore the left side
                adjacentTiles = excludeIndices(adjacentTiles, [0, 3, 5]);
            }
        } else if (x === boardWidth - 1) {
            if (y === 0) {
                // Top right corner: only keep the 3 on the lower left
                adjacentTiles = excludeIndices(adjacentTiles, [0, 1, 2, 4, 7]);
            } else if (y === boardHeight - 1) {
                // Bottom right corner: only keep the 3 on the upper left
                adjacentTiles = excludeIndices(adjacentTiles, [2, 4, 5, 6, 7]);
            } else {
                // Last column: ignore the right side
                adjacentTiles = excludeIndices(adjacentTiles, [2, 4, 7]);
            }
        } else if (y === 0) {
            // First row: ignore the top
            adjacentTiles = excludeIndices(adjacentTiles, [0, 1, 2]);
        } else if (y === boardHeight - 1) {
            // Last row: ignore the bottom
            adjacentTiles = excludeIndices(adjacentTiles, [5, 6, 7]);
        }

        return adjacentTiles;
    };

    const shuffleArray = (arr: number[]): number[] => {
        // Swap each index with a random index
        for (let i = 0; i < arr.length; i++) {
            const randI: number = Math.floor(Math.random() * arr.length);
            [arr[i], arr[randI]] = [arr[randI], arr[i]];
        }

        return arr;
    };

    const placeMines = (excludedTiles: number[]): number[] => {
        // Shuffle the spaces outside the clicked area and return the indices with mines
        let indices: number[] = Array.from(Array(boardWidth * boardHeight).keys());
        indices = indices.filter((_, i) => !excludedTiles.includes(i));
        indices = shuffleArray(indices);
        return indices.slice(0, mines);
    };

    const uncoverTile = (index: number, currentTiles: number[] = tiles): void => {
        // Show the selected tile
        // If this is the first square clicked, currentTiles will reflect what tiles will be after re-rendering
        const newTileStates: TileState[] = [...tileStates];
        newTileStates[index] = TileState.Open;
        let tilesOpened: number = 1;

        if (currentTiles[index] === 0) {
            // Uncover all surrounding spaces if the tile's a 0
            const adjacentTiles: number[] = getAdjacentTiles(index);

            for (const adjacentTile of adjacentTiles) {
                if (newTileStates[adjacentTile] !== TileState.Open) {
                    newTileStates[adjacentTile] = TileState.Open;
                    tilesOpened++; // don't count the tiles that are already opened
                }
            }
        }

        if (currentTiles[index] === -1) {
            // Lose the game if a mine is discovered
            onLose();
        } else {
            // Win the game if all the covered tiles are mines
            if (remainingTiles - tilesOpened === mines) {
                onWin();
            }

            setRemainingTiles(remainingTiles - tilesOpened);
        }

        setTileStates(newTileStates); // refresh all the tiles
    };

    const generateBoard = (clickedTile: number): void => {
        // Upon clicking the first tile:
        // 1. Initialize the game board with 0s
        const size: number = boardWidth * boardHeight;
        const newTiles: number[] = Array<number>(size).fill(0);
        // 2. Shuffle the spaces, excluding the clicked tile and its adjacent tiles
        const excludedTiles: number[] = getAdjacentTiles(clickedTile);
        excludedTiles.push(clickedTile);
        const badTiles: number[] = placeMines(excludedTiles);

        // 3. Place mines on the first x tiles, record the indices
        for (const badTile of badTiles) {
            newTiles[badTile] = -1;
        }

        // 4. For each mine, increment the counts on all the safe adjacent spaces
        for (const badTile of badTiles) {
            for (const adjacentTile of getAdjacentTiles(badTile)) {
                if (newTiles[adjacentTile] !== -1) {
                    newTiles[adjacentTile]++;
                }
            }
        }

        // 5. Uncover the selected tile + all surrounding tiles
        setTiles(newTiles);
        uncoverTile(clickedTile, newTiles);
    };

    const determineGameAction = (index: number): void => {
        // Set the click event depending on the current game state
        if (gameState === GameState.Initial) {
            // Set up all the mines and start playing the game
            generateBoard(index);
            onInitialClick(); // notify the parent of a change in game state
        } else if (gameState === GameState.Playing) {
            // Uncover the tile and check if it's a mine (don't accidently click a flagged space)
            if (tileStates[index] === TileState.Hidden) {
                uncoverTile(index);
            }
        }
        // Don't do anything if the tile is already revealed or in a game over state
    };

    const flagTile = (event: React.MouseEvent, index: number): void => {
        // Don't show the right click menu
        event.preventDefault();
        // Toggle the flag state on an uncovered tile while playing
        if (gameState === GameState.Playing && tileStates[index] !== TileState.Open) {
            const newTileStates: TileState[] = [...tileStates];
            newTileStates[index] =
                newTileStates[index] === TileState.Hidden ? TileState.Flagged : TileState.Hidden;
            setTileStates(newTileStates);
        }
    };

    return (
        <main className="mine-board" style={{
            width: `${50 * boardWidth}px`,
            height: `${50 * boardHeight}px`,
            gridTemplateColumns: `repeat(${boardWidth}, 50px)`,
            gridTemplateRows: "repeat(auto-fill, 50px)"
        }}>
            {tiles.map((tile, index) =>
                <Tile
                    key={index}
                    number={tile}
                    state={tileStates[index]}
                    onClick={() => determineGameAction(index)}
                    onRightClick={(event) => flagTile(event, index)}
                />
            )}
        </main>
    );
};

export default Board;