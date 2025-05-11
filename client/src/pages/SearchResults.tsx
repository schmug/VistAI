import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { searchAI, ModelResponse } from "@/lib/openrouter";
import { formatSearchTime } from "@/lib/utils";
import ResultCard from "@/components/ResultCard";
import ModelFilterPills from "@/components/ModelFilterPills";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import SearchBar from "@/components/SearchBar";

interface SearchResultsProps {
  query: string;
  onSearch: (query: string) => void;
}

export default function SearchResults({ query, onSearch }: SearchResultsProps) {
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  
  // Search query
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/search', query],
    queryFn: async () => {
      if (!query) return null;
      return await searchAI(query);
    },
    enabled: Boolean(query),
  });
  
  // Filter results by selected model
  const filteredResults = selectedModel && data?.results
    ? data.results.filter(result => result.modelId.includes(selectedModel))
    : data?.results;
  
  // Get unique model IDs for filter pills
  const modelIds = data?.results 
    ? [...new Set(data.results.map(result => result.modelId))]
    : [];
  
  return (
    <div className="search-results-appear mt-4 md:mt-6">
      {/* Mobile search bar (only visible on small screens) */}
      <div className="md:hidden mb-6">
        <SearchBar initialQuery={query} compact onSearch={onSearch} />
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
  );
}
