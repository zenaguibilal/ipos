
# Configuration de la base de données iPOS sur Supabase (Mise à jour Synchro Globale)

Des fichiers de migration complets ont été fournis pour configurer votre application et garantir l'activation de toutes les fonctionnalités (Rôles, Boulangerie, Zakat, Personnel).

## Étapes d'exécution pour garantir la pleine souveraineté :

1. Allez sur le **Supabase Dashboard**.
2. Choisissez votre projet, puis allez dans la section **SQL Editor**.
3. Ouvrez une nouvelle requête (New Query).
4. Copiez le contenu du fichier `supabase/migrations/20240328000000_comprehensive_schema.sql` et collez-le ici.
5. Cliquez sur **Run**.

## Que fera ce script ?
*   **Correction des tables manquantes** : Création des tables `staff_profiles`, `recipes`, `bread_orders` et `zakat_logs`.
*   **Fortification de la protection (RLS)** : Activation des politiques d'accès basées sur les rôles (Admin/Manager/Cashier).
*   **Activation de la liaison** : Liaison du personnel et des commandes à l'identité de l'utilisateur enregistré.

## Note importante sur le Storage :
Vous devez créer manuellement un nouveau "Bucket" dans la section **Storage** nommé `backups` et définir sa confidentialité sur `Private` pour permettre au système de sauvegarder et de restaurer les sauvegardes cloud.

---
**Si l'erreur STAFF_FETCH_FAILED persiste, assurez-vous que le script ci-dessus a été exécuté avec succès.**
