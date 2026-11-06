# Matrice des rôles et permissions

## Les 5 rôles

| Rôle | Qui | Nombre typique |
|---|---|---|
| Admin | Direction, gérant | 1–3 |
| Conducteur | Conducteur de travaux, chef de chantier | 3–10 |
| Compagnon | Ouvrier, chef d'équipe | 10–100 |
| Client | Maître d'ouvrage | Autant que de chantiers |
| Sous-traitant | Entreprise externe | Variable |

## Règle d'or : pas de suppression, seulement l'archivage

Aucune suppression définitive. Un litige peut surgir 18 mois après la fin du
chantier : il faut pouvoir prouver ce qui a été fait, quand, et par qui.

## Matrice complète

C = Créer · L = Lire · M = Modifier · A = Archiver

| Objet | Admin | Conducteur | Compagnon | Client | Sous-traitant |
|---|---|---|---|---|---|
| Chantiers | C L M A | L M | L (le sien) | L (le sien) | L (le sien) |
| Zones / Lots | C L M A | C L M | L | L | L (son lot) |
| Affectations | C L M A | C L M | L (la sienne) | ❌ | L (la sienne) |
| Photos | C L M A | C L M A | C L | L (si publié) | C L (son lot) |
| Rapports | C L M A | C L M A | C L M (les siens) | L (si publié) | C L M (les siens) |
| Réserves | C L M A | C L M A | L M (si assigné) | L (si publié) | L M (si assigné) |
| Pointages | C L M A | C L M A | C L M (les siens) | ❌ | C L M (les siens) |
| Utilisateurs | C L M A | L | ❌ | ❌ | ❌ |
| Paramètres | C L M | ❌ | ❌ | ❌ | ❌ |

## Curation client

### ❌ Ce que le client ne doit JAMAIS voir

- Réserves nominatives ("X n'a pas fait son travail")
- Coûts, marges, budgets internes
- Pointages et heures de présence
- Photos brutes non validées
- Retards internes non communiqués
- Noms des sous-traitants défaillants

### ✅ Ce que le client peut voir (si `Visible_Client = Oui`)

- Avancement par lot en pourcentage
- Jalons atteints
- Sélection de photos validées par le conducteur
- Réserves **levées** uniquement
- Documents contractuels (plans, PV de réception)
- Bouton "Poser une question"

## Règle technique

`Visible_Client` est **désactivé par défaut** sur toute nouvelle photo,
réserve ou rapport. Le conducteur doit **activer manuellement** ce qu'il
veut publier. Geste de 2 secondes qui évite 90 % des problèmes.
