import { useState, useMemo, useCallback, memo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import ModelBadge from "./ModelBadge";
import { trackResultClick } from "@/lib/openrouter";
import { ModelResponse } from "@/lib/openrouter";

/**
 * Props for the ResultCard component
 */
interface ResultCardProps {
  /** Model response data containing content, title, timing, etc. */
  result: ModelResponse;
}

/**
 * Card component that displays a single AI model's response with expandable content.
 * 
 * Features:
 * - Collapsible content with expand/collapse functionality
 * - Click tracking for analytics (tracks when user expands content)
 * - Copy to clipboard functionality
 * - Share functionality
 * - Model badge with response time display
 * - Responsive design with mobile optimizations
 * 
 * The card initially shows a preview/snippet and expands to show full content
 * when clicked. This expansion is tracked as a user engagement metric.
 * 
 * @example
 * ```tsx
 * <ResultCard 
 *   result={{
 *     id: 123,
 *     modelId: "openai/gpt-4o-mini",
 *     content: "Full AI response content...",
 *     snippet: "Brief preview...",
 *     title: "Response Title",
 *     responseTime: 1250,
 *     modelName: "GPT-4o Mini"
 *   }} 
 * />
 * ```
 */
const ResultCard = memo(function ResultCard({ result }: ResultCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<"liked" | "disliked" | null>(null);
  const [open, setOpen] = useState(false);
  const preview = useMemo(() => 
    result.snippet || result.content.split(/\n/)[0], 
    [result.snippet, result.content]
  );
  const truncated = useMemo(() => 
    preview.length > 120 ? preview.slice(0, 120) + "..." : preview, 
    [preview]
  );

  const toggleOpen = () => {
    const value = !open;
    setOpen(value);
    if (value) handleContentClick();
  };
  
  // Track click on result
  const handleContentClick = useCallback(() => {
    trackResultClick(result.id)
      .then((stats) => {
        queryClient.setQueryData(["/api/model-stats"], stats);
        toast({
          title: "Click recorded",
          description: "Model statistics updated",
        });
      })
      .catch((error) => {
        console.error("Failed to track click:", error);
      });
  }, [result.id, queryClient, toast]);
  
  // Handle copy to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(result.content).then(() => {
      setCopied(true);
      toast({
        title: "Copied to clipboard",
        description: "The response has been copied to your clipboard",
      });
      
      setTimeout(() => setCopied(false), 2000);
    });
  };
  
  // Handle share
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: result.title || "AI Response",
        text: result.content,
        url: window.location.href,
      }).catch(console.error);
    } else {
      toast({
        title: "Share not supported",
        description: "Your browser doesn't support the Web Share API",
      });
    }
  };
  
  // Handle feedback
  const handleFeedback = (type: "liked" | "disliked") => {
    setFeedback(type);
    toast({
      title: type === "liked" ? "Thanks for your feedback!" : "We'll work on improving",
      description: type === "liked" 
        ? "We're glad this response was helpful" 
        : "Thank you for helping us improve our results",
    });
  };
  
  return (
    <Collapsible open={open}>
      <Card
        className="result-card cursor-pointer animate-fade-in"
        onClick={toggleOpen}
      >
      <CardHeader className="p-5 pb-2">
        <div className="flex justify-between items-center">
          <ModelBadge modelId={result.modelId} />

          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopy();
                    }}
                  >
                    <i className={copied ? "ri-check-line" : "ri-clipboard-line"}></i>
                    <span className="sr-only">Copy to clipboard</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Copy to clipboard</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShare();
                    }}
                  >
                    <i className="ri-share-line"></i>
                    <span className="sr-only">Share this result</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Share this result</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-primary"
              onClick={(e) => {
                e.stopPropagation();
                toggleOpen();
              }}
            >
              <i className={open ? "ri-arrow-up-s-line" : "ri-arrow-down-s-line"}></i>
              <span className="sr-only">Toggle result</span>
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 pt-3">
        <div className="result-content">
          <h3 className="text-lg font-semibold mb-2 text-foreground">
            {result.title || "AI Response"}
          </h3>
          {open ? (
            <div className="text-foreground-secondary whitespace-pre-line leading-relaxed">
              {result.content}
            </div>
          ) : (
            <div className="text-foreground-secondary leading-relaxed">{truncated}</div>
          )}
        </div>
      </CardContent>

      <CollapsibleContent>
        <CardFooter className="p-5 pt-2">
          <Separator className="mb-4" />
        
        <div className="w-full flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className={feedback === "liked" ? "text-accent shadow-glow-success" : "text-muted-foreground hover:text-accent"}
              onClick={(e) => {
                e.stopPropagation();
                handleFeedback("liked");
              }}
            >
              <i className={feedback === "liked" ? "ri-thumb-up-fill" : "ri-thumb-up-line"}></i>
              <span className="sr-only">Helpful</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className={feedback === "disliked" ? "text-error" : "text-muted-foreground hover:text-error"}
              onClick={(e) => {
                e.stopPropagation();
                handleFeedback("disliked");
              }}
            >
              <i className={feedback === "disliked" ? "ri-thumb-down-fill" : "ri-thumb-down-line"}></i>
              <span className="sr-only">Not helpful</span>
            </Button>
          </div>
          
          {result.responseTime && (
            <div className="text-xs text-muted-foreground-light font-mono">
              {(result.responseTime / 1000).toFixed(2)}s
            </div>
          )}
        </div>
      </CardFooter>
      </CollapsibleContent>
      </Card>
    </Collapsible>
  );
});

export default ResultCard;
