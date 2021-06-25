// Agent:
// - Start by clicking a random tile
// - Generate a probability map for each tile indicating the odds of encountering a mine
// 	- Look at all the uncovered tiles
// 	- If there are 0 tiles, uncover all surrounding tiles
// 	- Look for any situations where (# of the tile - # of adjacent flagged tiles)/(# of adjacent uncovered (non-flagged) tiles) = 1 and mark those tiles as flagged
// 	- Likewise, if that fraction is 0, uncover that tile
// 	- In decreasing order (or not?), update the probability of every adjacent tile as (# of the tile - # of adjacent flagged tiles)/(# of adjacent uncovered (non-flagged) tiles) {2/9, 1 x 3, 2/9 x 12}
// 	- Update the probabilities if it increases due to some other tile or is guaranteed to be safe {2/9, 1 x 3, 1/3 x 3, 2/9 x 9}, {0, 1 x 3, 1/3 x 3, 2/9 x 7, 0 x 2}, {0, 1 x 4, 0 x 11}
// 	- For the remaining covered tiles that aren't adjacent to an uncovered tile, set their probability as (# of mines remaining)/(# of uncovered (non-flagged) tiles) {16/72 = 2/9}
// - Select the tile with the smallest probability of being a mine
// 	- If there's a tie, pick a random tile or all the tiles
// - Repeat until the agent wins or loses
//
// 9 remaining: {1/2 x 2, 2/3 x 3, 1/2, 3/4 x 4, 1/4, 1/3, 2/3 x 4, 1/3, 1/2, 9/20 x 3}
// 6 remaining: {1/2 x 2, 2/3 x 3, 1/2, 2/3 x 3, 1/2, 6/13 x 3}

import { GameState } from "../components/App";
import { TileState } from "../components/Tile";

export const startAgent = (
  tiles: number[],
  determineGameAction: (index: number) => void,
  gameState: GameState,
  tileStates: TileState[],
  setTileStates: React.Dispatch<React.SetStateAction<TileState[]>>,
  getAdjacentTiles: (tile: number) => number[],
  uncoverTile: (index: number, currentTiles?: number[]) => void,
  mines: number,
  remainingTiles: number
): void => {
  // Start by clicking a random tile
  const randTile: number = Math.floor(Math.random() * tiles.length);
  determineGameAction(randTile);
  let isStuck: boolean = false;

  // Repeat until the agent wins or loses
  while (gameState === GameState.Playing) {
    isStuck = true;
    // If the agent has to make a guess, generate a probability map of encountering a mine for each uncovered tile
    const mineProbs: number[] = Array(tiles.length).fill(-1);

    // Look at all the uncovered tiles
    for (let i = 0; i < tiles.length; i++) {
      if (tileStates[i] === TileState.Open) {
        // Look for any situations where
        // (# of the tile - # of adjacent flagged tiles)/(# of adjacent uncovered (non-flagged) tiles) = 0 or 1
        // If 1: flag the tile, else: uncover the tile
        const adjacentTiles: number[] = getAdjacentTiles(i);
        const tileNum: number = tiles[i];
        const adjacentFlaggedTiles: number = adjacentTiles.filter(
          (_, index) => tileStates[index] === TileState.Flagged
        ).length;
        const adjacentHiddenTiles: number = adjacentTiles.filter(
          (_, index) => tileStates[index] === TileState.Hidden
        ).length;

        if (adjacentHiddenTiles === 0) continue; // skip tiles without new information
        const mineOdds: number =
          (tileNum - adjacentFlaggedTiles) / adjacentHiddenTiles;

        if (mineOdds === 1) {
          const newTileStates: TileState[] = [...tileStates];
          newTileStates[i] = TileState.Flagged;
          setTileStates(newTileStates);
          isStuck = false;
        } else if (mineOdds === 0) {
          uncoverTile(i);
          isStuck = false;
        } else {
          // Update the probabilities if it increases due to some other tile or is guaranteed to be safe
          if (mineOdds > mineProbs[i]) {
            mineProbs[i] = mineOdds;
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

    if (isStuck) {
      // Select the tile with the smallest probability of being a mine
      let minProb: number = 1;
      let safestTiles: number[] = [];

      for (let i = 0; i < mineProbs.length; i++) {
        // Compare floats using epsilon
        if (
          mineProbs[i] !== -1 &&
          Math.abs(mineProbs[i] - minProb) < Number.EPSILON
        ) {
          safestTiles.push(tiles[i]);
        } else if (mineProbs[i] !== -1 && mineProbs[i] < minProb) {
          minProb = mineProbs[i];
          safestTiles = [tiles[i]];
        }
      }

      // If there's a tie, pick a random tile
      const randTile: number = Math.floor(Math.random() * safestTiles.length);
      uncoverTile(randTile);
    }
  }
};
