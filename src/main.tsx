import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-600.css";
import "@fontsource/inter/latin-700.css";
import "@fontsource/space-grotesk/latin-600.css";
import "@fontsource/space-grotesk/latin-700.css";
import "../node_modules/@react95/core/dist/esm/GlobalStyle/GlobalStyle.css.ts.vanilla.css";
import "../node_modules/@react95/core/dist/esm/themes/win95.css.ts.vanilla.css";
import "./styles.css";
import "./bauhaus-theme.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
