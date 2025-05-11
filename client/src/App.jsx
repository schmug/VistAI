import React, { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import "./index.css";

// Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { searchAI } from "@/lib/openrouter";
import ResultCard from "@/components/ResultCard";
import LoadingSkeleton from "@/components/LoadingSkeleton";

// Utils
import { getRandomSuggestions, formatSearchTime } from "@/lib/utils";

function MainApp() {
  // State
  const [query, setQuery] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [suggestions] = useState(() => getRandomSuggestions(3));
  const [selectedModel, setSelectedModel] = useState(null);

  // Search query
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/search', query],
    queryFn: async () => {
      if (!query) return null;
      return await searchAI(query);
    },
    enabled: Boolean(query) && hasSearched,
  });

  // Filter results by selected model
  const filteredResults = selectedModel && data?.results
    ? data.results.filter(result => result.modelId.includes(selectedModel))
    : data?.results;

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setHasSearched(true);
    refetch();
  };

  // Filter models
  const handleModelFilter = (modelId) => {
    setSelectedModel(modelId === selectedModel ? null : modelId);
  };

  // Get unique models from results
  const uniqueModels = data?.results 
    ? Array.from(new Set(data.results.map(result => result.modelId)))
    : [];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-background">
        <div className="container mx-auto px-4 py-3 flex items-center">
          <h1 className="text-xl font-bold text-primary mr-4">AISearch</h1>
          
          {hasSearched && (
            <form onSubmit={handleSearch} className="flex-1 max-w-xl">
              <div className="flex items-center border border-border rounded-full px-3 py-1">
                <Input 
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="border-none shadow-none bg-transparent"
                  placeholder="Ask AI anything..."
                />
                <Button type="submit" size="sm" className="ml-2 bg-primary text-white">
                  Search
                </Button>
              </div>
            </form>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 container mx-auto px-4 py-6">
        {!hasSearched ? (
          // Home page content
          <div className="flex flex-col items-center justify-center min-h-[70vh]">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold mb-2">
                <span className="text-primary">AI</span>Search
              </h2>
              <p className="text-muted-foreground">
                Compare results from leading AI models in one search
              </p>
            </div>

            <form onSubmit={handleSearch} className="w-full max-w-xl">
              <div className="flex items-center border border-border rounded-full overflow-hidden p-2">
                <Input 
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="border-none shadow-none bg-transparent"
                  placeholder="Ask AI anything..."
                />
                <Button type="submit" className="ml-2 bg-primary text-white">
                  Search
                </Button>
              </div>
            </form>

            <div className="flex flex-wrap justify-center gap-2 mt-5">
              {suggestions.map((suggestion, i) => (
                <button
                  key={i}
                  className="text-xs bg-card px-3 py-1.5 rounded-full text-muted-foreground"
                  onClick={() => {
                    setQuery(suggestion);
                    setHasSearched(true);
                  }}
                >
                  Try: "{suggestion}"
                </button>
              ))}
            </div>
          </div>
        ) : (
          // Search results content
          <div className="mt-4">
            {/* Model filters */}
            {data && (
              <div className="mb-6 flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className={!selectedModel ? "border-primary" : ""}
                  onClick={() => setSelectedModel(null)}
                >
                  All Models
                </Button>
                
                {uniqueModels.map(modelId => (
                  <Button
                    key={modelId}
                    variant="outline"
                    size="sm" 
                    className={selectedModel === modelId ? "border-primary" : ""}
                    onClick={() => handleModelFilter(modelId)}
                  >
                    {modelId.split('/').pop()}
                  </Button>
                ))}
              </div>
            )}

            {/* Results stats */}
            {data && (
              <div className="text-sm text-muted-foreground mb-4">
                {data.results.length} results from {uniqueModels.length} AI models
                ({formatSearchTime(data.totalTime || 0)} seconds)
              </div>
            )}

            {/* Results */}
            <div className="space-y-6">
              {isLoading ? (
                <LoadingSkeleton />
              ) : error ? (
                <div className="p-6 text-center border border-border rounded-lg">
                  <h3 className="text-lg font-medium mb-2">Error fetching results</h3>
                  <p className="text-muted-foreground mb-4">
                    {error.message || "Unknown error occurred"}
                  </p>
                  <Button onClick={() => refetch()}>Try Again</Button>
                </div>
              ) : filteredResults && filteredResults.length > 0 ? (
                filteredResults.map(result => (
                  <ResultCard key={result.id} result={result} />
                ))
              ) : (
                <div className="p-6 text-center border border-border rounded-lg">
                  <h3 className="text-lg font-medium mb-2">No results found</h3>
                  <p className="text-muted-foreground">
                    Try a different search term or model filter
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-4 mt-auto">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            Powered by <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">OpenRouter</a>. 
            Each result comes from different AI models. User clicks help determine which models provide the best answers.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <MainApp />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}