# R-CONSTRUCT : application de gestion de chantiers

Application web mobile-first pour les équipes de R-CONSTRUCT : chantiers, photos, réserves (punch list), rapports journaliers, pointage et portail client en lecture seule.

## Fonctionnalités

- **Connexion** par profil (direction, conducteur, compagnon, client).
- **Accueil « Mes chantiers »** avec compteurs.
- **Photos** : prise de photo depuis le téléphone, choix de la zone, commentaire, publication au client (désactivée par défaut), galerie filtrable par zone.
- **Réserves** : description, zone, photo, assignation, échéance, marquage « levée ».
- **Rapports** : météo, effectif, travaux réalisés, incidents, historique par date.
- **Pointage** : check-in / check-out avec chronomètre et historique des durées.
- **Portail client** : vue en lecture seule, uniquement les éléments marqués visibles et les réserves levées.

## Structure

```
index.html   structure de l'application (écrans, feuilles modales, navigation)
style.css    charte graphique (bleu nuit #1A365D, orange #DD6B20)
app.js       logique, données de démonstration, stockage localStorage
logo.jpg     logo de l'entreprise
logo.png     icône de l'application
```

## Lancer l'application

Aucune installation n'est nécessaire.

- **En local** : ouvrez `index.html` dans un navigateur.
- **Sur GitHub Pages** : déposez les fichiers à la racine du dépôt, puis activez *Settings → Pages → Deploy from a branch → main / (root)*. L'application est alors accessible à l'adresse `https://<utilisateur>.github.io/<dépôt>/`.

## Données et stockage

- Les données sont stockées dans le `localStorage` du navigateur : elles restent sur chaque appareil et ne sont pas partagées entre utilisateurs.
- Les photos sont compressées et stockées en base64. La limite du navigateur (environ 5 Mo) peut être atteinte rapidement avec beaucoup de photos ; un message d'avertissement s'affiche alors.
- Pour réinitialiser les données de démonstration, videz le stockage du site dans les paramètres du navigateur.

## Personnalisation

- **Chantiers, zones, utilisateurs** : modifiez l'objet `SEED` au début de `app.js`.
- **Couleurs** : modifiez les variables CSS dans le bloc `:root` de `style.css`.

## Limites du prototype

- La connexion par profil est une simulation, sans mot de passe.
- Pas de synchronisation entre appareils : une version multi-utilisateurs nécessitera un backend (par exemple Supabase).

## Crédits

Logo et identité visuelle : R-CONSTRUCT, « L'art de bâtir des rêves ».
