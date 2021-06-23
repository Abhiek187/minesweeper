import React, { useEffect, useState } from 'react';
import '../css/Board.css';
import { GameState } from './App';
import Tile from './Tile';

type BoardProps = {
    gameState: GameState,
    onInitialClick(): void,
    onGameOver(): void
};

const Board: React.FC<BoardProps> = ({ gameState, onInitialClick, onGameOver }) => {
    /* Observations:
     * 9x9 easy, 16x16 medium, 30x16 hard
     * first tile has to be 0
     * open all tiles automatically if 0
     * 10% occupancy easy, 20% medium, 30% hard, 50% impossible
     * select tiles w/ 0% chance of mine
     * flag tiles w/ 100% chance of mine
     * choose tiles w/ lowest chance of mine
     */
    const [width, setWidth] = useState<number>(9);
    const [height, setHeight] = useState<number>(9);
    const [mines, setMines] = useState<number>(Math.floor(width * height * 0.2));
    const [tiles, setTiles] = useState<number[]>(Array(width * height).fill(0));
    const [hiddenTiles, setHiddenTiles] = useState<boolean[]>(Array(width * height).fill(true));

    useEffect(() => {
        if (gameState === GameState.Initial) {
            // Cover the tiles after restarting the game
            setHiddenTiles(Array(width * height).fill(true));
        }
    }, [gameState, width, height]);

    const excludeIndices = (arr: number[], exs: number[]): number[] => (
        arr.filter((_, i) => !exs.includes(i))
    );

    const getAdjacentTiles = (tile: number): number[] => {
        // Get the x and y position based on the index of the tile
        const [x, y]: [number, number] = [tile % width, Math.floor(tile / width)];
        let adjacentTiles: number[] = [
            tile - width - 1, tile - width, tile - width + 1, // upper 3 [0, 1, 2]
            tile - 1, tile + 1, // left and right [3, 4]
            tile + width - 1, tile + width, tile + width + 1 // lower 3 [5, 6, 7]
        ];

        // Exclude tiles outside the board's boundaries
        if (x === 0) {
            if (y === 0) {
                // Top left corner: only keep the 3 on the lower right
                adjacentTiles = excludeIndices(adjacentTiles, [0, 1, 2, 3, 5]);
            } else if (y === height - 1) {
                // Bottom left corner: only keep the 3 on the upper right
                adjacentTiles = excludeIndices(adjacentTiles, [0, 3, 5, 6, 7]);
            } else {
                // First column: ignore the left side
                adjacentTiles = excludeIndices(adjacentTiles, [0, 3, 5]);
            }
        } else if (x === width - 1) {
            if (y === 0) {
                // Top right corner: only keep the 3 on the lower left
                adjacentTiles = excludeIndices(adjacentTiles, [0, 1, 2, 4, 7]);
            } else if (y === height - 1) {
                // Bottom right corner: only keep the 3 on the upper left
                adjacentTiles = excludeIndices(adjacentTiles, [2, 4, 5, 6, 7]);
            } else {
                // Last column: ignore the right side
                adjacentTiles = excludeIndices(adjacentTiles, [2, 4, 7]);
            }
        } else if (y === 0) {
            // First row: ignore the top
            adjacentTiles = excludeIndices(adjacentTiles, [0, 1, 2]);
        } else if (y === height - 1) {
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
        let indices = Array.from(Array(width * height).keys());
        indices = indices.filter((_, i) => !excludedTiles.includes(i));
        indices = shuffleArray(indices);
        return indices.slice(0, mines);
    };

    const uncoverTile = (index: number): void => {
        // Show the selected tile
        const newHiddenTiles = [...hiddenTiles];
        newHiddenTiles[index] = false;

        if (tiles[index] === 0) {
            // Uncover all surrounding spaces if the tile's a 0
            const adjacentTiles = getAdjacentTiles(index);

            for (const adjacentTile of adjacentTiles) {
                newHiddenTiles[adjacentTile] = false;
            }
        } else if (tiles[index] === -1) {
            // End the game if a mine is discovered
            onGameOver();
        }

        setHiddenTiles(newHiddenTiles); // refresh all the tiles
    };

    const generateBoard = (clickedTile: number): void => {
        // Upon clicking the first tile:
        // 1. Initialize the game board with 0s
        const size: number = width * height;
        const newTiles = Array<number>(size).fill(0);
        // 2. Shuffle the spaces, excluding the clicked tile and its adjacent tiles
        const excludedTiles: number[] = getAdjacentTiles(clickedTile);
        excludedTiles.push(clickedTile);
        const badTiles = placeMines(excludedTiles);

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
        uncoverTile(clickedTile);
    };

    const determineGameAction = (index: number): void => {
        // Set the click event depending on the current game state
        if (gameState === GameState.Initial) {
            // Set up all the mines and start playing the game
            generateBoard(index);
            onInitialClick(); // notify the parent of a change in game state
        } else if (gameState === GameState.Playing) {
            // Uncover the tile and check if it's a mine
            if (hiddenTiles[index]) {
                uncoverTile(index);
            }
        }
        // Don't do anything if the tile is already revealed or in a game over state
    };

    return (
        <main className="mine-board" style={{
            width: `${50 * width}px`,
            height: `${50 * height}px`,
            gridTemplateColumns: `repeat(${width}, 50px)`,
            gridTemplateRows: "repeat(auto-fill, 50px)"
        }}>
            {tiles.map((tile, index) =>
                <Tile
                    key={index}
                    number={tile}
                    isHidden={hiddenTiles[index]}
                    onClick={() => determineGameAction(index)}
                />
            )}
        </main>
    );
};

export default Board;
