import { useState, useEffect } from "react";
import { searchAIStream, ModelResponse, SearchStreamEvent } from "@/lib/openrouter";
import { formatSearchTime, addToSearchHistory } from "@/lib/utils";
import { parseError, AppError } from "@/lib/errorHandling";
import ResultCard from "@/components/ResultCard";
import ModelFilterPills from "@/components/ModelFilterPills";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import SearchBar from "@/components/SearchBar";
import { ErrorNotification } from "@/components/ErrorNotification";
import { useLocation } from "wouter";
import { useLocationSearch } from "@/hooks/use-full-location";

/**
 * Page displaying streaming search results from multiple models.
 */
export default function SearchResults() {
  const [, navigate] = useLocation();
  const searchString = useLocationSearch();
  const params = new URLSearchParams(searchString);
  const query = params.get("q") || "";
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [results, setResults] = useState<ModelResponse[]>([]);
  const [search, setSearch] = useState<{ id: number; query: string; createdAt: Date } | null>(null);
  const [totalTime, setTotalTime] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  const performSearch = async () => {
    if (!query) return;

    setSelectedModel(null);
    setResults([]);
    setSearch(null);
    setTotalTime(0);
    setError(null);
    setIsLoading(true);

    try {
      await searchAIStream(query, (evt: SearchStreamEvent) => {
        if (evt.type === "search") {
          setSearch(evt.data);
        } else if (evt.type === "result") {
          setResults((prev) => [...prev, evt.data]);
        } else if (evt.type === "done") {
          setTotalTime(evt.data.totalTime);
          setIsLoading(false);
          addToSearchHistory(query);
        } else if (evt.type === "error") {
          const appError = parseError(new Error(evt.data?.message || "Stream error"));
          setError(appError);
          setIsLoading(false);
        }
      });
    } catch (err) {
      const appError = parseError(err);
      setError(appError);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (query) {
      addToSearchHistory(query);
      performSearch();
    }
  }, [query]);
  
  // Filter results by selected model
  const filteredResults = selectedModel
    ? results.filter((result) => result.modelId.includes(selectedModel))
    : results;

  // Get unique model IDs for filter pills
  const modelIds = [...new Set(results.map((result) => result.modelId))];
  
  const handleSearch = (q: string) => {
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <div className="search-results-appear mt-4 md:mt-6">
      {/* Mobile search bar (only visible on small screens) */}
      <div className="md:hidden mb-6">
        <SearchBar initialQuery={query} compact onSearch={handleSearch} />
      </div>
      
      {/* Model Filter Pills */}
      {results.length > 0 && (
        <ModelFilterPills
          selectedModel={selectedModel}
          onSelectModel={setSelectedModel}
          models={modelIds}
        />
      )}
      
      {/* Result Stats */}
      {!isLoading && results.length > 0 && (
        <div className="text-muted-foreground text-sm mb-4">
          About <span className="font-medium">{results.length} results</span> from {results.length} AI models
          ({formatSearchTime(totalTime)} seconds)
        </div>
      )}
      
      {/* Results */}
      <div className="grid grid-cols-1 gap-6">
        {filteredResults.map((result: ModelResponse) => (
          <ResultCard key={result.id} result={result} />
        ))}
        {isLoading && (
          <LoadingSkeleton
            count={Math.max(4 - filteredResults.length, 1)}
            blink={results.length > 0}
          />
        )}
        {!isLoading && !error && filteredResults.length === 0 && results.length === 0 && (
          <div className="p-6 text-center">
            <h3 className="text-lg font-medium text-foreground mb-2">No Results Found</h3>
            <p className="text-muted-foreground">
              We couldn't find any results for your query. Try a different search term.
            </p>
          </div>
        )}
        {!isLoading && !error && filteredResults.length === 0 && results.length > 0 && (
          <div className="p-6 text-center">
            <h3 className="text-lg font-medium text-foreground mb-2">No Results for Selected Model</h3>
            <p className="text-muted-foreground">
              No results from the selected model. Try another model or remove the filter.
            </p>
          </div>
        )}
      </div>

      {/* Error Notification */}
      <ErrorNotification
        error={error}
        onDismiss={() => setError(null)}
        onRetry={performSearch}
      />
    </div>
  );
}
