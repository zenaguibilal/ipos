
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

export function ProductCardSkeleton() {
  return (
    <Card>
      <CardHeader className="p-0">
        <Skeleton className="rounded-t-lg aspect-[4/3]" />
      </CardHeader>
      <CardContent className="p-4 flex-grow space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between items-center">
        <div className="space-y-1">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-8 w-8" />
      </CardFooter>
    </Card>
  );
}
