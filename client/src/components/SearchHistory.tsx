import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { getSearchHistory, clearSearchHistory } from "@/lib/utils";

interface SearchHistoryProps {
  onSelect: (query: string) => void;
  show: boolean;
  onToggle: (show: boolean) => void;
}

/**
 * Search history dropdown component that displays recent search queries.
 * 
 * @param onSelect - Callback when a history item is selected
 * @param show - Whether to show the history dropdown
 * @param onToggle - Callback to control dropdown visibility
 */
export function SearchHistory({ onSelect, show, onToggle }: SearchHistoryProps) {
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    if (show) {
      setHistory(getSearchHistory());
    }
  }, [show]);

  const handleFocus = () => {
    setHistory(getSearchHistory());
    onToggle(true);
  };

  const handleBlur = () => {
    setTimeout(() => onToggle(false), 100);
  };

  const handleSelect = (item: string) => {
    onSelect(item);
    onToggle(false);
  };

  const handleClearHistory = () => {
    clearSearchHistory();
    setHistory([]);
    onToggle(false);
  };

  if (!show || history.length === 0) {
    return null;
  }

  return (
    <div className="absolute left-0 top-full mt-2 w-full z-50 bg-card border border-border rounded-md shadow-lg">
      {history.map((item) => (
        <Button
          key={item}
          type="button"
          variant="ghost"
          className="w-full justify-start px-4 py-2 text-sm hover:bg-muted"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleSelect(item)}
        >
          {item}
        </Button>
      ))}
      <Button
        type="button"
        variant="ghost"
        className="w-full justify-start px-4 py-2 text-sm border-t hover:bg-muted"
        onMouseDown={(e) => e.preventDefault()}
        onClick={handleClearHistory}
      >
        Clear history
      </Button>
    </div>
  );
}