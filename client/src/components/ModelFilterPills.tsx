import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getModelInfo, getModelNameFromId } from "@/lib/utils";

interface ModelFilterPillsProps {
  selectedModel: string | null;
  onSelectModel: (modelId: string | null) => void;
  models: string[];
}

/**
 * Render clickable pills for filtering results by model.
 */
export default function ModelFilterPills({
  selectedModel,
  onSelectModel,
  models
}: ModelFilterPillsProps) {
  return (
    <div className="mb-6 flex flex-wrap gap-2">
      <Button
        variant="outline"
        size="sm"
        className={cn(
          "rounded-full hover:border-primary/50 transition-colors",
          !selectedModel ? "bg-card text-foreground border-primary/50" : "bg-card/50 text-muted-foreground"
        )}
        onClick={() => onSelectModel(null)}
      >
        <span>All Models</span>
      </Button>
      
      {models.map((modelId) => {
        const model = getModelInfo(modelId);
        const isSelected = selectedModel === modelId;
        
        return (
          <Button
            key={modelId}
            variant="outline"
            size="sm"
            className={cn(
              "rounded-full transition-colors flex items-center gap-1",
              isSelected ? model.bg : "bg-transparent",
              isSelected ? model.color : "text-muted-foreground",
              isSelected ? model.border : "border-border",
              !isSelected && model.hoverBorder
            )}
            onClick={() => onSelectModel(isSelected ? null : modelId)}
          >
            <i className={model.icon}></i>
            <span>{model.name}</span>
          </Button>
        );
      })}
    </div>
  );
}
