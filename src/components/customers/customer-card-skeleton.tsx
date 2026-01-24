
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

export function CustomerCardSkeleton() {
    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-8 w-8 rounded-md" />
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
            </CardContent>
            <CardFooter className="pt-0">
                 <Skeleton className="h-8 w-full" />
            </CardFooter>
        </Card>
    );
}
