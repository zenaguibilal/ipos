// This is a new file
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

export function ExpenseCardSkeleton() {
    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-8 w-8 rounded-md" />
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-32" />
            </CardContent>
            <CardFooter className="p-4 pt-0">
                 <Skeleton className="h-14 w-full" />
            </CardFooter>
        </Card>
    );
}
