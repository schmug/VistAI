import { createRoot } from "react-dom/client";
import { Router } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import App from "./App";
import "./index.css";
import { styles as typescaleStyles } from "@material/web/typography/md-typescale-styles.js";

// Adopt Material Web's typographic scale so components use the
// CSS variables defined in index.css for fonts and sizes.
if (typescaleStyles.styleSheet) {
  document.adoptedStyleSheets.push(typescaleStyles.styleSheet);
}

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Router>
        <App />
      </Router>
      <Toaster />
    </TooltipProvider>
  </QueryClientProvider>
);
