import { memo } from "react";
import { cn } from "@/lib/utils";
import { getModelInfo, getModelNameFromId } from "@/lib/utils";

interface ModelBadgeProps {
  modelId: string;
  size?: "sm" | "md" | "lg";
  showName?: boolean;
}

/**
 * Display information about a model using its ID.
 */
const ModelBadge = memo(function ModelBadge({ modelId, size = "md", showName = true }: ModelBadgeProps) {
  const model = getModelInfo(modelId);
  const modelName = getModelNameFromId(modelId);
  
  // Icon and container sizing
  const sizeClasses = {
    sm: "w-4 h-4 text-xs",
    md: "w-6 h-6 text-sm",
    lg: "w-8 h-8 text-base"
  };
  
  return (
    <div className="flex items-center gap-2">
      <div className={cn(
        model.bg,
        "rounded-full flex items-center justify-center",
        sizeClasses[size]
      )}>
        <i className={cn(model.icon, model.color)}></i>
      </div>
      
      {showName && (
        <span className={cn(
          model.color,
          "font-medium",
          size === "sm" ? "text-xs" : size === "md" ? "text-sm" : "text-base"
        )}>
          {model.name}
        </span>
      )}
    </div>
  );
});

export default ModelBadge;
