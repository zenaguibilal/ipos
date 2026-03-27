
# وثائق iPOS - معمارية الهيمنة المطلقة

## 🚀 المكدس التقني (Technical Stack)

* **Framework:** Next.js 14 (App Router)
* **Backend:** Supabase (Server-Side Authority)
* **Logic Layer:** Repositories (Server-Only Authority)
* **Communication:** API Wall (Hard Boundary Enforced)
* **State:** Zustand (Memory-Only Singularity)

## 🏗️ سجل التطهير (PURIFICATION LOG)

### PHASE 1: COMPLETE DATA PURGE (100/100 COMPLETED)
تم تدمير كافة ميكانيكيات الـ PWA والـ Offline والتخزين المحلي المستمر. النظام يعمل في الذاكرة فقط ولا يقبل البيانات إلا حية من السحاب.

### PHASE 2: ABSOLUTE DATA AUTHORITY (100/100 COMPLETED)
المستودعات (Repositories) في جهة الخادم هي المصدر الوحيد والحتمي للحقيقة. كافة الحسابات المنطقية والمالية تتم خلف جدار الحماية.

### PHASE 3: API WALL (100/100 COMPLETED)
بناء جدار حماية صلب. تم عزل واجهة المستخدم تماماً عن قاعدة البيانات والمستودعات عبر نهايات طرفية محصنة (/api).

### PHASE 4: ARCHITECTURE PURIFICATION (100/100 COMPLETED)
**التطهير النهائي للخدمات**: تم استئصال طبقة الخدمات (Services) من واجهة المستخدم تماماً. كافة المكونات (بما في ذلك الدخول، إدارة البيانات، والبحث) تتصل الآن مباشرة بـ API Wall عبر كائن `api` الموحد. تم توحيد منطق الـ CSV في مكتبة أدوات سيادية. النظام الآن يتبع مساراً واحداً وحتمياً للبيانات.

## 📅 خريطة الطريق (Roadmap)
1. [✔] **Phase 1:** التطهير الكامل للبيانات.
2. [✔] **Phase 2:** سلطة البيانات المطلقة.
3. [✔] **Phase 3:** بناء جدار الحماية (Hard API Wall).
4. [✔] **Phase 4:** التوحيد المعماري (Architecture Purification).
5. [ ] **Phase 5:** حتمية الحالة (State Singularity).

---
**تحذير معمارية:** أي محاولة لاستخدام Supabase client أو استيراد مستودع أو استدعاء أي ملف من مجلد `src/services/` داخل مكون عميل ستعتبر خرقاً أمنياً وسيتم إبادتها فوراً. الطبقة الوحيدة المسموح بالتعامل معها هي `/api` و `api-client`.
