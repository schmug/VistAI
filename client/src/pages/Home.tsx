import { useState } from "react";
import { getRandomSuggestions } from "@/lib/utils";
import SearchBar from "@/components/SearchBar";

interface HomeProps {
  onSearch: (query: string) => void;
}

export default function Home({ onSearch }: HomeProps) {
  const [suggestions] = useState(() => getRandomSuggestions(3));
  
  return (
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
        <SearchBar onSearch={onSearch} />

        <div className="flex flex-wrap justify-center gap-2 mt-5">
          {suggestions.map((suggestion, index) => (
            <button 
              key={index} 
              className="text-xs bg-card px-3 py-1.5 rounded-full text-muted-foreground cursor-pointer hover:bg-card/80 transition-colors"
              onClick={() => onSearch(suggestion)}
            >
              Try: "{suggestion}"
            </button>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-muted-foreground text-sm">
            Powered by <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">OpenRouter</a> • 
            <button onClick={() => onSearch("dashboard")} className="text-muted-foreground hover:text-foreground ml-1">Dashboard</button> • 
            <span className="text-muted-foreground ml-1" title="Coming soon">Settings (coming soon)</span>
          </p>
        </div>
      </div>
    </div>
  );
}
