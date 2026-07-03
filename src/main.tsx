import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "../node_modules/@react95/core/dist/esm/GlobalStyle/GlobalStyle.css.ts.vanilla.css";
import "../node_modules/@react95/core/dist/esm/themes/win95.css.ts.vanilla.css";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
