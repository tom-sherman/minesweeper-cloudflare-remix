import type { LinksFunction } from "@remix-run/cloudflare";
import { useSearchParams } from "@remix-run/react";
import { useActor, useMachine } from "@xstate/react";
import { createContext, memo } from "react";
import { useContext } from "react";
import { useEffect, useReducer } from "react";
import type { EventFrom } from "xstate";
import type { Cell } from "~/game/minesweeperBoardMachine";
import { boardMachine } from "~/game/minesweeperBoardMachine";
import { PRESETS } from "~/game/presets";
import gameStyles from "~/styles/game.css";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: gameStyles },
];

const SendContext = createContext<
  (event: EventFrom<typeof boardMachine>) => void
>(() => {});

export default function LocalGame() {
  const params = useGameParams();
  const [state, send] = useMachine(boardMachine, {
    // devTools: true,
  });
  const [debug, toggleDebug] = useReducer((d) => !d, false);

  useEffect(() => {
    send({ type: "START", ...params });
  }, [send, params]);

  const board = state.context.board;

  if (!board) {
    return null;
  }

  return (
    <SendContext.Provider value={send}>
      <button onClick={toggleDebug}>Toggle debug</button>
      <GameBoard board={board} debug={debug} />
    </SendContext.Provider>
  );
}

interface GameBoardProps {
  board: Cell[][];
  debug?: boolean;
}

const GameBoard = ({ board, debug = false }: GameBoardProps) => {
  return (
    <table className="board">
      <tbody>
        {board.map((row, y) => (
          <tr key={y}>
            {row.map((cell, x) => (
              <td key={x} className="cell">
                <GameCell cell={cell} debug={debug} x={x} y={y} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

interface GameCellProps {
  cell: Cell;
  x: number;
  y: number;
  debug: boolean;
}

const GameCell = memo(function GameCell({ cell, debug, x, y }: GameCellProps) {
  const [state] = useActor(cell.ref);
  const send = useContext(SendContext);

  if (state.matches("revealed") || debug) {
    if (state.context.neighbouringMineCount == null && !debug) {
      throw new Error("neighbouringMineCount is null");
    }

    return (
      <>{cell.type === "safe" ? state.context.neighbouringMineCount : "💣"}</>
    );
  }

  if (state.matches("flagged")) {
    return (
      <button
        onContextMenu={(e) => {
          e.preventDefault();
          send({ type: "UNFLAG_CELL", position: { x, y } });
        }}
        className="cell cell-button"
      >
        🚩
      </button>
    );
  }

  return (
    <button
      onClick={() => send({ type: "REVEAL_CELL", position: { x, y } })}
      onContextMenu={(e) => {
        e.preventDefault();
        send({ type: "FLAG_CELL", position: { x, y } });
      }}
      className="cell cell-button"
    />
  );
});

interface GameParams {
  width: number;
  height: number;
  mines: number;
}

const useGameParams = (): GameParams => {
  const [searchParams] = useSearchParams();
  const preset = getSearchParamOrThrow(searchParams, "preset");

  if (preset === "custom") {
    return {
      width: parseIntOrThrow(
        getSearchParamOrThrow(searchParams, "customWidth")
      ),
      height: parseIntOrThrow(
        getSearchParamOrThrow(searchParams, "customHeight")
      ),
      mines: parseIntOrThrow(
        getSearchParamOrThrow(searchParams, "customMines")
      ),
    };
  }

  if (preset !== "Hard" && preset !== "Medium" && preset !== "Easy") {
    throw new Error(`Invalid preset: ${preset}`);
  }

  return PRESETS[preset];
};

const parseIntOrThrow = (value: string): number => {
  const parsed = parseInt(value);
  if (isNaN(parsed)) {
    throw new Error(`Invalid number: ${value}`);
  }
  return parsed;
};

const getSearchParamOrThrow = (
  searchParams: URLSearchParams,
  paramName: string
): string => {
  const value = searchParams.get(paramName);
  if (!value) {
    throw new Error(`Missing search param: ${paramName}`);
  }
  return value;
};
