import React, { useCallback, useEffect, useState } from 'react';
import '../css/Board.css';
import { GameState } from './App';
import Tile, { TileState } from './Tile';

type BoardProps = {
    gameState: GameState,
    isAI: boolean,
    boardWidth: number,
    boardHeight: number,
    mines: number,
    onInitialClick(): void,
    onWin(): void,
    onLose(): void
};

type MineTile = {
    number: number, // number of surrounding mines
    state: TileState, // whether the tile is open, closed, or flagged
    prob: number // probability of a mine being present (for the agent)
};

const Board: React.FC<BoardProps> = (
    { gameState, isAI, boardWidth, boardHeight, mines, onInitialClick, onWin, onLose }
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
    const [tiles, setTiles] = useState<MineTile[]>([...Array(boardWidth * boardHeight)].map(_ => ({
        number: 0,
        state: TileState.Hidden,
        prob: -1
    })));

    const excludeIndices = (arr: number[], exs: number[]): number[] => (
        arr.filter((_, i) => !exs.includes(i))
    );

    const shuffleArray = (arr: number[]): number[] => {
        // Swap each index with a random index
        for (let i = 0; i < arr.length; i++) {
            const randI: number = Math.floor(Math.random() * arr.length);
            [arr[i], arr[randI]] = [arr[randI], arr[i]];
        }

        return arr;
    };

    const getAdjacentTiles = useCallback((tile: number): number[] => {
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
    }, [boardHeight, boardWidth]);

    const placeMines = useCallback((excludedTiles: number[]): number[] => {
        // Shuffle the spaces outside the clicked area and return the indices with mines
        let indices: number[] = Array.from(Array(tiles.length).keys());
        indices = excludeIndices(indices, excludedTiles);
        indices = shuffleArray(indices);
        return indices.slice(0, mines);
    }, [mines, tiles.length]);

    const uncoverTile = useCallback((index: number, currentTiles: MineTile[] = tiles): void => {
        // Show the selected tile
        // If this is the first square clicked, currentTiles will reflect what tiles will be after re-rendering
        const newTiles: MineTile[] = [...currentTiles]; // copy an array of objects
        newTiles[index].state = TileState.Open;

        if (currentTiles[index].number === 0) {
            // Uncover all surrounding spaces if the tile's a 0
            const adjacentTiles: number[] = getAdjacentTiles(index);

            for (const adjacentTile of adjacentTiles) {
                newTiles[adjacentTile].state = TileState.Open;
            }
        }

        if (currentTiles[index].number === -1) {
            // Lose the game if a mine is discovered
            for (let i = 0; i < tiles.length; i++) {
                // Show where all the other mines are located
                if (tiles[i].state !== TileState.Open && tiles[i].number === -1) {
                    newTiles[i].state = TileState.Open;
                }
            }

            onLose();
        } else {
            // Win the game if all the covered tiles are mines
            const remainingTiles: number = newTiles.filter(tile => tile.state !== TileState.Open).length;

            if (remainingTiles === mines) {
                onWin();
            }
        }

        setTiles(newTiles); // refresh all the tiles
    }, [getAdjacentTiles, mines, onLose, onWin, tiles]);

    const generateBoard = useCallback((clickedTile: number): void => {
        // Upon clicking the first tile:
        // 1. Initialize the game board with 0s
        const newTiles: MineTile[] = [...tiles];
        // 2. Shuffle the spaces, excluding the clicked tile and its adjacent tiles
        const excludedTiles: number[] = getAdjacentTiles(clickedTile);
        excludedTiles.push(clickedTile);
        const badTiles: number[] = placeMines(excludedTiles);

        // 3. Place mines on the first x tiles, record the indices
        for (const badTile of badTiles) {
            newTiles[badTile].number = -1;
        }

        // 4. For each mine, increment the counts on all the safe adjacent spaces
        for (const badTile of badTiles) {
            for (const adjacentTile of getAdjacentTiles(badTile)) {
                if (newTiles[adjacentTile].number !== -1) {
                    newTiles[adjacentTile].number++;
                }
            }
        }

        // 5. Uncover the selected tile + all surrounding tiles
        uncoverTile(clickedTile, newTiles);
    }, [getAdjacentTiles, placeMines, tiles, uncoverTile]);

    const determineGameAction = useCallback((index: number): void => {
        // Set the click event depending on the current game state
        if (gameState === GameState.Initial) {
            // Make sure the number of mines is between 10% and 30% of the board's size
            if (mines < Math.floor(tiles.length * 0.1) || mines > Math.floor(tiles.length * 0.3)) {
                onLose(); // force the agent to stop
                return;
            }

            // Set up all the mines and start playing the game
            generateBoard(index);
            onInitialClick(); // notify the parent of a change in game state
        } else if (gameState === GameState.Playing) {
            // Uncover the tile and check if it's a mine (don't accidently click a flagged space)
            if (tiles[index].state === TileState.Hidden) {
                uncoverTile(index);
            }
        }
        // Don't do anything if the tile is already revealed or in a game over state
    }, [gameState, generateBoard, mines, onInitialClick, onLose, tiles, uncoverTile]);

    const flagTile = (event: React.MouseEvent, index: number): void => {
        // Don't show the right click menu
        event.preventDefault();
        // Toggle the flag state on an uncovered tile while playing
        if (gameState === GameState.Playing && tiles[index].state !== TileState.Open) {
            const newTiles: MineTile[] = [...tiles];
            newTiles[index].state =
                newTiles[index].state === TileState.Hidden ? TileState.Flagged : TileState.Hidden;
            setTiles(newTiles);
        }
    };

    const startAgent = useCallback((): void => {
        // Start by clicking a random tile
        if (gameState === GameState.Initial) {
            const randTile: number = Math.floor(Math.random() * tiles.length);
            console.log(`Initial: Clicking on R${Math.floor(randTile / boardWidth)}, C${randTile % boardWidth}`);
            determineGameAction(randTile);
        }

        // Repeat until the agent wins or loses
        if (gameState !== GameState.Playing) return;

        // If the agent has to make a guess, generate a probability map of encountering a mine for each uncovered tile
        const newTiles: MineTile[] = tiles.map(tile => ({ ...tile, prob: -1 }));

        // Look at all the uncovered tiles
        for (let i = 0; i < tiles.length; i++) {
            if (tiles[i].state === TileState.Open) {
                // Look for any situations where
                // (# of the tile - # of adjacent flagged tiles)/(# of adjacent uncovered (non-flagged) tiles) = 0 or 1
                const adjacentTiles: number[] = getAdjacentTiles(i);
                const tileNum: number = tiles[i].number;
                const adjacentFlaggedTiles: number = adjacentTiles.filter(
                    index => tiles[index].state === TileState.Flagged
                ).length;
                const adjacentHiddenTiles: number = adjacentTiles.filter(
                    index => tiles[index].state === TileState.Hidden
                ).length;

                if (adjacentHiddenTiles === 0) continue; // skip tiles without new information
                const mineOdds: number =
                    (tileNum - adjacentFlaggedTiles) / adjacentHiddenTiles;
                console.log(`R${Math.floor(i / boardWidth)}, C${i % boardWidth}:
                adjacentTiles = ${adjacentTiles},
                tileNum = ${tileNum},
                adjacentFlaggedTiles = ${adjacentFlaggedTiles},
                adjacentHiddenTiles = ${adjacentHiddenTiles}
                mineOdds = ${mineOdds}`);

                if (mineOdds === 1) {
                    // If the probability is 1, flag the adjacent tiles
                    for (const adjacentTile of adjacentTiles) {
                        if (tiles[adjacentTile].state === TileState.Hidden) {
                            newTiles[adjacentTile].state = TileState.Flagged;
                            console.log(`P = 1: Flagging R${Math.floor(adjacentTile / boardWidth)}, C${adjacentTile % boardWidth}`);
                            // Calculate the amount of mines gotten
                            const flaggedTiles: number = newTiles.filter(
                                newTile => newTile.state === TileState.Flagged
                            ).length;
                            console.log(`${flaggedTiles}/${mines} mines flagged (${Math.round(flaggedTiles / mines * 100)}%)`);
                        }
                    }

                    setTiles(newTiles);
                    return;
                } else if (mineOdds === 0) {
                    // If the probability is 0, uncover the adjacent tiles
                    for (const adjacentTile of adjacentTiles) {
                        if (tiles[adjacentTile].state === TileState.Hidden) {
                            uncoverTile(adjacentTile);
                            console.log(`P = 0: Clicking on R${Math.floor(adjacentTile / boardWidth)}, C${adjacentTile % boardWidth}`);
                        }
                    }

                    return;
                } else {
                    // Update the probability if it increases due to some other tile or is guaranteed to be safe
                    for (const adjacentTile of adjacentTiles) {
                        if (tiles[adjacentTile].state === TileState.Hidden && mineOdds > newTiles[adjacentTile].prob) {
                            newTiles[adjacentTile].prob = mineOdds;
                        }
                    }
                }
            } else if (tiles[i].state === TileState.Hidden && newTiles[i].prob === -1) {
                // For the remaining covered tiles that aren't adjacent to an uncovered tile, set their probability as (# of mines remaining)/(# of uncovered (non-flagged) tiles)
                const flaggedTiles: number = tiles.filter(
                    tile => tile.state === TileState.Flagged
                ).length;
                const minesRemaining: number = mines - flaggedTiles;
                const remainingTiles: number = newTiles.filter(tile => tile.state !== TileState.Open).length;
                newTiles[i].prob = minesRemaining / remainingTiles;
            }
        }

        // Select the tile with the smallest probability of being a mine
        let minProb: number = 1;
        let safestTiles: number[] = [];

        for (let i = 0; i < tiles.length; i++) {
            // Compare floats using epsilon
            if (
                newTiles[i].prob !== -1 &&
                Math.abs(newTiles[i].prob - minProb) < Number.EPSILON
            ) {
                safestTiles.push(i);
            } else if (newTiles[i].prob !== -1 && newTiles[i].prob < minProb) {
                minProb = newTiles[i].prob;
                safestTiles = [i];
            }
        }

        // If there's a tie, pick a random tile
        console.log(`minProb = ${minProb}, safestTiles = ${safestTiles}`);
        const randTile: number = safestTiles[Math.floor(Math.random() * safestTiles.length)];
        uncoverTile(randTile);
        console.log(`Guess: Clicking on R${Math.floor(randTile / boardWidth)}, C${randTile % boardWidth}`);
    }, [boardWidth, determineGameAction, gameState, getAdjacentTiles, mines, tiles, uncoverTile]);

    useEffect(() => {
        const coveredTiles: number = tiles.filter(tile => tile.state === TileState.Hidden).length;

        if (gameState === GameState.Initial && coveredTiles !== boardWidth * boardHeight) {
            // Initialize a new set of tiles if the size changes or the game has restarted
            setTiles([...Array(boardWidth * boardHeight)].map(_ => ({
                number: 0,
                state: TileState.Hidden,
                prob: -1
            })));
        }

        if (isAI) {
            startAgent();
        }
    }, [tiles, gameState, boardWidth, boardHeight, isAI, startAgent]);

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
                    number={tile.number}
                    state={tile.state}
                    onClick={() => determineGameAction(index)}
                    onRightClick={(event) => flagTile(event, index)}
                />
            )}
        </main>
    );
};

export default Board;
