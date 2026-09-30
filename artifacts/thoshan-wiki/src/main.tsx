import { createRoot } from "react-dom/client";
import App from "./App";
import "@fontsource-variable/geist";
import "@fontsource-variable/jetbrains-mono";
import "./index.css";
import { initPostHog } from "./lib/posthog";
import { initClarity } from "./lib/clarity";

// Initialize analytics
initPostHog();
initClarity();

createRoot(document.getElementById("root")!).render(<App />);
