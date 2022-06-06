import type { ActionObject, ActorRefFrom } from "xstate";
import { createMachine, spawn, assign, send } from "xstate";
import { pure, stop } from "xstate/lib/actions";
import { cellMachine } from "./cellMachine";

interface CellPosition {
  x: number;
  y: number;
}

export interface Cell {
  type: "mine" | "safe";
  ref: ActorRefFrom<typeof cellMachine>;
}

interface Context {
  board: null | Cell[][];
}

type BoardMachineEvent =
  | { type: "START"; width: number; height: number; mines: number }
  | { type: "REVEAL_CELL"; position: CellPosition }
  | { type: "FLAG_CELL"; position: CellPosition }
  | { type: "UNFLAG_CELL"; position: CellPosition };

export const boardMachine =
  /** @xstate-layout N4IgpgJg5mDOIC5QFsCWA7OB3MYAOYATgEID2AhoRAHSoQA2YAxAMoAqAggEpuKh6lYqAC6pS6PiAAeiALQA2AMzUATAE4A7JoCMigBwAWAwFZFKvQBoQAT0Rb51Yyt3H58tXu0AGNYoC+flZomLA4+ERklDR49OTWGFDUWOQiCQBipIRpqISwwgCypABuzFwAogBqZRwAMgD6AMJlNTWSAkKi4pIyCNqa1F7OhuqK8gYqGioqVra9XsYG1AbaRipeisZqBooGagFBGNi4BCQUVNQxcQlJKaLoUBmEhSVM5VW1jc2tSCDtqV0-HoqDbUDTyLSKLw+EZuGaIbQrbTULZrZYqJR6dbGfYgYJHcKnKIXWLxe7UCBgADGdASAHkAK7CSmkZDMCDiMC0dBFUgAa05eNCxwiZ2iJOuFOpEDpjOZrIQGB5lPInXQAG0vABdNqCf4SQF2Qag+ROSEabSTXaWGzwxTaYyqNZaPrbSFeeQ4wVhE6Rc6XUlQJhpGocADinxaOo6Yn1oCBRkcFq2UI0ijUXj08mmNoQ9kczg2bg83l8nsOQoJvrFV3uTAAqgA5YNhiPffi61XdRD6B2Kc0ZtwaZbm7Rw3NqBxOFxFzw+fw49CkCnwH5e4WE850RhRvVdhCyUzUe2pnZbPSaFSmMfyPQO5yDfQTBbqPaBXHl70ion+67JVL3R5slyApijAHdOwNfdvA0JZUyHUZtEzQYETHbxwSWFZllcZZj20MsQk-DdqwDG5-weTJnjAn4-gguM5DUFRkSmCd9ExPQNHdUccwREFVgzIcNHY8wPTfNdK1FYka0SSUaXuBkmRZKj22jAE6IQdwkXGFZfHmVN5C8DRUIfZFMKmE02LtfD8R9CSf3ucCYz3WRdE0uDtnkRD9OcMc1GMLwTNWdQoS8AwPKsisbKJLBVN+DtHMgvyHC8bQxg0TZxjWDNULRUE1j0SELR2Aw9HCwiq2oehBGEByYp6RKBhSgw0pRTLDO4xQ7UTdx3RMPspgMUr1yrGrY2kOR7QdJq+3czzkOvbRGPvYFb0KhjXwCIA */
  createMachine(
    {
      context: { board: null },
      // eslint-disable-next-line @typescript-eslint/consistent-type-imports
      tsTypes: {} as import("./minesweeperBoardMachine.typegen").Typegen0,
      schema: {
        context: {} as Context,
        events: {} as BoardMachineEvent,
        services: {} as {
          decideOutcome: { data: "won" | "lost" | "stillPlaying" };
        },
      },
      initial: "idle",
      states: {
        idle: {
          on: {
            START: {
              actions: "createBoard",
              target: "playing",
            },
          },
        },
        playing: {
          initial: "waitingForFirstMove",
          states: {
            waitingForFirstMove: {
              on: {
                REVEAL_CELL: {
                  actions: "ensureFirstMoveSucceeds",
                  target: "decidingOutcome",
                },
              },
            },
            waitingForMove: {
              on: {
                REVEAL_CELL: {
                  target: "decidingOutcome",
                },
              },
            },
            decidingOutcome: {
              entry: "revealCell",
              invoke: {
                src: "decideOutcome",
                onDone: [
                  {
                    cond: "didLose",
                    target: "#minesweeperBoard.lost",
                  },
                  {
                    cond: "didWin",
                    target: "#minesweeperBoard.won",
                  },
                  {
                    target: "waitingForMove",
                  },
                ],
              },
            },
          },
          on: {
            FLAG_CELL: {
              actions: "flagCell",
            },
            UNFLAG_CELL: {
              actions: "unflagCell",
            },
          },
        },
        won: {
          type: "final",
        },
        lost: {
          type: "final",
        },
      },
      id: "minesweeperBoard",
    },
    {
      actions: {
        createBoard: assign({
          board: (_, { width, height, mines }) =>
            getMinePlacements({ width, height, mines }).map((row) =>
              row.map((isMine) => ({
                type: isMine ? ("mine" as const) : ("safe" as const),
                ref: spawn(cellMachine, { sync: true }),
              }))
            ),
        }),
        flagCell: send((_, { position }) => ({ type: "FLAG", position }), {
          to: (context, { position }) =>
            getCellFromContextOrThrow(context, position).ref,
        }),
        unflagCell: send((_, { position }) => ({ type: "UNFLAG", position }), {
          to: (context, { position }) =>
            getCellFromContextOrThrow(context, position).ref,
        }),
        ensureFirstMoveSucceeds: pure((context, event) => {
          const { position } = event;
          const cell = getCellFromContextOrThrow(context, position);
          const neighbouringMineCount = getNeighbouringMineCount(
            context,
            position
          );
          if (cell.type === "safe") {
            return send(
              { type: "REVEAL", neighbouringMineCount },
              {
                to: () => cell.ref,
              }
            );
          }

          const newCell: Cell = {
            type: "safe",
            ref: spawn(cellMachine, { sync: true }),
          };

          return [
            stop(() => cell.ref),
            assign({
              // FIXME: This just replaces the bomb. We should move it to a non-bomb top left position instead.
              // We should also move neighboring bombs too.
              board: (context, { position }) =>
                context.board!.map((row, y) =>
                  row.map((cell, x) =>
                    x === position.x && y === position.y ? newCell : cell
                  )
                ),
            }),
            send(
              { type: "REVEAL", neighbouringMineCount },
              {
                to: () => newCell.ref,
              }
            ),
          ] as ActionObject<Context, typeof event>[];
        }),
        revealCell: pure((context, { position }) => {
          const cell = getCellFromContextOrThrow(context, position);
          if (cell.type === "mine") {
            return send(
              { type: "REVEAL", position, neighbouringMineCount: -1 },
              {
                to: () => cell.ref,
              }
            );
          }

          return getCellsToFloodFill(context.board!, position).map(
            ({ cell, position }) =>
              send(
                {
                  type: "REVEAL",
                  neighbouringMineCount: getNeighbouringMineCount(
                    context,
                    position
                  ),
                },
                {
                  to: () => cell.ref,
                }
              )
          );
        }),
      },
      services: {
        decideOutcome: async (context, { position }) => {
          const cell = getCellFromContextOrThrow(context, position);

          if (cell.type === "mine") {
            return "lost";
          }

          const isEveryCellRevealed = context.board!.every((row) =>
            row.every(
              (cell) =>
                cell.type === "mine" ||
                cell.ref.getSnapshot()?.value === "revealed"
            )
          );

          if (isEveryCellRevealed) {
            return "won";
          }

          return "stillPlaying";
        },
      },
      guards: {
        didLose: (_, { data }) => data === "lost",
        didWin: (_, { data }) => data === "won",
      },
    }
  );

const getCellFromContextOrThrow = (
  context: Context,
  position: CellPosition
) => {
  if (context.board === null) {
    throw new Error('Expected "board" to be defined');
  }

  return getCellOrThrow(context.board, position);
};

const getCellOrThrow = (board: Cell[][], position: CellPosition) => {
  const cell = board[position.y]?.[position.x];

  if (!cell) {
    throw new Error("Cell does not exist");
  }

  return cell;
};

const getMinePlacements = ({
  width,
  height,
  mines,
}: {
  width: number;
  height: number;
  mines: number;
}) => {
  const minePlacements = Array.from({ length: height }, () =>
    Array.from<boolean>({ length: width }).fill(false)
  );

  let i = 0;
  while (i < mines) {
    const x = Math.floor(Math.random() * width);
    const y = Math.floor(Math.random() * height);
    if (minePlacements[x]![y] === true) {
      continue;
    }
    minePlacements[x]![y] = true;
    i++;
  }
  return minePlacements;
};

const getNeighbouringMineCount = (context: Context, position: CellPosition) =>
  getNeighbours(context.board!, position).reduce(
    (sum, { cell: { type } }) => (type === "mine" ? sum + 1 : sum),
    0
  );

const getNeighbours = (board: Cell[][], position: CellPosition) => {
  const { x, y } = position;
  const neighbours = [
    { x: x - 1, y: y - 1 },
    { x: x - 1, y: y },
    { x: x - 1, y: y + 1 },
    { x: x, y: y - 1 },
    { x: x, y: y + 1 },
    { x: x + 1, y: y - 1 },
    { x: x + 1, y: y },
    { x: x + 1, y: y + 1 },
  ];

  return neighbours
    .filter((neighbour) => {
      const { x, y } = neighbour;
      return x >= 0 && y >= 0 && y < board.length && x < board[y]!.length;
    })
    .map((neighbour) => ({
      cell: getCellOrThrow(board, neighbour),
      position: neighbour,
    }));
};

const getOrthogonalNeighbours = (board: Cell[][], position: CellPosition) => {
  const { x, y } = position;
  const neighbours = [
    { x: x - 1, y: y },
    { x: x + 1, y: y },
    { x: x, y: y - 1 },
    { x: x, y: y + 1 },
  ];

  return neighbours
    .filter(
      ({ x, y }) => x >= 0 && y >= 0 && y < board.length && x < board[y]!.length
    )
    .map((position) => ({
      cell: getCellOrThrow(board, position),
      position,
    }));
};

const getCellsToFloodFill = (board: Cell[][], position: CellPosition) => {
  const firstCell = getCellOrThrow(board, position);
  const cells: Set<Cell> = new Set([firstCell]);
  const output: { cell: Cell; position: CellPosition }[] = [
    { cell: firstCell, position },
  ];
  const rec = (board: Cell[][], position: CellPosition) => {
    const cell = getCellOrThrow(board, position);
    if (cell.type === "mine" || cells.has(cell)) return;

    cells.add(cell);
    output.push({ cell, position });

    if (
      getNeighbours(board, position).every(({ cell }) => cell.type === "safe")
    ) {
      getOrthogonalNeighbours(board, position).forEach((neighbour) =>
        rec(board, neighbour.position)
      );
    }
  };

  if (
    getNeighbours(board, position).every(({ cell }) => cell.type === "safe")
  ) {
    getOrthogonalNeighbours(board, position).forEach((neighbour) =>
      rec(board, neighbour.position)
    );
  }
  return output;
};
