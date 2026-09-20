import { createRoot } from "react-dom/client";
import App from "./App";
import "@fontsource-variable/geist";
import "@fontsource-variable/jetbrains-mono";
import "./index.css";
import { initPostHog } from "./lib/posthog";

initPostHog();

createRoot(document.getElementById("root")!).render(<App />);
