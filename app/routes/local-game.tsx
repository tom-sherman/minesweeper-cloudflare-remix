import { LinksFunction } from "@remix-run/cloudflare";
import { useSearchParams } from "@remix-run/react";
import { useActor, useMachine } from "@xstate/react";
import { useEffect, useReducer } from "react";
import type { Cell } from "~/game/minesweeperBoardMachine";
import { boardMachine } from "~/game/minesweeperBoardMachine";
import { PRESETS } from "~/game/presets";
import gameStyles from "~/styles/game.css";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: gameStyles },
];

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
    <>
      <button onClick={toggleDebug}>Toggle debug</button>
      <GameBoard
        board={board}
        onCellClick={(type, x, y) => send({ type, position: { x, y } })}
        debug={debug}
      />
    </>
  );
}

interface GameBoardProps {
  board: Cell[][];
  onCellClick?: (
    type: "FLAG_CELL" | "UNFLAG_CELL" | "REVEAL_CELL",
    x: number,
    y: number
  ) => void;
  debug?: boolean;
}

const GameBoard = ({ board, onCellClick, debug = false }: GameBoardProps) => {
  return (
    <table className="board">
      <tbody>
        {board.map((row, y) => (
          <tr key={y}>
            {row.map((cell, x) => (
              <td key={x} className="cell">
                <GameCell
                  cell={cell}
                  onFlag={() => onCellClick?.("FLAG_CELL", x, y)}
                  onUnflag={() => onCellClick?.("UNFLAG_CELL", x, y)}
                  onReveal={() => onCellClick?.("REVEAL_CELL", x, y)}
                  debug={debug}
                />
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
  onReveal: () => void;
  onFlag: () => void;
  onUnflag: () => void;
  debug: boolean;
}

const GameCell = ({
  cell,
  onReveal,
  onFlag,
  onUnflag,
  debug,
}: GameCellProps) => {
  const [state] = useActor(cell.ref);

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
          onUnflag();
        }}
        className="cell-button"
      >
        🚩
      </button>
    );
  }

  return (
    <button
      onClick={onReveal}
      onContextMenu={(e) => {
        e.preventDefault();
        onFlag();
      }}
      className="cell cell-button"
    />
  );
};

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
