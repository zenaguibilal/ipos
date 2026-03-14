
# iPOS - Description Complète de l'Application

Ce document fournit une description détaillée de chaque page et fonctionnalité majeure de l'application iPOS, une solution de point de vente 100% hors ligne.

---

## 1. Tableau de Bord (`/dashboard`)

C'est la page d'accueil et le centre névralgique de l'application, offrant une vue d'ensemble en temps réel des performances de l'entreprise.

-   **Objectif :** Fournir des indicateurs de performance clés (KPI) et une vue rapide de l'activité commerciale.
-   **Fonctionnalités :**
    -   **Sélecteur de Période :** Un filtre de date puissant pour analyser les données sur des périodes personnalisées (aujourd'hui, 7 derniers jours, ce mois-ci, etc.).
    -   **Cartes de Statistiques :** Affiche les chiffres essentiels : Revenu Total, Bénéfice Net, Nombre de Ventes et Valeur Totale du Stock.
    -   **Alertes de Stock Faible :** Affiche des notifications pour les produits dont le stock a atteint ou est tombé en dessous du niveau minimum défini.
    -   **Graphique des Revenus :** Un graphique à barres visuel qui compare les revenus et les bénéfices nets jour par jour sur la période sélectionnée.
    -   **Activité Récente :** Un flux en direct des dernières opérations : ventes, réceptions de stock, retours de produits et enregistrements de nouveaux clients.
    -   **Produits Phares :** Liste des produits les plus vendus et les plus rentables.
    -   **Meilleurs Clients :** Liste des clients ayant le plus dépensé.
    -   **Analyse des Dépenses :** Un graphique circulaire (camembert) qui décompose les dépenses par catégorie.

---

## 2. Point de Vente (`/sell`)

L'interface principale de caisse, conçue pour être rapide, intuitive et efficace.

-   **Objectif :** Permettre l'enregistrement rapide des ventes et la gestion des transactions.
-   **Fonctionnalités :**
    -   **Gestion Multi-paniers :** Possibilité de gérer plusieurs paniers simultanément via des onglets, idéal pour les heures de pointe.
    -   **Recherche de Produits :** Un champ de recherche puissant qui permet de trouver des produits par nom ou de les scanner par code-barres.
    -   **Sélection de Client :** Associer une vente à un client existant pour le suivi du crédit ou choisir "Client de passage" pour les ventes anonymes.
    -   **Panier Interactif :** Affichage en temps réel des articles ajoutés, avec la possibilité de modifier les quantités ou de supprimer des articles.
    -   **Application de Remises :** Appliquer une remise sur le total, soit en montant fixe (DA), soit en pourcentage (%).
    -   **Gestion des Brouillons :** Sauvegarder un panier en cours comme brouillon pour le reprendre plus tard.
    -   **Finalisation de la Vente :** Un dialogue de paiement complet qui gère plusieurs modes de paiement : Espèces, Carte, Crédit (pour les clients enregistrés) et Mixte. Le système calcule automatiquement la monnaie à rendre et met à jour le solde du client en cas de vente à crédit.
    -   **Raccourcis Clavier :** Optimisé pour la vitesse avec des raccourcis (F1, F2, F9, etc.) pour la recherche, la sélection de client et le paiement.
    -   **Impression de Reçus :** Génère un reçu détaillé à la fin de la vente, avec options d'impression pour imprimante thermique (80mm) ou format A4 standard.

---

## 3. Gestion des Produits (`/products`)

Le centre de contrôle complet pour tout l'inventaire.

-   **Objectif :** Gérer le catalogue de produits, suivre les niveaux de stock et les prix.
-   **Fonctionnalités :**
    -   **Recherche et Filtrage :** Outils puissants pour rechercher par nom/code-barres et filtrer par catégorie, fournisseur ou statut de stock (en stock, stock faible, en rupture).
    -   **Modes d'Affichage :** Basculer entre une vue en grille (cartes visuelles) et une vue en liste (tableau détaillé).
    -   **Actions en Masse :** Sélectionner plusieurs produits pour les supprimer en une seule fois ou pour imprimer leurs étiquettes avec code-barres.
    -   **Gestion de Produit :** Un formulaire complet pour ajouter ou modifier un produit avec tous ses détails : nom, catégorie, prix de vente, prix d'achat, quantité, stock minimum, codes-barres multiples, date d'expiration, etc.
    -   **Import/Export CSV :** Importer une liste de produits depuis un fichier CSV pour un démarrage rapide ou exporter l'inventaire actuel.

---

## 4. Gestion des Clients (`/customers`)

Un mini-CRM pour gérer la base de données clients et leur historique.

-   **Objectif :** Centraliser les informations des clients, suivre leur historique d'achat et gérer leurs dettes.
-   **Fonctionnalités :**
    -   **Liste des Clients :** Affiche tous les clients sous forme de cartes, avec des statistiques clés comme le solde impayé et la limite de crédit.
    -   **Recherche et Filtre :** Rechercher par nom/téléphone et filtrer les clients (ex: ceux qui ont une dette, ceux qui ont dépassé leur plafond).
    -   **Page de Détail du Client (`/customers/[id]`):**
        -   **Historique d'Activité :** Une chronologie détaillée de toutes les interactions du client : achats, paiements et retours.
        -   **Métriques Clés :** Vue d'ensemble des dépenses totales, du solde impayé et de l'utilisation de la limite de crédit.
        -   **Actions :** Possibilité d'enregistrer un nouveau paiement pour ce client ou d'imprimer un relevé de compte détaillé de ses factures impayées.

---

## 5. Historique des Ventes (`/sales-history`)

Un journal de bord de toutes les transactions de vente passées.

-   **Objectif :** Fournir un accès facile à l'historique des ventes pour consultation ou gestion.
-   **Fonctionnalités :**
    -   Affichage de toutes les ventes sous forme de cartes claires et concises.
    -   Recherche par numéro de facture ou nom de client et filtre par période.
    -   **Détails de la Vente :** Ouvrir une fenêtre affichant tous les détails d'une vente (articles, prix, remises, paiements).
    -   **Annulation de Vente :** Possibilité d'annuler une vente. Cette action est réversible : elle réintègre les produits dans le stock et ajuste le solde du client si nécessaire.

---

## 6. Gestion des Retours (`/returns`)

Module dédié à la gestion des retours de produits par les clients.

-   **Objectif :** Enregistrer et suivre les retours de produits de manière structurée.
-   **Fonctionnalités :**
    -   **Création de Retour (`/returns/new`) :** Le processus commence par la recherche de la vente originale via son numéro de facture. L'utilisateur peut ensuite sélectionner les articles à retourner, spécifier la quantité, et indiquer si l'article doit être réintégré au stock. Le montant remboursé est également enregistré.
    -   **Historique des Retours :** Affiche une liste de tous les retours enregistrés, avec la possibilité de voir les détails ou d'annuler un retour.

---

## 7. Gestion de Stock (`/stock` & `/costing`)

Modules pour la gestion de l'inventaire en amont (réceptions et coûts).

-   **Objectif :** Enregistrer les entrées de marchandises et calculer leur coût réel.
-   **Fonctionnalités :**
    -   **Réception de Stock (`/stock/intake`) :**
        -   Enregistrer une nouvelle livraison en spécifiant le fournisseur, le numéro de facture et la date.
        -   Ajouter des produits existants ou en créer de nouveaux à la volée.
        -   Saisir la quantité reçue, la quantité endommagée et le prix d'achat unitaire.
    -   **Calcul des Coûts (`/costing`) :**
        -   Outil d'analyse financière permettant de sélectionner une réception de stock et d'y ajouter des frais annexes (ex: transport).
        -   Le système répartit ces frais sur chaque article de la réception proportionnellement à sa valeur, calculant ainsi un **coût final unitaire**.
        -   L'utilisateur peut ensuite choisir d'appliquer ces nouveaux coûts comme prix d'achat pour les produits concernés, garantissant des calculs de bénéfices plus précis à l'avenir.

---

## 8. Gestion des Dépenses (`/expenses`)

-   **Objectif :** Suivre toutes les charges et dépenses de l'entreprise.
-   **Fonctionnalités :**
    -   Ajouter, modifier et supprimer des dépenses avec une description, un montant, une catégorie (Loyer, Salaires, etc.) et une date.
    -   Filtrer les dépenses par catégorie et par période.
    -   Afficher le total des dépenses pour la période sélectionnée.

---

## 9. Calculateur de Zakat (`/zakat`)

-   **Objectif :** Aider l'utilisateur à estimer la Zakat commerciale due sur ses actifs.
-   **Fonctionnalités :**
    -   Calcule automatiquement la **base de Zakat** (assiette) en additionnant la valeur du stock (au prix d'achat), les créances clients (dettes des clients) et les liquidités entrées manuellement, puis en soustrayant les dettes commerciales.
    -   Calcule le **Nisab** (seuil) basé sur le prix de l'or par gramme (configurable dans les paramètres).
    -   Détermine si la Zakat est due et affiche le montant final à payer (2.5% de la base).

---

## 10. Gestion des Commandes de Pain (`/bread`)

Un module spécialisé et puissant pour gérer les commandes quotidiennes de pain.

-   **Objectif :** Automatiser et simplifier la gestion des clients et des commandes de pain.
-   **Fonctionnalités :**
    -   **Gestion des Clients de Pain :** Ajouter et gérer des clients avec des logiques de commande récurrentes : `quotidien` (quantité fixe), `jours_specifiques` (quantité variable par jour de la semaine), ou `aucun` (manuel).
    -   **Vue Journalière :** Interface principale affichant les commandes d'un seul jour, avec une navigation facile entre les jours.
    -   **Génération Automatique :** Le système crée automatiquement les commandes du jour pour tous les clients actifs en fonction de leurs règles de récurrence.
    -   **Gestion des Statuts Indépendante :** Suivi séparé de l'état de paiement (`est_paye`) et de l'état de livraison (`est_livre`) pour chaque commande.
    -   **Conversion en Vente :** Sélectionner plusieurs commandes pour les transformer en factures de vente en un clic. Le système met à jour automatiquement le solde du client et marque la commande comme payée.
    -   **Statistiques et Impression :** Affiche des statistiques clés pour la journée (commandé, livré, restant) et permet d'imprimer une liste de livraison détaillée.

---

## 11. Profil & Paramètres (`/profile`)

La page de configuration globale de l'application.

-   **Objectif :** Gérer les informations de l'entreprise, les paramètres et les données de l'application.
-   **Fonctionnalités :**
    -   **Profil de l'Entreprise :** Modifier les informations qui apparaîtront sur les reçus et autres documents (nom, adresse, contact, etc.).
    -   **Paramètres Spécifiques :** Définir des valeurs clés utilisées dans d'autres parties de l'application, comme le prix de l'or (pour la Zakat) et le prix de vente du pain.
    -   **Sauvegarde et Restauration :**
        -   **Sauvegarde :** Télécharger une sauvegarde complète de toutes les données de l'application dans un unique fichier JSON.
        -   **Restauration :** Restaurer l'état de l'application à partir d'un fichier de sauvegarde (cette action écrase toutes les données actuelles).
    -   **Zone de Danger :** Une option pour réinitialiser complètement l'application et supprimer toutes les données, avec une double confirmation pour éviter les erreurs.
    -   **Synchronisation :** Synchroniser manuellement les données clés avec une feuille de calcul Google Sheet via une URL de script Google Apps.

