# Changelog & Journal de bord — R-CONSTRUCT

Consigne les décisions, les tests terrain et les blocages rencontrés.
Entrées les plus récentes en haut.

## Conventions

- **Date** : AAAA-MM-JJ
- **Type** : DÉCISION · TEST · BLOCAGE · CORRECTION · NOTE
- **Statut** : Ouvert · Résolu · Abandonné

---

## 2026-11-06 — Initialisation du projet

**Type** : DÉCISION
**Statut** : Résolu

- Plateforme choisie : **Glide** (no-code, mobile-first, PWA).
- Construction assistée par **Claude via MCP Glide**.
- Découpage en **6 blocs** (A à F), test après chaque bloc.
- Dépôt GitHub créé pour la documentation et les données de test.
- Décision : **aucune suppression définitive**, archivage uniquement.

**Prochaine étape** : préparer les jeux de données, lancer le Bloc A.

---

## 2026-11-06 — Limites de Glide acceptées

**Type** : DÉCISION
**Statut** : Résolu

- Modification hors ligne non supportée : lever une réserve ou clôturer un
  pointage nécessite le réseau. Accepté pour le prototype.
- Pas de notifications push : contournement par email / WhatsApp manuel.
- Code source non exportable vers GitHub : duplication manuelle datée du
  projet Glide avant chaque modification majeure.

**Si ces limites deviennent bloquantes en usage réel** → envisager migration
vers FlutterFlow + Supabase.

---

## Questions ouvertes avant le Bloc A

| # | Question | Réponse |
|---|---|---|
| 1 | Liste réelle des zones par chantier ? | ⬜ |
| 2 | Noms et emails des conducteurs ? | ⬜ |
| 3 | Emails des clients à inviter ? | ⬜ |
| 4 | Chantier pilote choisi ? | ⬜ |
| 5 | 8 à 10 testeurs identifiés ? | ⬜ |

---

## Modèle d'entrée à copier

```markdown
## AAAA-MM-JJ — [Titre]

**Type** : DÉCISION / TEST / BLOCAGE / CORRECTION / NOTE
**Statut** : Ouvert / Résolu / Abandonné
**Bloc** : A / B / C / D / E / F

- Contexte : …
- Fait : …
- Résultat : …
- Suite : …
