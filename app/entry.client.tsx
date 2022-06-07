import { inspect } from "@xstate/inspect";
inspect({
  iframe: false,
});

import { RemixBrowser } from "@remix-run/react";
import { hydrate } from "react-dom";

hydrate(<RemixBrowser />, document);
