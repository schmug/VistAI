import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ModelStats } from "@/lib/openrouter";
import { getModelInfo } from "@/lib/utils";

interface SubscriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topModels?: ModelStats[];
}

/**
 * Modal dialog offering subscription plans and displaying model stats.
 */
export default function SubscriptionModal({
  open,
  onOpenChange,
  topModels = []
}: SubscriptionModalProps) {
  const [plan, setPlan] = useState<"monthly" | "annual">("monthly");
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground">Upgrade Your Experience</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Subscribe to VistAI Pro and support your favorite AI models. We share revenue with the models you use most frequently.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-background/50 rounded-lg p-4 border border-border">
            <h4 className="font-medium text-foreground mb-2">Your Top Models</h4>
            <div className="space-y-2">
              {topModels.length > 0 ? (
                topModels.slice(0, 3).map((model) => {
                  const info = getModelInfo(model.displayName);
                  return (
                    <div key={model.modelId} className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full ${info.bg} flex items-center justify-center`}>
                          <i className={`${info.icon} ${info.color} text-xs`}></i>
                        </div>
                        <span className="text-muted-foreground text-sm">{model.displayName}</span>
                      </div>
                      <span className="text-muted-foreground text-sm">{model.percentage}%</span>
                    </div>
                  );
                })
              ) : (
                <div className="text-sm text-muted-foreground">
                  Start searching to see your model preferences
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div 
              className={`flex items-center justify-between p-3 rounded-lg border ${
                plan === "monthly" ? "border-primary/50" : "border-border"
              } hover:border-primary/50 transition-colors cursor-pointer`}
              onClick={() => setPlan("monthly")}
            >
              <div>
                <h4 className="text-foreground font-medium">Monthly</h4>
                <p className="text-muted-foreground text-sm">$9.99 per month</p>
              </div>
              <div className={`w-5 h-5 rounded-full ${
                plan === "monthly" ? "border border-primary" : "border border-muted-foreground"
              } flex items-center justify-center`}>
                {plan === "monthly" && (
                  <div className="w-3 h-3 rounded-full bg-primary"></div>
                )}
              </div>
            </div>
            
            <div 
              className={`flex items-center justify-between p-3 rounded-lg border ${
                plan === "annual" ? "border-primary/50" : "border-border"
              } hover:border-primary/50 transition-colors cursor-pointer`}
              onClick={() => setPlan("annual")}
            >
              <div>
                <h4 className="text-foreground font-medium">Annual</h4>
                <p className="text-muted-foreground text-sm">$99.99 per year (save 16%)</p>
              </div>
              <div className={`w-5 h-5 rounded-full ${
                plan === "annual" ? "border border-primary" : "border border-muted-foreground"
              } flex items-center justify-center`}>
                {plan === "annual" && (
                  <div className="w-3 h-3 rounded-full bg-primary"></div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <Separator />
        
        <DialogFooter className="flex-col gap-2">
          <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
            Subscribe Now
          </Button>
          
          <p className="text-xs text-muted-foreground text-center">
            Cancel anytime. <a href="#" className="text-primary hover:underline">Terms apply</a>
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
