# iPOS - Système de Point de Vente 100% Hors Ligne

**iPOS** est un système de Point de Vente (POS) complet, moderne et performant, conçu pour la gestion autonome des commerces de détail. C'est une **Progressive Web App (PWA)** qui fonctionne entièrement hors ligne, garantissant rapidité et fiabilité, même sans connexion internet.

---

## ⚠️ Important : Vos Données Sont Locales

Toutes les données de l'application (produits, ventes, clients, etc.) sont stockées **exclusivement dans la base de données IndexedDB de votre navigateur**, sur votre appareil actuel.

-   **Pas de Cloud, Pas de Compte :** Il n'y a pas de synchronisation cloud automatique ni de compte utilisateur. Votre vie privée est totale.
-   **Responsabilité de Sauvegarde :** Vous êtes seul responsable de la sauvegarde de vos données. Utilisez la fonction de **Sauvegarde et Restauration** disponible dans les paramètres pour exporter vos données et les conserver en lieu sûr.

---

## ✨ Fonctionnalités Principales

iPOS est une solution tout-en-un qui couvre tous les aspects de la gestion de votre commerce :

-   **📊 Tableau de Bord Analytique :** Vue d'ensemble en temps réel des KPIs (Revenu, Bénéfice, Ventes), graphiques, alertes de stock et activité récente.
-   **🛒 Point de Vente (POS) Rapide :** Interface de caisse optimisée pour la vitesse avec gestion multi-paniers, recherche par code-barres, gestion des clients (y compris les dettes) et remises.
-   **📦 Gestion d'Inventaire Complète :** Catalogue de produits avec gestion des catégories, prix d'achat/vente, stock minimum, dates d'expiration et support pour l'import/export CSV.
-   **👥 Gestion des Clients (CRM) :** Suivi détaillé de l'historique d'achat, gestion des crédits, des plafonds et des paiements.
-   **🍞 Module de Commandes Spécialisé :** Un système puissant pour gérer les commandes récurrentes (ex: pain) avec génération automatique, suivi de livraison et de paiement.
-   **📈 Gestion de Stock Avancée :**
    -   **Réceptions de Stock :** Enregistrez les livraisons des fournisseurs et mettez à jour l'inventaire.
    -   **Calcul des Coûts :** Outil financier pour répartir les frais (ex: transport) sur les produits et déterminer le coût de revient final.
-   **💸 Suivi des Dépenses :** Enregistrez et catégorisez toutes les charges de l'entreprise.
-   **🕋 Calculateur de Zakat :** Un outil pour estimer la Zakat commerciale due sur les actifs de l'entreprise.
-   **🔄 Historique & Retours :** Consultez l'historique complet des ventes et gérez les retours de produits de manière structurée.
-   **⚙️ Paramètres & Données :**
    -   Personnalisez les informations de votre entreprise pour les reçus.
    -   **Sauvegarde et Restauration** locale de toutes vos données via un fichier JSON.
    -   **Synchronisation Manuelle** avec Google Sheets (via un script Google Apps).
    -   **Installation de l'application (PWA)** pour une expérience de bureau native.

---

## 🚀 Architecture & Technologie

L'application est conçue autour d'une architecture **100% hors ligne**, offrant une réactivité et une disponibilité maximales.

-   **Framework :** [Next.js](https://nextjs.org/) (avec App Router)
-   **Stockage de Données :** [IndexedDB](https://developer.mozilla.org/fr/docs/Web/API/IndexedDB_API) via [Dexie.js](https://dexie.org/), une surcouche puissante qui permet des requêtes complexes et performantes.
-   **Interface Utilisateur :**
    -   Composants React construits avec [ShadCN UI](https://ui.shadcn.com/).
    -   Styling via [Tailwind CSS](https://tailwindcss.com/).
-   **PWA :** Configurée comme une Progressive Web App pour une installation sur ordinateur et mobile et une utilisation hors ligne complète.

---

## 🛠️ Démarrage

1.  **Accès :** Ouvrez simplement l'URL de l'application dans un navigateur moderne (Chrome, Firefox, Edge).
2.  **Installation (Recommandé) :**
    -   Dans les paramètres de l'application (`Profil & Paramètres → Installation`), cliquez sur "Installer l'application".
    -   Ou utilisez l'icône d'installation qui apparaît dans la barre d'adresse de votre navigateur.
3.  **Utilisation :** Commencez à ajouter vos produits et à réaliser des ventes. Tout est sauvegardé automatiquement sur votre appareil.
4.  **Sauvegarde :** N'oubliez pas de faire des sauvegardes régulières de vos données depuis la page des paramètres !
