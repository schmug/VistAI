import { useState, FormEvent, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { VoiceInput } from "@/components/VoiceInput";
import { SearchHistory } from "@/components/SearchHistory";

/**
 * Props for the SearchBar component
 */
interface SearchBarProps {
  /** Initial query text to populate the search input */
  initialQuery?: string;
  /** Whether to display in compact mode (smaller size for header) */
  compact?: boolean;
  /** Callback function called when a search is submitted */
  onSearch: (query: string) => void;
  /** Display search history as overlay dropdown */
  overlayHistory?: boolean;
}

/**
 * Maximum height in pixels before the textarea begins scrolling
 */
const MAX_TEXTAREA_HEIGHT = 160;

/**
 * Search input component with voice recognition, search history, and auto-resize functionality.
 * 
 * Features:
 * - Voice input using Web Speech API (browser dependent)
 * - Search history dropdown with localStorage persistence
 * - Auto-resizing textarea
 * - Compact mode for header usage
 * - Keyboard shortcuts (Enter to submit, Shift+Enter for new line)
 * 
 * @example
 * ```tsx
 * // Full-size search bar on home page
 * <SearchBar 
 *   onSearch={(query) => navigate(`/search?q=${encodeURIComponent(query)}`)} 
 * />
 * 
 * // Compact search bar in header
 * <SearchBar 
 *   compact={true}
 *   initialQuery={currentQuery}
 *   onSearch={handleSearch}
 * />
 * ```
 */
export default function SearchBar({ initialQuery = "", compact = false, onSearch, overlayHistory = true }: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const [showHistory, setShowHistory] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!compact && inputRef.current) {
      inputRef.current.focus();
    }
  }, [compact]);

  const handleFocus = () => {
    setShowHistory(true);
  };

  const handleBlur = () => {
    setTimeout(() => setShowHistory(false), 100);
  };


  useEffect(() => {
    const el = inputRef.current;
    if (el) {
      el.style.height = "auto";
      const newHeight = Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT);
      el.style.height = `${newHeight}px`;
    }
  }, [query]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    onSearch(query);
  };

  const handleVoiceResult = (text: string) => {
    setQuery(text);
    onSearch(text);
  };

  const handleHistorySelect = (item: string) => {
    setQuery(item);
    onSearch(item);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className={cn(
        "relative flex items-center glass-card search-bar-glow rounded-full transition-all",
        compact ? "px-4 py-2" : "px-5 py-3"
      )}>
        <i className={cn("ri-search-line text-primary/80 mr-3", compact ? "text-base" : "text-xl")}></i>
        
        <Textarea
          ref={inputRef}
          rows={1}
          placeholder="Search across multiple AI models..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e as unknown as FormEvent);
            }
          }}
          className={cn(
            "flex-1 resize-none overflow-y-auto border-none shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0",
            compact ? "text-base" : "text-lg"
          )}
          style={{ maxHeight: MAX_TEXTAREA_HEIGHT }}
        />
        
        <div className="flex items-center gap-2">
          <VoiceInput compact={compact} onResult={handleVoiceResult} />
          
          {!compact && (
            <Button 
              type="submit" 
              size="icon" 
              className="rounded-full"
            >
              <i className="ri-search-line text-xl"></i>
              <span className="sr-only">Search</span>
            </Button>
          )}
        </div>
        <SearchHistory
          show={showHistory}
          onSelect={handleHistorySelect}
          onToggle={setShowHistory}
          overlay={overlayHistory}
        />
      </div>
    </form>
  );
}
