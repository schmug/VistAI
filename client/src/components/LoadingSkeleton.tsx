import { Card } from "@/components/ui/card";

interface LoadingSkeletonProps {
  /** Number of placeholder cards to display */
  count?: number;
  /** Blink skeletons to indicate new results are streaming */
  blink?: boolean;
}

/**
 * Displays placeholder cards while search results load.
 */
export default function LoadingSkeleton({ count = 4, blink = false }: LoadingSkeletonProps) {
  const skeletonCls = blink ? "skeleton-glow blink" : "skeleton-glow"
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <i className="ri-loader-4-line animate-spin"></i>
        <span>Searching...</span>
      </div>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="glass-card p-5 animate-fade-in">
          {/* Model Badge Skeleton */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full ${skeletonCls}`}></div>
              <div className={`w-16 h-4 rounded ${skeletonCls}`}></div>
            </div>
            <div className="flex gap-2">
              <div className={`w-8 h-8 rounded ${skeletonCls}`}></div>
              <div className={`w-8 h-8 rounded ${skeletonCls}`}></div>
            </div>
          </div>

          {/* Content Skeleton */}
          <div className="space-y-2">
            <div className={`w-3/4 h-6 rounded ${skeletonCls}`}></div>
            <div className={`w-full h-4 rounded ${skeletonCls}`}></div>
            <div className={`w-full h-4 rounded ${skeletonCls}`}></div>
            <div className={`w-2/3 h-4 rounded ${skeletonCls}`}></div>
            {index % 2 === 0 && (
              <>
                <div className={`w-full h-4 rounded ${skeletonCls}`}></div>
                <div className={`w-5/6 h-4 rounded ${skeletonCls}`}></div>
              </>
            )}
          </div>

          {/* Feedback Skeleton */}
          <div className="mt-4 pt-4 border-t border-border flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full ${skeletonCls}`}></div>
              <div className={`w-8 h-8 rounded-full ${skeletonCls}`}></div>
            </div>
            <div className={`w-32 h-4 rounded ${skeletonCls}`}></div>
          </div>

          {/* Loading Indicator */}
          <div className="mt-4 flex items-center gap-2 justify-center text-primary/80 text-sm">
            <i className="ri-loader-4-line animate-spin text-primary"></i>
            <span>Waiting for response...</span>
          </div>
        </Card>
      ))}
    </div>
  );
}
