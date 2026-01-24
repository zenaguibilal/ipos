
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardFooter } from "@/components/ui/card";

export function OrderCardSkeleton() {
    return (
        <Card>
            <CardHeader className="flex-row items-start justify-between pb-2 pt-3 pl-10">
                <div className="space-y-1">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-8 w-12" />
                </div>
                <Skeleton className="h-8 w-8" />
            </CardHeader>
            <CardFooter className="flex-col items-stretch gap-3 pt-4 border-t">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-12" />
                    <Skeleton className="h-6 w-11 rounded-full" />
                </div>
                 <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-12" />
                    <Skeleton className="h-6 w-11 rounded-full" />
                </div>
            </CardFooter>
        </Card>
    );
}
