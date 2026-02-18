import { Skeleton } from "@/components/ui/skeleton";

export default function MetricCardSkeleton() {
  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200 relative">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-9 w-16" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-5 w-5 rounded" />
      </div>
    </div>
  );
}
