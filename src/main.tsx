
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Production-ready initialization
console.log('[DukaFiti] Starting application...');

const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error('[DukaFiti] Root element not found');
  throw new Error("Root element not found");
}

const root = createRoot(rootElement);

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);

console.log('[DukaFiti] Application rendered successfully');
