
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

export function TransactionCardSkeleton() {
    return (
        <Card>
            <CardHeader className="p-4 flex-row justify-between items-start">
                <div className="space-y-1">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-8 w-8" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <Skeleton className="h-16 w-full rounded-lg" />
            </CardContent>
            <CardFooter className="p-4 pt-0 justify-center">
                 <Skeleton className="h-6 w-20 rounded-full" />
            </CardFooter>
        </Card>
    );
}
