import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import { DEMO_SCENARIOS, type DemoScenario } from "./lib/demo";
import { useSettings } from "./store/settings";
import "./styles/tokens.css";
import "./styles/base.css";
import "./theme/sky.css";
import "./styles/components.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30_000),
      refetchOnWindowFocus: true,
    },
  },
});

// Portfolio demo shortcut: ?demo=storm|rain|clear|snow|night|sunset|fog.
// Applied once at boot; the long-press picker covers demos without URL editing.
const urlDemo = new URLSearchParams(window.location.search).get("demo") as DemoScenario | null;
if (urlDemo && (DEMO_SCENARIOS as readonly string[]).includes(urlDemo)) {
  useSettings.getState().setDemoMode(urlDemo);
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);