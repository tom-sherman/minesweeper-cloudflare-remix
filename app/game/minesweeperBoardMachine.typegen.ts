// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  eventsCausingActions: {
    createBoard: "START";
    flagCell: "FLAG_CELL";
    unflagCell: "UNFLAG_CELL";
    ensureFirstMoveSucceeds: "REVEAL_CELL";
    revealCell: "REVEAL_CELL";
  };
  internalEvents: {
    "done.invoke.minesweeperBoard.playing.decidingOutcome:invocation[0]": {
      type: "done.invoke.minesweeperBoard.playing.decidingOutcome:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {
    decideOutcome: "done.invoke.minesweeperBoard.playing.decidingOutcome:invocation[0]";
  };
  missingImplementations: {
    actions: never;
    services: never;
    guards: never;
    delays: never;
  };
  eventsCausingServices: {
    decideOutcome: "REVEAL_CELL";
  };
  eventsCausingGuards: {
    didLose: "done.invoke.minesweeperBoard.playing.decidingOutcome:invocation[0]";
    didWin: "done.invoke.minesweeperBoard.playing.decidingOutcome:invocation[0]";
  };
  eventsCausingDelays: {};
  matchesStates:
    | "idle"
    | "playing"
    | "playing.waitingForFirstMove"
    | "playing.waitingForMove"
    | "playing.decidingOutcome"
    | "won"
    | "lost"
    | {
        playing?: "waitingForFirstMove" | "waitingForMove" | "decidingOutcome";
      };
  tags: never;
}
