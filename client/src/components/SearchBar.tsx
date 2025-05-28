import { useState, FormEvent, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SearchBarProps {
  initialQuery?: string;
  compact?: boolean;
  onSearch: (query: string) => void;
}

/**
 * Search input with optional compact display used throughout the app.
 */
export default function SearchBar({ initialQuery = "", compact = false, onSearch }: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!compact && inputRef.current) {
      inputRef.current.focus();
    }
  }, [compact]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    onSearch(query);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className={cn(
        "relative flex items-center bg-card border border-border hover:border-primary/50 focus-within:border-primary rounded-full transition-all shadow-lg",
        compact ? "px-4 py-2" : "px-5 py-3"
      )}>
        <i className={cn("ri-search-line text-muted-foreground mr-3", compact ? "text-base" : "text-xl")}></i>
        
        <Input
          ref={inputRef}
          type="text"
          placeholder="Ask AI anything..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={cn(
            "flex-1 border-none shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0",
            compact ? "text-base" : "text-lg"
          )}
        />
        
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            type="button"
            className="text-muted-foreground hover:text-primary"
          >
            <i className={cn("ri-mic-line", compact ? "text-base" : "text-xl")}></i>
            <span className="sr-only">Use voice input</span>
          </Button>
          
          {!compact && (
            <Button 
              type="submit" 
              size="icon" 
              className="bg-primary hover:bg-primary/90 text-white rounded-full"
            >
              <i className="ri-search-line text-xl"></i>
              <span className="sr-only">Search</span>
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}
