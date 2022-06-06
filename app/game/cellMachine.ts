import { assign, createMachine } from "xstate";

export const cellMachine =
  /** @xstate-layout N4IgpgJg5mDOIC5QGMwBs0DoAWBLCEYAdgMQBiAMgIIDiioADgPay4AuuTR9IAHogEYAnAHZMAFiEAGAEwA2ABwipImSICs4gDQgAnohmYNAZnEyBIhafGq56uQF8HO1Bhz5CpAEoBRAGo+VBQ8zKwcXDz8CMZCEkJCxiLixgpCcuIK4tp6gppGqYpmQvaaxk4u6FgAZmgAhlAwECQAqgBylLQhLOyc3Eh8gkICmGqa4rICclLp4uo6+giWmKIKUpn2ZmtCCk7OIERMhPD9rlh4BMRdYb2RBsaYxjLGU1bbyRrziONGU5JS4hYMv8ROUQKdMDV6o0rj0Iv0oo8xAIBBlZqMlKlPghviJftIAUlVjZQeCAE5gABuYFqaEgMPCfVAUQAtOpMOo1KI5NtROIpkJsgsZOpYpoBMZ1KkbCYhCTKvSbvDEMyZKLObieUl+YLlcoRnyRaYTACdrsgA */
  createMachine(
    {
      context: { neighbouringMineCount: null },
      // eslint-disable-next-line @typescript-eslint/consistent-type-imports
      tsTypes: {} as import("./cellMachine.typegen").Typegen0,
      schema: {
        context: {} as {
          neighbouringMineCount: number | null;
        },
        events: {} as
          | {
              type: "REVEAL";
              neighbouringMineCount: number;
            }
          | {
              type: "FLAG";
            }
          | {
              type: "UNFLAG";
            },
      },
      initial: "hidden",
      states: {
        hidden: {
          on: {
            FLAG: {
              target: "flagged",
            },
            REVEAL: {
              target: "revealed",
            },
          },
        },
        flagged: {
          on: {
            UNFLAG: {
              target: "hidden",
            },
          },
        },
        revealed: {
          entry: "setCount",
          type: "final",
        },
      },
      id: "cell",
    },
    {
      actions: {
        setCount: assign({
          neighbouringMineCount: (_, event) => event.neighbouringMineCount,
        }),
      },
    }
  );
