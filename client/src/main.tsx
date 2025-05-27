import { createRoot } from "react-dom/client";
import { Router } from "wouter";
import { useLocationSearch } from "./hooks/use-full-location";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Router searchHook={useLocationSearch}>
        <App />
      </Router>
      <Toaster />
    </TooltipProvider>
  </QueryClientProvider>
);
