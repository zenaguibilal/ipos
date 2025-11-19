'use client';
import { Loader } from "lucide-react";
import { SalesHistoryList } from "@/components/sales/sales-history-list";
import { useSales } from "@/lib/data";

export default function SalesHistoryPage() {
    const { sales, isLoading, error } = useSales();

    if (isLoading) {
        return <div className="flex justify-center items-center h-full"><Loader className="animate-spin" /></div>;
    }

    if (error) {
        return <div className="text-destructive text-center">Erreur lors du chargement de l'historique des ventes.</div>
    }

    return (
       <SalesHistoryList sales={sales || []} />
    );
}
