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
    <div className="absolute left-0 top-full mt-2 w-full z-[100] bg-card/95 backdrop-blur-sm border border-border rounded-lg shadow-xl max-h-64 overflow-y-auto">
      <div className="py-2">
        {history.map((item, index) => (
          <Button
            key={item}
            type="button"
            variant="ghost"
            className="w-full justify-start px-4 py-2.5 text-sm hover:bg-muted/70 transition-colors rounded-none text-left"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handleSelect(item)}
          >
            <i className="ri-time-line text-muted-foreground mr-2 text-xs"></i>
            <span className="truncate">{item}</span>
          </Button>
        ))}
        {history.length > 0 && (
          <div className="border-t border-border mt-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              className="w-full justify-start px-4 py-2.5 text-sm hover:bg-muted/70 transition-colors rounded-none text-muted-foreground"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleClearHistory}
            >
              <i className="ri-delete-bin-line mr-2 text-xs"></i>
              Clear history
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}