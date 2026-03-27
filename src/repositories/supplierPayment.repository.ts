
import { createClient } from "@/utils/supabase/server";
import type { SupplierPayment } from "@/lib/types";
import { SupplierRepository } from "./supplier.repository";

/**
 * @fileOverview SupplierPayment Repository (Absolute Server Authority)
 * المسؤول عن تسجيل مدفوعات الموردين وتصحيح موازينهم بشكل حتمي.
 */
export class SupplierPaymentRepository {
    private supabase = createClient();
    private supplierRepo = new SupplierRepository();

    async create(payment: any): Promise<SupplierPayment> {
        const { data, error } = await this.supabase
            .from('supplier_payments')
            .insert([{
                supplier_uuid: payment.supplierUuid,
                amount: payment.amount,
                payment_date: payment.paymentDate || new Date().toISOString(),
                method: payment.method,
                notes: payment.notes,
            }])
            .select()
            .single();

        if (error) throw new Error(`SUPPLIER_PAYMENT_FAILED: ${error.message}`);

        // أتمتة السلطة: إعادة حساب ميزان المورد فوراً
        await this.supplierRepo.recalculateBalance(payment.supplierUuid);

        return this.mapFromDb(data);
    }

    private mapFromDb(p: any): SupplierPayment {
        return {
            uuid: p.uuid,
            user_id: p.user_id,
            supplierUuid: p.supplier_uuid,
            amount: p.amount,
            paymentDate: p.payment_date,
            method: p.method,
            notes: p.notes,
            createdAt: p.created_at,
            updatedAt: p.updated_at,
        };
    }
}
