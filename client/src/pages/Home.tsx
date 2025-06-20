import { useState, useEffect } from "react";
import { getRandomSuggestions, fetchPopularQueries } from "@/lib/utils";
import SearchBar from "@/components/SearchBar";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Landing page with search bar and example suggestions.
 */
export default function Home() {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isTrending, setIsTrending] = useState(false);

  useEffect(() => {
    const loadSuggestions = async () => {
      try {
        const [popularResult, randomResult] = await Promise.allSettled([
          fetchPopularQueries(5),
          getRandomSuggestions(3)
        ]);

        const popular = popularResult.status === 'fulfilled' ? popularResult.value : [];
        const random = randomResult.status === 'fulfilled' ? randomResult.value : [];

        if (popular.length > 0) {
          setIsTrending(true);
          setSuggestions(popular);
        } else {
          setSuggestions(random);
        }
      } catch (error) {
        console.error('Failed to load suggestions:', error);
        // Fallback to empty suggestions
        setSuggestions([]);
      }
    };

    loadSuggestions();
  }, []);

  const handleSearch = (query: string) => {
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };
  
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center animate-fade-in relative">
      {/* Floating particles background */}
      <div className="floating-particles">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="particle" />
        ))}
      </div>
      
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold mb-2">
          <span className="animate-gradient bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">VistAI</span>
        </h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Compare results from leading AI models in one search
        </p>
      </div>

      <div className="w-full max-w-2xl mx-auto px-4">
        <SearchBar onSearch={handleSearch} overlayHistory={false} />

        {isTrending ? (
          <div className="mt-6 text-center">
            <h2 className="text-sm font-medium mb-2">Trending searches</h2>
            <div className="flex flex-wrap justify-center gap-2">
              {suggestions.map((suggestion) => (
                <Link
                  key={suggestion}
                  href={`/search?q=${encodeURIComponent(suggestion)}`}
                  className="text-xs glass-card px-3 py-1.5 rounded-full text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all"
                >
                  {suggestion}
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                className="text-xs glass-card px-3 py-1.5 rounded-full text-muted-foreground cursor-pointer hover:bg-primary/10 hover:text-primary transition-all"
                onClick={() => handleSearch(suggestion)}
              >

                {`Try: ${suggestion}`}
              </button>
            ))}
          </div>
        )}

        <div className="mt-16 text-center">
          <p className="text-muted-foreground text-sm">
            Powered by <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">OpenRouter</a> •{' '}
            <Link
              href={isAuthenticated ? "/dashboard" : "/dashboard-public"}
              className="text-muted-foreground hover:text-foreground ml-1"
            >
              Dashboard
            </Link>{' '}•{' '}
            <Link href="/settings" className="text-muted-foreground hover:text-foreground ml-1">Settings</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
