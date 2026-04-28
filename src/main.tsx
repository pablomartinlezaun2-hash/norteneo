import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n";

// Recover from stale chunk errors after a redeploy: the browser holds an old
// index-*.js URL that no longer exists, so dynamic imports throw
// "Importing a module script failed." Reload once to fetch the new bundle.
const RELOAD_KEY = "__neo_chunk_reload__";
const isChunkError = (msg: unknown) =>
  typeof msg === "string" &&
  (msg.includes("Importing a module script failed") ||
    msg.includes("Failed to fetch dynamically imported module") ||
    msg.includes("error loading dynamically imported module"));

const tryReload = () => {
  if (sessionStorage.getItem(RELOAD_KEY)) return;
  sessionStorage.setItem(RELOAD_KEY, "1");
  window.location.reload();
};

window.addEventListener("error", (e) => {
  if (isChunkError(e.message)) tryReload();
});
window.addEventListener("unhandledrejection", (e) => {
  const reason = e.reason;
  const msg = reason instanceof Error ? reason.message : String(reason);
  if (isChunkError(msg)) tryReload();
});

// Clear the guard once the app successfully boots.
queueMicrotask(() => sessionStorage.removeItem(RELOAD_KEY));

createRoot(document.getElementById("root")!).render(<App />);
