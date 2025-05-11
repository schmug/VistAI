import { useState } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/Home";
import SearchResults from "@/pages/SearchResults";
import Dashboard from "@/pages/Dashboard";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

function App() {
  const [currentPage, setCurrentPage] = useState("home");
  const [searchQuery, setSearchQuery] = useState("");

  // Simple page navigation without router
  const navigateTo = (page: string, query?: string) => {
    setCurrentPage(page);
    if (query) setSearchQuery(query);
  };

  const renderPage = () => {
    switch (currentPage) {
      case "home":
        return <Home onSearch={(q) => navigateTo("search", q)} />;
      case "search":
        return <SearchResults query={searchQuery} onSearch={(q) => navigateTo("search", q)} />;
      case "dashboard":
        return <Dashboard />;
      default:
        return <Home onSearch={(q) => navigateTo("search", q)} />;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen flex flex-col">
          <Header 
            currentPage={currentPage} 
            onNavigate={navigateTo} 
          />
          <main className="flex-1 container mx-auto px-4 py-6 md:py-12">
            {renderPage()}
          </main>
          <Footer onNavigate={navigateTo} />
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
