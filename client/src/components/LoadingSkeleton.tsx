import { Card } from "@/components/ui/card";

/**
 * Displays placeholder cards while search results load.
 */

export default function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <i className="ri-loader-4-line animate-spin"></i>
        <span>Searching...</span>
      </div>
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={index} className="bg-card border-border p-5">
          {/* Model Badge Skeleton */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full skeleton"></div>
              <div className="w-16 h-4 rounded skeleton"></div>
            </div>
            <div className="flex gap-2">
              <div className="w-8 h-8 rounded skeleton"></div>
              <div className="w-8 h-8 rounded skeleton"></div>
            </div>
          </div>

          {/* Content Skeleton */}
          <div className="space-y-2">
            <div className="w-3/4 h-6 rounded skeleton"></div>
            <div className="w-full h-4 rounded skeleton"></div>
            <div className="w-full h-4 rounded skeleton"></div>
            <div className="w-2/3 h-4 rounded skeleton"></div>
            {index % 2 === 0 && (
              <>
                <div className="w-full h-4 rounded skeleton"></div>
                <div className="w-5/6 h-4 rounded skeleton"></div>
              </>
            )}
          </div>

          {/* Feedback Skeleton */}
          <div className="mt-4 pt-4 border-t border-border flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full skeleton"></div>
              <div className="w-8 h-8 rounded-full skeleton"></div>
            </div>
            <div className="w-32 h-4 rounded skeleton"></div>
          </div>
        </Card>
      ))}
    </div>
  );
}
