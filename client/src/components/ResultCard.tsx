import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import ModelBadge from "./ModelBadge";
import { trackResultClick } from "@/lib/openrouter";
import { ModelResponse } from "@/lib/openrouter";

interface ResultCardProps {
  result: ModelResponse;
}

export default function ResultCard({ result }: ResultCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<"liked" | "disliked" | null>(null);
  
  // Track click on result
  const handleContentClick = () => {
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
  };
  
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
    <Card 
      className="result-card bg-card border-border hover:shadow-md transition-all"
      onClick={handleContentClick}
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
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-5 pt-3">
        <div className="result-content">
          <h3 className="text-lg font-medium mb-2 text-foreground">
            {result.title || "AI Response"}
          </h3>
          
          <div className="text-muted-foreground whitespace-pre-line">
            {result.content}
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="p-5 pt-2">
        <Separator className="mb-4" />
        
        <div className="w-full flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className={feedback === "liked" ? "text-primary" : "text-muted-foreground hover:text-primary"}
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
              className={feedback === "disliked" ? "text-secondary" : "text-muted-foreground hover:text-secondary"}
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
            <div className="text-xs text-muted-foreground">
              Response time: {(result.responseTime / 1000).toFixed(2)}s
            </div>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
