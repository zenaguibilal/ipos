# iPOS - Description Complète de l'Application

Ce document fournit une description détaillée de chaque page et fonctionnalité majeure de l'application iPOS, une solution de point de vente 100% hors ligne, en mettant en lumière les aspects techniques clés qui garantissent sa robustesse et sa fiabilité.

---

## 1. Tableau de Bord (`/dashboard`)

C'est la page d'accueil et le centre névralgique de l'application, offrant une vue d'ensemble en temps réel des performances de l'entreprise.

-   **Objectif :** Fournir des indicateurs de performance clés (KPI) et une vue rapide de l'activité commerciale.
-   **Fonctionnalités :**
    -   **Sélecteur de Période :** Un filtre de date puissant pour analyser les données sur des périodes personnalisées (aujourd'hui, 7 derniers jours, ce mois-ci, etc.).
    -   **Cartes de Statistiques :** Affiche les chiffres essentiels : Revenu Total, Bénéfice Net, Nombre de Ventes et Valeur Totale du Stock. Ces métriques sont calculées dynamiquement à partir des données locales.
    -   **Alertes de Stock Faible :** Met en évidence les produits dont le stock a atteint ou est tombé en dessous du niveau minimum défini, permettant une gestion proactive des commandes.
    -   **Graphique des Revenus :** Un graphique à barres visuel qui compare les revenus et les bénéfices nets jour par jour sur la période sélectionnée, offrant un aperçu rapide des tendances.
    -   **Activité Récente :** Un flux en direct des dernières opérations : ventes, réceptions de stock, retours de produits et enregistrements de nouveaux clients, triées par date.

---

## 2. Point de Vente (`/sell`)

L'interface principale de caisse, conçue pour être rapide, intuitive et efficace, même sans connexion internet.

-   **Objectif :** Permettre l'enregistrement rapide des ventes et la gestion des transactions.
-   **Fonctionnalités :**
    -   **Gestion Multi-paniers :** Possibilité de gérer plusieurs paniers simultanément via des onglets, idéal pour les heures de pointe. L'état des paniers est temporaire et géré via `React.useState` pour une réactivité maximale.
    -   **Recherche de Produits :** Un champ de recherche puissant qui permet de trouver des produits par nom ou de les scanner par code-barres.
    -   **Sélection de Client :** Associer une vente à un client existant pour le suivi du crédit ou choisir "Client de passage" pour les ventes anonymes.
    -   **Finalisation de la Vente :** Un dialogue de paiement complet qui gère plusieurs modes de paiement.
        -   **Transaction Atomique :** La finalisation est une transaction `Dexie.js` atomique. Cela garantit que la mise à jour des stocks et la création de l'enregistrement de vente réussissent ensemble ou échouent ensemble, empêchant toute incohérence de données.
    -   **Paiement de Dettes :** Si un client avec un solde impayé est sélectionné, un bouton "Payer Dette" apparaît, permettant d'enregistrer un paiement pour ce client directement depuis l'interface de vente.
    -   **Impression de Reçus :** Génère un reçu détaillé à la fin de la vente, avec options d'impression pour imprimante thermique (80mm) ou format A4 standard.

---

## 3. Gestion des Produits (`/products`)

Le centre de contrôle complet pour tout l'inventaire.

-   **Objectif :** Gérer le catalogue de produits, suivre les niveaux de stock et les prix.
-   **Fonctionnalités :**
    -   **Recherche et Filtrage :** Outils puissants pour rechercher par nom/code-barres et filtrer par catégorie, fournisseur ou statut de stock.
    -   **Modes d'Affichage :** Basculer entre une vue en grille (cartes visuelles) et une vue en liste (tableau détaillé).
    -   **Actions en Masse :** Sélectionner plusieurs produits pour les supprimer en une seule fois ou pour imprimer leurs étiquettes avec code-barres.
    -   **Gestion de Produit :** Un formulaire complet pour ajouter ou modifier un produit avec tous ses détails : nom, catégorie, prix de vente, prix d'achat, quantité, stock minimum, codes-barres multiples, etc.
    -   **Import/Export CSV :** Importer une liste de produits depuis un fichier CSV pour un démarrage rapide ou exporter l'inventaire actuel.

---

## 4. Gestion des Clients (`/customers`)

Un mini-CRM pour gérer la base de données clients et leur historique.

-   **Objectif :** Centraliser les informations des clients, suivre leur historique d'achat et gérer leurs dettes.
-   **Fonctionnalités :**
    -   **Liste des Clients :** Affiche tous les clients avec des statistiques clés comme le solde impayé et la limite de crédit.
    -   **Page de Détail du Client (`/customers/[id]`):**
        -   **Historique d'Activité :** Une chronologie détaillée de toutes les interactions du client : achats, paiements et retours.
        -   **Actions :** Possibilité d'enregistrer un nouveau paiement pour ce client ou d'imprimer un relevé de compte détaillé de ses factures impayées.

---

## 5. Historique des Ventes (`/sales-history`)

Un journal de bord de toutes les transactions de vente passées.

-   **Objectif :** Fournir un accès facile à l'historique des ventes pour consultation ou gestion.
-   **Fonctionnalités :**
    -   Affichage de toutes les ventes avec recherche et filtre par période.
    -   **Détails de la Vente :** Ouvrir une fenêtre affichant tous les détails d'une vente.
    -   **Annulation de Vente :** Possibilité d'annuler une vente. Cette action est réversible et atomique : elle réintègre les produits dans le stock et ajuste le solde du client si nécessaire.

---

## 6. Gestion de Stock (`/stock` & `/costing`)

Modules pour la gestion de l'inventaire en amont (réceptions et coûts).

-   **Objectif :** Enregistrer les entrées de marchandises et calculer leur coût réel.
-   **Fonctionnalités :**
    -   **Réception de Stock (`/stock/intake`) :**
        -   Enregistrer une nouvelle livraison en spécifiant le fournisseur, le numéro de facture et la date.
        -   Ajouter des produits existants ou en créer de nouveaux à la volée.
        -   Saisir la quantité reçue et le prix d'achat unitaire. L'opération est une transaction atomique qui garantit la mise à jour cohérente de l'inventaire.
    -   **Calcul des Coûts (`/costing`) :**
        -   Outil d'analyse financière permettant de sélectionner une réception de stock et d'y ajouter des frais annexes (ex: transport).
        -   Le système répartit ces frais sur chaque article de la réception proportionnellement à sa valeur, calculant ainsi un **coût final unitaire**.
        -   L'utilisateur peut ensuite choisir d'appliquer ces nouveaux coûts comme prix d'achat pour les produits concernés, garantissant des calculs de bénéfices plus précis à l'avenir.

---

## 7. Gestion des Commandes de Pain (`/bread`)

Un module spécialisé et puissant pour gérer les commandes quotidiennes de pain.

-   **Objectif :** Automatiser et simplifier la gestion des clients et des commandes de pain.
-   **Fonctionnalités :**
    -   **Gestion des Clients de Pain :** Ajouter et gérer des clients avec des logiques de commande récurrentes.
    -   **Vue Journalière :** Interface principale affichant les commandes d'un seul jour, avec une navigation facile entre les jours.
    -   **Génération Automatique :** Le système crée automatiquement les commandes du jour pour tous les clients actifs en fonction de leurs règles de récurrence.
    -   **Conversion en Vente :** Sélectionner plusieurs commandes pour les transformer en factures de vente en un clic.

---

## 8. Profil & Paramètres (`/profile`)

La page de configuration globale de l'application.

-   **Objectif :** Gérer les informations de l'entreprise, les paramètres et les données de l'application.
-   **Fonctionnalités :**
    -   **Profil de l'Entreprise :** Modifier les informations qui apparaîtront sur les reçus.
    -   **Sauvegarde et Restauration :**
        -   **Sauvegarde :** Télécharger une sauvegarde complète de toutes les données de l'application (toutes les tables Dexie) dans un unique fichier JSON.
        -   **Restauration :** Restaurer l'état de l'application à partir d'un fichier de sauvegarde. C'est une opération destructrice mais efficace pour la migration de données.
    -   **Zone de Danger :** Une option pour réinitialiser complètement l'application et supprimer toutes les données.