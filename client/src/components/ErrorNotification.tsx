import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { AppError, getErrorMessage, needsApiKey } from "@/lib/errorHandling";

interface ErrorNotificationProps {
  error: AppError | null;
  onDismiss: () => void;
  onRetry?: () => void;
}

export function ErrorNotification({ error, onDismiss, onRetry }: ErrorNotificationProps) {
  const [, navigate] = useLocation();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (error) {
      setIsVisible(true);
      // Auto-dismiss non-critical errors after 8 seconds
      if (error.type !== 'auth' && !needsApiKey(error)) {
        const timer = setTimeout(() => {
          setIsVisible(false);
          setTimeout(onDismiss, 300); // Allow fade out animation
        }, 8000);
        return () => clearTimeout(timer);
      }
    }
  }, [error, onDismiss]);

  if (!error || !isVisible) return null;

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 300); // Allow fade out animation
  };

  const getErrorIcon = () => {
    switch (error.type) {
      case 'network':
        return 'ri-wifi-off-line';
      case 'auth':
        return 'ri-lock-line';
      case 'api':
        return needsApiKey(error) ? 'ri-key-line' : 'ri-server-line';
      case 'validation':
        return 'ri-error-warning-line';
      default:
        return 'ri-alert-line';
    }
  };

  const getErrorColor = () => {
    if (needsApiKey(error)) return 'border-info bg-info/10';
    if (error.type === 'auth') return 'border-warning bg-warning/10';
    return 'border-error bg-error/10';
  };

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-md transition-all duration-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
      <Alert className={`${getErrorColor()} shadow-lg border-2 glass-card`}>
        <div className="flex items-start gap-3">
          <i className={`${getErrorIcon()} text-lg mt-0.5 flex-shrink-0`}></i>
          <div className="flex-1 min-w-0">
            <AlertDescription className="text-sm font-medium mb-2">
              {getErrorMessage(error)}
            </AlertDescription>
            
            {error.details && (
              <details className="text-xs opacity-75 mt-1">
                <summary className="cursor-pointer hover:opacity-100">
                  Technical details
                </summary>
                <p className="mt-1 font-mono">{error.details}</p>
              </details>
            )}

            <div className="flex items-center gap-2 mt-3">
              {needsApiKey(error) && (
                <Button
                  size="sm"
                  onClick={() => navigate("/settings")}
                  className="bg-info hover:bg-info/90 text-info-foreground"
                >
                  <i className="ri-settings-line mr-1"></i>
                  Settings
                </Button>
              )}
              
              {error.retryable && onRetry && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    handleDismiss();
                    onRetry();
                  }}
                >
                  <i className="ri-refresh-line mr-1"></i>
                  Retry
                </Button>
              )}
              
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDismiss}
                className="ml-auto"
              >
                <i className="ri-close-line"></i>
              </Button>
            </div>
          </div>
        </div>
      </Alert>
    </div>
  );
}