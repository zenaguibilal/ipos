# وثائق iPOS - معمارية النظام المطلقة

## 🚀 المكدس التقني (Technical Stack)

*   **Framework:** Next.js 14 (App Router)
*   **UI Library:** React 18
*   **Components:** ShadCN UI / Tailwind CSS
*   **Backend & Authority:** Supabase (PostgreSQL, Auth, Storage)
*   **State Management:** Zustand (Memory-Only Singularity)
*   **API Layer:** Next.js API Routes (Hard API Wall)

## 🏗️ معمارية البيانات (PHASE 1 PURIFIED)

تم تطهير النظام بالكامل من كافة آليات التخزين المحلي المؤقت (Purged of IndexedDB, Dexie, LocalStorage Persistence).

*   **المصدر الوحيد للحقيقة:** قاعدة بيانات Supabase.
*   **بروتوكول الوصول:** يتم الوصول للبيانات حصراً عبر جدار حماية API (`/api/*`).
*   **العزل:** يمنع منعاً باتاً استدعاء Supabase SDK مباشرة من مكونات واجهة المستخدم.

## 💀 خريطة الفشل المصححة (Failure Map Resolved)

1.  **Repository/Service Duality:** تم دمج المنطق في مستودعات خادم حتمية (Server-side Repositories).
2.  **API Bypass:** تم سد الثغرات؛ المكونات تتحدث مع الـ API فقط.
3.  **Ephemeral State:** مخزن Zustand الآن يعمل في الذاكرة فقط، لا توجد حالة "ظل" (Shadow State) في المتصفح.
