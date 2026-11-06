# Cahier des charges — Prototype R-CONSTRUCT (Glide)

## 1. Contexte

Entreprise de construction R-CONSTRUCT. Construction d'un **prototype complet**
d'application de suivi de chantier avec Glide, assistée par Claude via MCP.

Objectif : application démontrable couvrant les 4 modules (photos, réserves,
rapports, pointage) + portail client, pour validation interne et présentation
client. Ce n'est PAS un produit fini.

## 2. Contraintes non négociables

- Mobile-first (Android, une main).
- Interface 100 % en français.
- Aucune suppression définitive : archivage uniquement.
- `Visible_Client` désactivé par défaut sur tout objet publiable.
- Les modifications (lever réserve, clôturer pointage) peuvent nécessiter
  une connexion réseau. Accepté pour ce prototype.

## 3. Modèle de données

### Table `Chantiers`
- ID_Chantier (texte, clé) — ex. CH-001
- Nom, Adresse (texte)
- Statut (En cours / Terminé / En attente)
- Photo_Couverture (image)
- Date_Début, Date_Fin_Prévue (date)

### Table `Utilisateurs`
- Email (clé), Nom (texte)
- Rôle (Admin / Conducteur / Compagnon / Client / Sous-traitant)
- ID_Chantier_Assigné (lien Chantiers)

### Table `Zones`
- ID_Chantier (lien), Nom_Zone (texte)

### Table `Photos`
- ID_Photo (clé auto)
- ID_Chantier (lien), Zone (lien)
- URL_Photo (image), Commentaire (texte)
- Date, Auteur
- Visible_Client (Oui/Non, défaut Non)
- Latitude, Longitude
- Archivé (Oui/Non, défaut Non)

### Table `Reserves`
- ID_Reserve (clé auto)
- ID_Chantier (lien), Zone (lien)
- Description (texte), Photo (image)
- Statut (Ouverte / En cours / Levée)
- Assigné_À (lien Utilisateurs)
- Date_Création, Date_Échéance, Date_Levée
- Visible_Client (Oui/Non, défaut Non)
- Archivé (Oui/Non, défaut Non)

### Table `Rapports`
- ID_Rapport (clé auto)
- ID_Chantier (lien), Zone (lien)
- Date, Auteur, Météo
- Effectif_Présent (nombre)
- Travaux_Réalisés (texte long)
- Incidents (texte long, optionnel)
- Photos (relation)
- Visible_Client (Oui/Non, défaut Non)

### Table `Pointages`
- ID_Pointage (clé auto)
- ID_Chantier (lien), Utilisateur (lien)
- Heure_CheckIn, Heure_CheckOut
- Latitude_CheckIn, Longitude_CheckIn
- Statut (En cours / Clôturé)

## 4. Rôles et permissions

Voir [`02-matrice-permissions.md`](02-matrice-permissions.md).

## 5. Écrans à construire (par blocs)

### Bloc A — Socle
1. Connexion (téléphone + SMS, ou lien magique email pour client).
2. Mes chantiers (accueil) : liste filtrée par assignation, bouton flottant
   "📷 Photo", bandeau hors-ligne.
3. Détail chantier : en-tête + onglets Photos / Réserves / Rapports /
   Pointage / Équipe.

### Bloc B — Photos
4. Formulaire photo : Chantier (pré-rempli), Zone, Photo, Commentaire
   (dictée), Visible_Client (défaut Non). 15 s max.
5. Galerie photos : grille par date, filtres zone/auteur/visible.

### Bloc C — Réserves
6. Liste des réserves : filtres par statut, assigné, zone.
7. Formulaire réserve : Chantier, Zone, Description, Photo, Assigné_À,
   Échéance, Visible_Client (défaut Non).
8. Détail réserve : bouton "Marquer levée" (réseau requis).

### Bloc D — Rapports
9. Liste des rapports par chantier, triés par date.
10. Formulaire rapport : Météo, Effectif, Travaux_Réalisés, Incidents, Photos,
    Visible_Client (défaut Non).
11. Détail rapport : lecture complète.

### Bloc E — Pointage
12. Écran pointage : bouton "Check-in" (géoloc + heure). Si pointage en
    cours, afficher "Check-out" (réseau requis).
13. Historique pointages par utilisateur et par chantier.

### Bloc F — Portail client
14. Vue client (lecture seule) : onglets Avancement, Photos publiées,
    Rapports publiés, Réserves levées, Documents.
15. Bouton "Poser une question" : crée une ligne dans `Messages_Client`.

## 6. Hors périmètre

Notifications push · statistiques avancées · facturation · publication
App Store / Play Store · gestion documentaire contractuelle complète.

## 7. Méthode de travail (pour Claude via MCP)

1. Avant toute action, lister ce qui va être créé/modifié, attendre validation.
2. Ne jamais créer une table, colonne ou écran sans l'annoncer.
3. Ne jamais supprimer. Proposer renommage ou ajout.
4. Procéder bloc par bloc (A → F). Résumer, faire tester, attendre feu vert.
5. Poser les questions manquantes au lieu d'inventer.
6. Signaler les actions susceptibles de consommer des crédits.
7. Si une fonctionnalité n'est pas réalisable dans Glide, le dire clairement.

## 8. Critères d'acceptation

Voir section "Critères d'acceptation" du [`README.md`](../README.md).
