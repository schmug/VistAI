import { createRoot } from "react-dom/client";
import { Router } from "wouter";
import { useLocationSearch } from "./hooks/use-full-location";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Router searchHook={useLocationSearch}>
          <App />
        </Router>
      </AuthProvider>
      <Toaster />
    </TooltipProvider>
  </QueryClientProvider>
);
