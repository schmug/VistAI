import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { searchAI, ModelResponse } from "@/lib/openrouter";
import { formatSearchTime, getRandomSuggestions } from "@/lib/utils";
import ResultCard from "@/components/ResultCard";
import ModelFilterPills from "@/components/ModelFilterPills";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SimplePage() {
  // Search state
  const [query, setQuery] = useState("");
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [suggestions] = useState(() => getRandomSuggestions(3));

  // Search query
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/search', query],
    queryFn: async () => {
      if (!query) return null;
      return await searchAI(query);
    },
    enabled: searchPerformed && Boolean(query),
  });

  // Handle search submission
  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    setSearchPerformed(true);
  };

  // Filter results by selected model
  const filteredResults = selectedModel && data?.results
    ? data.results.filter(result => result.modelId.includes(selectedModel))
    : data?.results;
  
  // Get unique model IDs for filter pills
  const modelIds = data?.results 
    ? Array.from(new Set(data.results.map(result => result.modelId)))
    : [];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="sticky top-0 z-10 backdrop-blur-sm border-b border-border bg-background">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setSearchPerformed(false)}
              className="flex items-center gap-2"
            >
              <h1 className="text-xl font-bold text-primary">VistAI</h1>
              <span className="text-xs bg-card px-2 py-0.5 rounded-full text-muted-foreground">Beta</span>
            </button>
          </div>
          
          {searchPerformed && (
            <div className="flex items-center gap-4">
              <div className="hidden md:block w-[400px]">
                {/* Search Bar */}
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSearch(query);
                  }} 
                  className="w-full"
                >
                  <div className="relative flex items-center bg-card border border-border hover:border-primary/50 focus-within:border-primary rounded-full transition-all shadow-lg px-4 py-2">
                    <i className="ri-search-line text-muted-foreground mr-3 text-base"></i>
                    
                    <Input
                      type="text"
                      placeholder="Ask AI anything..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="flex-1 border-none shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
                    />
                    
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        type="button"
                        className="text-muted-foreground hover:text-primary"
                      >
                        <i className="ri-mic-line text-base"></i>
                        <span className="sr-only">Use voice input</span>
                      </Button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-6 md:py-12">
        {!searchPerformed ? (
          // Home Page Content
          <div className="min-h-[70vh] flex flex-col items-center justify-center">
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-bold mb-2">
                <span className="text-primary">AI</span><span className="text-foreground">Search</span>
              </h1>
              <p className="text-muted-foreground max-w-md mx-auto">
                Compare results from leading AI models in one search
              </p>
            </div>

            <div className="w-full max-w-2xl mx-auto">
              {/* Main Search Bar */}
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSearch(query);
                }} 
                className="w-full"
              >
                <div className="relative flex items-center bg-card border border-border hover:border-primary/50 focus-within:border-primary rounded-full transition-all shadow-lg px-5 py-3">
                  <i className="ri-search-line text-muted-foreground mr-3 text-xl"></i>
                  
                  <Input
                    type="text"
                    placeholder="Ask AI anything..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="flex-1 border-none shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-lg"
                  />
                  
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      type="button"
                      className="text-muted-foreground hover:text-primary"
                    >
                      <i className="ri-mic-line text-xl"></i>
                      <span className="sr-only">Use voice input</span>
                    </Button>
                    
                    <Button 
                      type="submit" 
                      size="icon" 
                      className="bg-primary hover:bg-primary/90 text-white rounded-full"
                    >
                      <i className="ri-search-line text-xl"></i>
                      <span className="sr-only">Search</span>
                    </Button>
                  </div>
                </div>
              </form>

              <div className="flex flex-wrap justify-center gap-2 mt-5">
                {suggestions.map((suggestion, index) => (
                  <button 
                    key={index} 
                    className="text-xs bg-card px-3 py-1.5 rounded-full text-muted-foreground cursor-pointer hover:bg-card/80 transition-colors"
                    onClick={() => {
                      setQuery(suggestion);
                      handleSearch(suggestion);
                    }}
                  >
                    Try: "{suggestion}"
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          // Search Results Content
          <div className="search-results-appear mt-4 md:mt-6">
            {/* Mobile search bar (only visible on small screens) */}
            <div className="md:hidden mb-6">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSearch(query);
                }} 
                className="w-full"
              >
                <div className="relative flex items-center bg-card border border-border hover:border-primary/50 focus-within:border-primary rounded-full transition-all shadow-lg px-4 py-2">
                  <i className="ri-search-line text-muted-foreground mr-3 text-base"></i>
                  
                  <Input
                    type="text"
                    placeholder="Ask AI anything..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="flex-1 border-none shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
                  />
                </div>
              </form>
            </div>
            
            {/* Model Filter Pills */}
            {!isLoading && data && (
              <ModelFilterPills
                selectedModel={selectedModel}
                onSelectModel={setSelectedModel}
                models={modelIds}
              />
            )}
            
            {/* Result Stats */}
            {!isLoading && data && (
              <div className="text-muted-foreground text-sm mb-4">
                About <span className="font-medium">{data.results.length} results</span> from {data.results.length} AI models 
                ({formatSearchTime(data.totalTime)} seconds)
              </div>
            )}
            
            {/* Results or Loading State */}
            <div className="grid grid-cols-1 gap-6">
              {isLoading ? (
                <LoadingSkeleton />
              ) : error ? (
                <div className="p-6 text-center">
                  <h3 className="text-lg font-medium text-secondary mb-2">Error Fetching Results</h3>
                  <p className="text-muted-foreground">
                    {error instanceof Error ? error.message : "An unknown error occurred"}
                  </p>
                  <button 
                    className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
                    onClick={() => refetch()}
                  >
                    Try Again
                  </button>
                </div>
              ) : filteredResults && filteredResults.length > 0 ? (
                filteredResults.map((result: ModelResponse) => (
                  <ResultCard key={result.id} result={result} />
                ))
              ) : (
                <div className="p-6 text-center">
                  <h3 className="text-lg font-medium text-foreground mb-2">No Results Found</h3>
                  <p className="text-muted-foreground">
                    {selectedModel 
                      ? `No results from the selected model. Try another model or remove the filter.`
                      : `We couldn't find any results for your query. Try a different search term.`}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-border py-6 mt-auto">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-muted-foreground text-sm">
              <p>
                © {new Date().getFullYear()} VistAI • 
                <button className="hover:text-primary ml-1">Terms</button> • 
                <button className="hover:text-primary ml-1">Privacy</button>
              </p>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <button onClick={() => setSearchPerformed(false)} className="hover:text-primary">Home</button>
              <button className="hover:text-primary">Dashboard</button>
              <button className="hover:text-primary">API</button>
              <button className="hover:text-primary">Pricing</button>
              <button className="hover:text-primary">Contact</button>
            </div>
          </div>
          
          <div className="mt-4 text-center text-xs text-muted-foreground">
            <p>
              Powered by <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">OpenRouter</a>. 
              Each result comes from different AI models. User clicks help determine which models provide the best answers.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}