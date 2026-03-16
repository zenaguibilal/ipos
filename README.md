# iPOS - Système de Point de Vente 100% Hors Ligne

**iPOS** est un système de Point de Vente (POS) complet, moderne et performant, conçu pour la gestion autonome des commerces de détail. C'est une **Progressive Web App (PWA)** qui fonctionne entièrement hors ligne, garantissant rapidité et fiabilité, même sans connexion internet.

---

## ⚠️ Important : Vos Données Sont Locales et sous Votre Contrôle

Toutes les données de l'application (produits, ventes, clients, etc.) sont stockées **exclusivement dans la base de données IndexedDB de votre navigateur**, sur votre appareil actuel.

-   **Pas de Cloud, Pas de Compte :** Il n'y a pas de synchronisation cloud automatique ni de compte utilisateur. Votre vie privée est totale.
-   **Responsabilité de Sauvegarde :** Vous êtes seul responsable de la sauvegarde régulière de vos données. Utilisez la fonction de **Sauvegarde et Restauration** disponible dans les paramètres (`Profil & Paramètres → Sauvegarde`) pour exporter vos données et les conserver en lieu sûr.

---

## ✨ Un Écosystème Complet pour Gérer Votre Commerce

iPOS est une solution tout-en-un qui couvre tous les aspects de la gestion quotidienne de votre commerce :

-   **📊 Tableau de Bord Analytique (`/dashboard`) :** Une vue d'ensemble en temps réel de votre activité. Suivez les indicateurs de performance clés (Revenu, Bénéfice, Ventes), analysez les tendances avec des graphiques, recevez des alertes de stock faible et consultez les opérations récentes, le tout avec un filtre de date puissant.

-   **🛒 Point de Vente Rapide et Efficace (`/sell`) :** Une interface de caisse conçue pour la vitesse. Gérez plusieurs paniers simultanément, recherchez des produits par nom ou code-barres, associez des ventes à des clients (y compris la gestion des dettes) et finalisez les transactions avec une logique atomique qui garantit la cohérence des données.

-   **📦 Gestion d'Inventaire Complète (`/products`) :** Le centre de contrôle de votre catalogue. Gérez les produits, catégories, prix d'achat/vente, stock minimum, et codes-barres multiples. Profitez des actions en masse, de l'import/export CSV et de l'impression d'étiquettes.

-   **👥 Gestion des Clients (Mini-CRM) (`/customers`) :** Suivez l'historique d'achat de vos clients, gérez leurs crédits et leurs dettes. Consultez une chronologie détaillée de leurs activités et imprimez des relevés de compte.

-   **📈 Gestion de Stock Avancée (`/stock` & `/costing`) :**
    -   **Réceptions de Stock :** Enregistrez les livraisons des fournisseurs et mettez à jour votre inventaire de manière atomique et traçable.
    -   **Calcul des Coûts :** Un outil financier pour répartir les frais annexes (ex: transport) sur les produits et déterminer leur coût de revient final, assurant des calculs de bénéfices précis.

-   **🍞 Module de Commandes de Pain (`/bread`) :** Un système spécialisé pour gérer les commandes récurrentes (ex: pain) avec génération automatique, suivi de livraison et conversion en ventes en un clic.

-   **💸 Suivi des Dépenses (`/expenses`) :** Enregistrez et catégorisez toutes les charges de votre entreprise pour une vue financière complète.

-   **🔄 Historique & Retours (`/sales-history` & `/returns`) :** Consultez l'historique complet des ventes et gérez les retours de produits de manière structurée et atomique, en réintégrant le stock et en ajustant les soldes clients automatiquement.

-   **⚙️ Paramètres & Données (`/profile`) :**
    -   Personnalisez les informations de votre entreprise pour les reçus.
    -   **Sauvegarde et Restauration** locale de toutes vos données via un fichier JSON.
    -   **Installation de l'application (PWA)** pour une expérience de bureau native.

---

## 🚀 Architecture & Technologie

L'application est conçue autour d'une architecture **100% hors ligne**, offrant une réactivité et une disponibilité maximales.

-   **Framework :** [Next.js](https://nextjs.org/) (avec App Router) pour une interface utilisateur réactive et structurée.
-   **Stockage de Données :** [IndexedDB](https://developer.mozilla.org/fr/docs/Web/API/IndexedDB_API) via [Dexie.js](https://dexie.org/), une surcouche puissante qui sert de base de données principale locale, permettant des requêtes complexes et performantes.
-   **Mises à jour en temps réel :** Le hook `useLiveQuery` de `dexie-react-hooks` s'abonne aux changements de la base de données et met à jour l'interface utilisateur automatiquement, créant une expérience fluide et réactive.
-   **Interface Utilisateur :**
    -   Composants React réutilisables construits avec [ShadCN UI](https://ui.shadcn.com/).
    -   Styling via [Tailwind CSS](https://tailwindcss.com/) pour un design moderne et personnalisable.
-   **PWA :** Configurée comme une Progressive Web App pour une installation sur ordinateur et mobile et une utilisation hors ligne complète.

---

## 🛠️ Démarrage Rapide

1.  **Accès :** Ouvrez simplement l'URL de l'application dans un navigateur moderne (Chrome, Firefox, Edge, Safari).
2.  **Installation (Fortement Recommandé) :**
    -   Dans les paramètres de l'application (`Profil & Paramètres → Installation`), cliquez sur "Installer l'application".
    -   Ou utilisez l'icône d'installation qui apparaît dans la barre d'adresse de votre navigateur.
3.  **Utilisation :** Commencez à ajouter vos produits via la page "Produits" ou directement lors d'une réception de stock, puis réalisez votre première vente. Tout est sauvegardé automatiquement sur votre appareil.
4.  **Sauvegarde :** N'oubliez pas de faire des sauvegardes régulières de vos données depuis la page des paramètres !
