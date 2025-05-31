import { useState, FormEvent, useRef, useEffect } from "react";
import { cn, getQueryHistory, clearQueryHistory } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

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
  const [isRecording, setIsRecording] = useState(false);
  const [recognizedText, setRecognizedText] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (!compact && inputRef.current) {
      inputRef.current.focus();
    }
  }, [compact]);

  const handleFocus = () => {
    setHistory(getQueryHistory());
    setShowHistory(true);
  };

  const handleBlur = () => {
    setTimeout(() => setShowHistory(false), 100);
  };

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition ||
      (window as any).mozSpeechRecognition ||
      (window as any).msSpeechRecognition;

    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (e: any) => {
      const text = Array.from((e as any).results)
        .map((r: any) => r[0].transcript)
        .join("");
      setRecognizedText(text);
      setQuery(text);
      setIsRecording(false);
      onSearch(text);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
  }, [onSearch]);

  useEffect(() => {
    const el = inputRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }
  }, [query]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    onSearch(query);
  };

  const toggleRecording = () => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    if (isRecording) {
      recognition.stop();
    } else {
      setRecognizedText("");
      setIsRecording(true);
      recognition.start();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className={cn(
        "relative flex items-center bg-card border border-border hover:border-primary/50 focus-within:border-primary rounded-full transition-all shadow-lg",
        compact ? "px-4 py-2" : "px-5 py-3"
      )}>
        <i className={cn("ri-search-line text-muted-foreground mr-3", compact ? "text-base" : "text-xl")}></i>
        
        <Textarea
          ref={inputRef}
          rows={1}
          placeholder="Ask AI anything..."
          value={isRecording ? recognizedText : query}
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
            "flex-1 resize-none overflow-hidden border-none shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0",
            compact ? "text-base" : "text-lg"
          )}
        />
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            type="button"
            onClick={toggleRecording}
            className={cn(
              "hover:text-primary",
              isRecording ? "text-red-500" : "text-muted-foreground"
            )}
          >
            <i
              className={cn(
                isRecording ? "ri-mic-fill animate-pulse" : "ri-mic-line",
                compact ? "text-base" : "text-xl"
              )}
            ></i>
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
        {showHistory && history.length > 0 && (
          <div className="absolute left-0 top-full mt-2 w-full z-50 bg-card border border-border rounded-md shadow-lg">
            {history.map((item) => (
              <button
                key={item}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setQuery(item);
                  setShowHistory(false);
                  onSearch(item);
                }}
                className="w-full text-left px-4 py-2 text-sm hover:bg-muted"
              >
                {item}
              </button>
            ))}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                clearQueryHistory();
                setHistory([]);
                setShowHistory(false);
              }}
              className="w-full text-left px-4 py-2 text-sm border-t hover:bg-muted"
            >
              Clear history
            </button>
          </div>
        )}
      </div>
    </form>
  );
}
