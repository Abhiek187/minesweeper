import { act, fireEvent, render, screen } from '@testing-library/react';
import App from './App';

let titleHeading: HTMLHeadingElement;
let resetButton: HTMLButtonElement;
let aiButton: HTMLButtonElement;
let timer: HTMLTimeElement;
let widthInput: HTMLInputElement;
let heightInput: HTMLInputElement;
let mineInput: HTMLInputElement;
let mineTiles: HTMLButtonElement[];

beforeEach(() => {
  // Load App and all its elements
  render(<App />);

  titleHeading = screen.getByText(/minesweeper/i) as HTMLHeadingElement; // ignore case
  resetButton = screen.getByText(/reset/i) as HTMLButtonElement;
  aiButton = screen.getByText(/ai/i) as HTMLButtonElement;
  timer = screen.getByText("00:00") as HTMLTimeElement;
  widthInput = screen.getByLabelText("Size:") as HTMLInputElement;
  heightInput = screen.getByLabelText("x") as HTMLInputElement;
  mineInput = screen.getByLabelText("Mines:") as HTMLInputElement;
  mineTiles = screen.getAllByText("0") as HTMLButtonElement[];
});

describe("the initial game state", () => {
  test("shows default values", () => {
    // Check that all the elements are loaded in the DOM
    expect(titleHeading).toBeInTheDocument();
    expect(resetButton).toBeInTheDocument();
    expect(aiButton).toBeInTheDocument();
    expect(timer).toBeInTheDocument();
    expect(widthInput).toBeInTheDocument();
    expect(heightInput).toBeInTheDocument();
    expect(mineInput).toBeInTheDocument();

    // Check all the starting values
    expect(timer.style.color).toBe("white");
    expect(widthInput.value).toBe("9");
    expect(heightInput.value).toBe("9");
    expect(mineInput.value).toBe("16"); // floor(9 * 9 * 0.2) = floor(16.2)
    expect(mineTiles).toHaveLength(81); // width * height

    for (const tile of mineTiles) {
      expect(tile.style.visibility).toBe("hidden");
    }
  });

  test("reset button does nothing", () => {
    act(() => {
      fireEvent.click(resetButton);
    });

    // Check that all the starting values remain as is
    expect(timer.style.color).toBe("white");
    expect(widthInput.value).toBe("9");
    expect(heightInput.value).toBe("9");
    expect(mineInput.value).toBe("16"); // floor(9 * 9 * 0.2) = floor(16.2)
    expect(mineTiles.length).toBe(81); // width * height

    for (const tile of mineTiles) {
      expect(tile.parentElement?.style.backgroundColor).toBe("rgb(237, 237, 237)");
      expect(tile.style.visibility).toBe("hidden");
    }
  });

  test("AI wins or loses the game", () => {
    jest.spyOn(console, "log").mockImplementation(() => { }); // don't print the console logs

    act(() => {
      fireEvent.click(aiButton);
    });

    // Check for a winning or losing scenario
    expect(timer.style.color === "red" || timer.style.color === "green").toBeTruthy();
    expect(mineTiles.filter(tile => tile.style.visibility === "visible").length).toBeGreaterThan(0);

    // Check that the board can't be clicked
    const oldTileStyle: CSSStyleDeclaration = mineTiles[0].style;
    fireEvent.click(mineTiles[0]);
    expect(mineTiles[0].style).toBe(oldTileStyle);
    fireEvent.contextMenu(mineTiles[0]);
    expect(mineTiles[0].style).toBe(oldTileStyle);
  });
});

describe("clicking tiles", () => {
  beforeEach(() => {
    // Use a fake timer to track the timer
    jest.useFakeTimers();
  });

  afterEach(() => {
    // Switch back to real timers
    jest.useRealTimers();
  });

  const testTiles = (tile: number, neighbors: number[]): void => {
    act(() => {
      fireEvent.click(mineTiles[tile]);
      jest.runOnlyPendingTimers();
    });

    // Check that a second passed and all the surrounding tiles are open
    expect(setInterval).toHaveBeenCalled();
    expect(setInterval).toHaveBeenLastCalledWith(expect.any(Function), 1000);
    expect(mineTiles[tile]).toHaveTextContent("0");
    expect(mineTiles[tile].parentElement?.style.backgroundColor).toBe("rgb(149, 149, 149)");

    for (const neighbor of neighbors) {
      expect(mineTiles[neighbor].parentElement?.style.backgroundColor).toBe("rgb(149, 149, 149)");
    }
  };

  test("the top left corner opens the bottom right tiles", () => {
    testTiles(0, [1, 9, 10]);
  });

  test("the top opens the bottom tiles", () => {
    testTiles(6, [5, 7, 14, 15, 16]);
  });

  test("the top right corner opens the bottom left tiles", () => {
    testTiles(8, [7, 16, 17]);
  });

  test("the left opens the right tiles", () => {
    testTiles(27, [18, 19, 28, 36, 37]);
  });

  test("the middle opens all 8 surrounding tiles", () => {
    testTiles(40, [30, 31, 32, 39, 41, 48, 49, 50]);
  });

  test("the right opens the left tiles", () => {
    testTiles(53, [43, 44, 52, 61, 62]);
  });

  test("the bottom left corner opens the top right tiles", () => {
    testTiles(72, [63, 64, 73]);
  });

  test("the bottom opens the top tiles", () => {
    testTiles(78, [68, 69, 70, 77, 79]);
  });

  test("the bottom right corner opens the top left tiles", () => {
    testTiles(80, [70, 71, 79]);
  });
});

describe("changing the inputs", () => {
  test("increasing the width increases the number of tiles", () => {
    act(() => {
      fireEvent.change(widthInput, { target: { min: "4", value: "10", max: "16" } });
    });

    // Re-fetch all the tiles
    mineTiles = screen.getAllByText("0") as HTMLButtonElement[];
    expect(widthInput.value).toBe("10");
    expect(mineTiles).toHaveLength(90); // 10 * 9
  });

  test("decreasing the height decreases the number of tiles", () => {
    act(() => {
      fireEvent.change(heightInput, { target: { min: "4", value: "8", max: "16" } });
    });

    mineTiles = screen.getAllByText("0") as HTMLButtonElement[];
    expect(heightInput.value).toBe("8");
    expect(mineTiles).toHaveLength(72); // 9 * 8
  });

  test("changing the number of mines doesn't change the number of tiles", () => {
    act(() => {
      fireEvent.change(mineInput, { target: { min: "8", value: "20", max: "24" } });
    });

    mineTiles = screen.getAllByText("0") as HTMLButtonElement[];
    expect(mineInput.value).toBe("20");
    expect(mineTiles).toHaveLength(81); // 9 * 9
  });

  test("non-numbers aren't accepted", () => {
    act(() => {
      fireEvent.change(widthInput, { target: { min: "4", value: "cheese257", max: "16" } });
    });

    mineTiles = screen.getAllByText("0") as HTMLButtonElement[];
    expect(widthInput.value).toBe("9");
    expect(mineTiles).toHaveLength(81); // 9 * 9
  });

  test("numbers out of range aren't accepted", () => {
    act(() => {
      fireEvent.change(mineInput, { target: { min: "8", value: "50", max: "24" } });
    });

    mineTiles = screen.getAllByText("0") as HTMLButtonElement[];
    expect(mineInput.value).toBe("16");
    expect(mineTiles).toHaveLength(81); // 9 * 9
  });
});
