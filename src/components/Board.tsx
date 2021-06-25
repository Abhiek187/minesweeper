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
    const [tiles, setTiles] = useState<number[]>(Array(boardWidth * boardHeight).fill(0));
    const [tileStates, setTileStates] = useState<TileState[]>(
        Array(tiles.length).fill(TileState.Hidden)
    );
    // # of uncovered tiles
    const [remainingTiles, setRemainingTiles] = useState<number>(tiles.length);

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
        let indices: number[] = Array.from(Array(tiles.length).keys());
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
            for (let i = 0; i < tiles.length; i++) {
                // Show where all the other mines are located
                if (tileStates[i] !== TileState.Open && tiles[i] === -1) {
                    newTileStates[i] = TileState.Open;
                }
            }

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

    //const wait = (seconds: number): Promise<unknown> => new Promise(res => setTimeout(res, seconds));

    const startAgent = useCallback((): void => {
        // Start by clicking a random tile
        if (gameState === GameState.Initial) {
            const randTile: number = Math.floor(Math.random() * tiles.length);
            console.log(`Initial: Clicking on R${Math.floor(randTile / boardWidth)}, C${randTile % boardWidth}`);
            determineGameAction(randTile);
        }

        // Repeat until the agent wins or loses
        if (gameState !== GameState.Playing) return;
        // Show each move every second
        //await wait(1);

        // If the agent has to make a guess, generate a probability map of encountering a mine for each uncovered tile
        const mineProbs: number[] = Array(tiles.length).fill(-1);

        // Look at all the uncovered tiles
        for (let i = 0; i < tiles.length; i++) {
            if (tileStates[i] === TileState.Open) {
                // Look for any situations where
                // (# of the tile - # of adjacent flagged tiles)/(# of adjacent uncovered (non-flagged) tiles) = 0 or 1
                const adjacentTiles: number[] = getAdjacentTiles(i);
                const tileNum: number = tiles[i];
                const adjacentFlaggedTiles: number = adjacentTiles.filter(
                    index => tileStates[index] === TileState.Flagged
                ).length;
                const adjacentHiddenTiles: number = adjacentTiles.filter(
                    index => tileStates[index] === TileState.Hidden
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
                    const newTileStates: TileState[] = [...tileStates];

                    for (const adjacentTile of adjacentTiles) {
                        if (tileStates[adjacentTile] === TileState.Hidden) {
                            newTileStates[adjacentTile] = TileState.Flagged;
                            console.log(`P = 1: Flagging R${Math.floor(adjacentTile / boardWidth)}, C${adjacentTile % boardWidth}`);
                            // Calculate the amount of mines gotten
                            const flaggedTiles: number = tiles.filter(
                                (_, index) => newTileStates[index] === TileState.Flagged
                            ).length;
                            console.log(`${flaggedTiles}/${mines} mines flagged (${Math.round(flaggedTiles / mines * 100)}%)`);
                        }
                    }

                    setTileStates(newTileStates);
                    return;
                } else if (mineOdds === 0) {
                    // If the probability is 0, uncover the adjacent tiles
                    for (const adjacentTile of adjacentTiles) {
                        if (tileStates[adjacentTile] === TileState.Hidden) {
                            uncoverTile(adjacentTile);
                            console.log(`P = 0: Clicking on R${Math.floor(adjacentTile / boardWidth)}, C${adjacentTile % boardWidth}`);
                        }
                    }

                    return;
                } else {
                    // Update the probabilities if it increases due to some other tile or is guaranteed to be safe
                    for (const adjacentTile of adjacentTiles) {
                        if (tileStates[adjacentTile] === TileState.Hidden && mineOdds > mineProbs[adjacentTile]) {
                            mineProbs[adjacentTile] = mineOdds;
                        }
                    }
                }
            } else if (tileStates[i] === TileState.Hidden && mineProbs[i] === -1) {
                // For the remaining covered tiles that aren't adjacent to an uncovered tile, set their probability as (# of mines remaining)/(# of uncovered (non-flagged) tiles)
                const flaggedTiles: number = tiles.filter(
                    (_, index) => tileStates[index] === TileState.Flagged
                ).length;
                const minesRemaining: number = mines - flaggedTiles;
                mineProbs[i] = minesRemaining / remainingTiles;
            }
        }

        // Select the tile with the smallest probability of being a mine
        let minProb: number = 1;
        let safestTiles: number[] = [];

        for (let i = 0; i < mineProbs.length; i++) {
            // Compare floats using epsilon
            if (
                mineProbs[i] !== -1 &&
                Math.abs(mineProbs[i] - minProb) < Number.EPSILON
            ) {
                safestTiles.push(i);
            } else if (mineProbs[i] !== -1 && mineProbs[i] < minProb) {
                minProb = mineProbs[i];
                safestTiles = [i];
            }
        }

        // If there's a tie, pick a random tile
        console.log(`minProb = ${minProb}, safestTiles = ${safestTiles}`);
        const randTile: number = safestTiles[Math.floor(Math.random() * safestTiles.length)];
        uncoverTile(randTile);
        console.log(`Guess: Clicking on R${Math.floor(randTile / boardWidth)}, C${randTile % boardWidth}`);
    }, [boardWidth, determineGameAction, gameState, getAdjacentTiles, mines, remainingTiles, tileStates, tiles, uncoverTile]);

    useEffect(() => {
        if (gameState === GameState.Initial) {
            // Cover the tiles after restarting the game
            setTileStates(Array(tiles.length).fill(TileState.Hidden));
            setRemainingTiles(tiles.length);
        }

        // let timeout: NodeJS.Timeout;

        if (isAI) {
            startAgent();
        }
    }, [gameState, tiles.length, isAI, startAgent]);

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
