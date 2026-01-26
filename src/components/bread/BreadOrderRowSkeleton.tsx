
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export function BreadOrderRowSkeleton() {
    return (
        <Card>
            <div className="flex items-center p-3 gap-3">
                <Skeleton className="h-6 w-6 rounded-sm m-2" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-5 w-8" />
                </div>
                 <div className="flex items-center gap-4 sm:gap-6">
                    <div className="flex items-center space-x-2">
                        <Skeleton className="h-5 w-10" />
                        <Skeleton className="h-6 w-11 rounded-full" />
                    </div>
                    <div className="flex items-center space-x-2">
                        <Skeleton className="h-5 w-10" />
                        <Skeleton className="h-6 w-11 rounded-full" />
                    </div>
                </div>
                <div className="ml-4">
                    <Skeleton className="h-8 w-8 rounded-md" />
                </div>
            </div>
        </Card>
    );
}
