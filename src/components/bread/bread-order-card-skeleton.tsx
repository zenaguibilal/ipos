
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

export function BreadOrderCardSkeleton() {
    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-8 w-8 rounded-md" />
                </div>
            </CardHeader>
            <CardContent className="space-y-2">
                 <Skeleton className="h-5 w-full" />
                 <Skeleton className="h-5 w-full" />
            </CardContent>
            <CardFooter className="p-0">
                <Skeleton className="h-16 w-full rounded-b-lg" />
            </CardFooter>
        </Card>
    );
}
