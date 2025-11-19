
'use client';
import { useSales } from "@/lib/data";
import { Loader } from "lucide-react";
import { SalesHistoryList } from "@/components/sales/sales-history-list";

export default function SalesHistoryPage() {
    const { sales, isLoading, error } = useSales();

    if (isLoading) {
        return <div className="flex justify-center items-center h-full"><Loader className="animate-spin" /></div>;
    }

    if (error) {
        return <div className="flex justify-center items-center h-full text-destructive">Erreur de chargement des ventes.</div>
    }
    
    return (
        <SalesHistoryList sales={sales || []} />
    );
}
