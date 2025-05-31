import { useState, useEffect } from "react";
import { getRandomSuggestions, fetchPopularQueries } from "@/lib/utils";
import SearchBar from "@/components/SearchBar";
import { Link, useLocation } from "wouter";

/**
 * Landing page with search bar and example suggestions.
 */
export default function Home() {
  const [, navigate] = useLocation();
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isTrending, setIsTrending] = useState(false);

  useEffect(() => {
    fetchPopularQueries(5).then((qs) => {
      if (qs.length > 0) {
        setIsTrending(true);
        setSuggestions(qs);
      } else {
        getRandomSuggestions(3).then(setSuggestions);
      }
    });
  }, []);

  const handleSearch = (query: string) => {
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };
  
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center">
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold mb-2">
          <span className="text-primary">Vist</span><span className="text-foreground">AI</span>
        </h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Compare results from leading AI models in one search
        </p>
      </div>

      <div className="w-full max-w-2xl mx-auto">
        <SearchBar onSearch={handleSearch} />

        {isTrending ? (
          <div className="mt-5 text-center">
            <h2 className="text-sm font-medium mb-2">Trending searches</h2>
            <div className="flex flex-wrap justify-center gap-2">
              {suggestions.map((suggestion) => (
                <Link
                  key={suggestion}
                  href={`/search?q=${encodeURIComponent(suggestion)}`}
                  className="text-xs bg-card px-3 py-1.5 rounded-full text-muted-foreground hover:bg-card/80 transition-colors"
                >
                  {suggestion}
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-2 mt-5">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                className="text-xs bg-card px-3 py-1.5 rounded-full text-muted-foreground cursor-pointer hover:bg-card/80 transition-colors"
                onClick={() => handleSearch(suggestion)}
              >
                {`Try: "${suggestion}"`}
              </button>
            ))}
          </div>
        )}

        <div className="mt-16 text-center">
          <p className="text-muted-foreground text-sm">
            Powered by <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">OpenRouter</a> •
            <Link href="/dashboard" className="text-muted-foreground hover:text-foreground ml-1">Dashboard</Link> •
            <Link href="/settings" className="text-muted-foreground hover:text-foreground ml-1">Settings</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
