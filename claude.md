# Cadrage produit — SaaS d'optimisation LinkedIn

Oct 23, 2026 · @Osé Maurel

## Vision et promesse

Un outil qui prend un profil LinkedIn ordinaire et le transforme en opportunités concrètes : un poste, des clients, des conversations.

Le produit couvre toute la chaîne, de l'audit du profil jusqu'au premier message envoyé à un contact. C'est ce qui le distingue : Taplio et Supergrow s'arrêtent à la production de contenu et ne font pas d'audit de profil ; les outils d'audit (Resume Worded et assimilés) s'arrêtent au score et n'enchaînent sur rien.

L'angle défendable tient en trois points :

- **La chaîne complète** — profil optimisé, puis contenu, puis mise en relation. Chaque étape donne envie de passer à la suivante.
- **Le français et le contexte africain** — les outils existants sont anglophones et pensés pour un marché B2B américain. Tutoiement, codes locaux, entreprises de la région.
- **L'audit actionnable** — pas un score, mais des réécritures prêtes à copier-coller.

## Cible et marché

Toute personne de l'Afrique francophone détentrice d'un profil LinkedIn — ou qui devrait en avoir un. Pas de segmentation du produit par métier.

L'objectif de l'utilisateur est une **donnée du profil**, pas un parcours séparé. Il change les recommandations produites à l'intérieur de chaque menu, jamais la structure de l'interface. Tout le monde voit la même plateforme complète.

Les trois objectifs :

1. **Décrocher un poste** — l'usage dominant de LinkedIn dans la région. C'est le cas prioritaire, celui qui doit être irréprochable.
2. **Trouver des clients** — freelances, consultants, prestataires.
3. **Développer sa visibilité** — personal branding, autorité sur un sujet.

Trois états de départ, tous pris en charge dans la même interface : profil existant à optimiser, profil vide ou presque, pas encore de compte LinkedIn. Pour les deux derniers, l'audit devient une génération : l'outil produit le profil complet, section par section, à copier sur LinkedIn.

Point de vigilance : l'usage LinkedIn reste concentré sur la recherche d'emploi et de stages dans la région, et le pouvoir d'achat limite l'abonnement mensuel. Cela oriente le ton du produit et son modèle de prix.

## Principe directeur : la simplicité

L'IA déduit, l'utilisateur corrige. C'est la règle qui tranche toutes les décisions d'interface.

Concrètement :

- **Ne jamais demander ce qu'on peut deviner.** Le profil donne déjà le métier, le secteur, le niveau d'expérience, le pays. On n'en redemande rien.
- **Pré-remplir plutôt que faire remplir.** L'utilisateur valide ou ajuste au lieu de saisir. Le coût mental est dix fois moindre.
- **Première valeur en moins de deux minutes.** Pas d'entretien long avant de voir quoi que ce soit.
- **Une action principale évidente par écran.** Si l'utilisateur hésite entre trois boutons, l'écran est raté.
- **Tout ce qui est optionnel est replié par défaut.** Visible ne veut pas dire ouvert.

### L'entretien progressif

Les questions de cadrage ne disparaissent pas : elles se déplacent. On en pose **une seule à la fois, au moment où elle sert**.

Exemple : l'audit tourne, et à l'endroit où il manque une information il affiche « Ta section About gagnerait un résultat chiffré. Tu as un chiffre à me donner ? ». L'utilisateur répond en une ligne, la recommandation se met à jour sous ses yeux. Le gain est immédiat, donc il répond.

Même logique partout : le Studio demande un détail quand il en a besoin, Mon réseau demande la cible quand on y arrive. Le profil s'enrichit par petites touches, jamais par formulaire.

## L'objet pivot : le Profil Stratégique

Tous les modules lisent et écrivent dans un seul objet central. Sans lui, chaque menu devient un outil isolé et l'utilisateur doit tout ressaisir partout.

Il contient quatre blocs :

| Bloc | Contenu | Source |
| --- | --- | --- |
| Données LinkedIn | Headline, about, expériences, formation, compétences | Import PDF ou saisie |
| Contexte | Offre ou métier visé, audience cible, objectif | Question d'entrée + enrichissement progressif |
| Preuves | Résultats chiffrés, réalisations, témoignages, cas clients | Questions posées au fil de l'usage |
| Voix | Ton, niveau de langage, tics d'écriture, interdits | Anciens posts collés, ou déduite |

Le profil LinkedIn donne le premier bloc. Les trois autres font la qualité de tout le reste, et c'est là que se situe le vrai différenciateur : aucun concurrent ne les capture.

Deux propriétés à tenir pendant la construction :

- **Il s'enrichit en continu.** Si l'utilisateur mentionne un résultat client dans le Studio, on le capture dans les preuves. Le profil s'améliore à l'usage sans effort dédié.
- **Il n'est jamais bloquant.** Un bloc vide dégrade la qualité des sorties, il n'empêche aucun module de fonctionner.

## Le premier passage

Trois choses demandées à l'entrée, puis l'audit. Rien d'autre avant.

1. **Son profil** — upload du PDF exporté depuis LinkedIn, ou collage section par section, ou saisie guidée s'il n'a pas de compte.
2. **Son objectif** — un clic parmi trois : décrocher un poste, trouver des clients, développer ma visibilité.
3. **Une question ouverte** — « En une ou deux phrases, qu'est-ce que tu cherches concrètement ? »

L'audit s'affiche. L'utilisateur voit son score, ses points faibles, et des réécritures qu'il peut copier immédiatement.

Tout le reste — preuves, voix, piliers de contenu, cible de prospection — se construit ensuite, au fil de l'usage, par questions ponctuelles placées là où elles servent.

## Les menus

Huit menus, identiques pour tous les utilisateurs. L'objectif déclaré change le contenu produit, pas la navigation.

| Menu | Ce qu'il fait | Lit | Écrit |
| --- | --- | --- | --- |
| Tableau de bord | Score et son évolution, état d'avancement, prochaine action suggérée (une seule), activité récente | Tout | Rien |
| Mon profil | Trois onglets — données LinkedIn, contexte, preuves. Indicateur de complétude. Entretien relançable | — | Profil Stratégique |
| Audit & optimisation | Score global et par bloc, diagnostic, réécritures prêtes à copier en 2-3 variantes, quick wins classés par impact, relance de l'audit après modification | Profil Stratégique | Versions optimisées |
| Stratégie de contenu | Positionnement en une phrase, audience, 3 à 5 piliers de contenu à valider ou ajuster | Profil Stratégique | Piliers |
| Plan éditorial | Calendrier 30/60/90 jours, vue calendrier et vue liste. Chaque créneau porte date, pilier, format, angle. Régénérable et déplaçable créneau par créneau | Piliers | Créneaux |
| Studio | Rédaction du post dans la voix de l'utilisateur, édition, puis visuel associé — carrousel ou image. Export ou brouillon | Profil, voix, créneau | Bibliothèque |
| Mon réseau | Définition de la cible, requêtes LinkedIn prêtes à coller, génération des messages d'approche, pipeline de suivi avec rappels | Profil, positionnement | Contacts, messages |
| Compte | Crédits ou abonnement, historique de paiement, réglages avancés repliés, suppression des données | — | Réglages |

### Précisions sur deux menus

**Audit & optimisation.** La règle est de ne jamais s'arrêter au diagnostic. Pas « votre headline est faible » mais la nouvelle headline, en trois variantes, avec un bouton copier. Pour un utilisateur sans profil, le même menu produit l'intégralité du profil à installer sur LinkedIn.

**Mon réseau.** Voir la section sur les contraintes LinkedIn : l'outil ne fournit pas de liste nominative de prospects, il fournit le ciblage, les requêtes qui produisent la liste, et les messages.

### Simplification à arbitrer

Fondre « Stratégie de contenu » dans « Plan éditorial » comme première étape. Huit menus au lieu de neuf, et personne ne va chercher « stratégie » dans une barre de navigation.

## Le système de voix

Trois niveaux, du plus automatique au plus ponctuel. C'est ce qui sépare un contenu reconnaissable d'un générateur banal.

### Niveau 1 — La voix apprise

Trois sources, par ordre de qualité :

1. **Des posts existants collés par l'utilisateur** — trois à cinq suffisent. Le plus puissant.
2. **Un échantillon d'écriture libre** — « Raconte en quelques lignes ce que tu fais et pourquoi », pour qui n'a jamais posté.
3. **Le profil lui-même** — about et expériences, en dernier recours.

On extrait une **fiche de voix structurée** une seule fois : longueur de phrase, tutoiement ou vouvoiement, structure des accroches, usage des émojis, niveau de langage, expressions récurrentes, façon de conclure. C'est elle qu'on réutilise à chaque génération — jamais les posts bruts, qui coûtent cher en contexte et poussent le modèle à recopier.

### Niveau 2 — Les réglages

Volontairement minimaux pour ne pas créer un écran de paramètres.

Visible dans le Studio : **trois boutons de ton** — Professionnel, Conversationnel, Direct. C'est tout. Tutoiement, émojis et longueur sont déduits des posts ou du ton choisi, jamais demandés.

Replié dans le Compte : instructions permanentes (« ne jamais commencer par une question », « toujours terminer par un appel à commenter ») et interdits (mots et tournures à bannir). Ces champs se remplissent surtout tout seuls, via la proposition d'enregistrement décrite ci-dessous.

### Niveau 3 — Les consignes ponctuelles

Un champ « consigne pour ce post » au moment de générer, qui s'applique une fois sans toucher aux réglages.

Et surtout un bouton **Affiner** après génération : l'utilisateur écrit en français ce qu'il veut changer — « trop corporate, rends ça plus direct » — et l'IA régénère. C'est le réglage universel, celui que tout le monde comprend sans explication.

Apprentissage implicite : après plusieurs corrections du même ordre, l'outil propose « On dirait que tu demandes souvent plus de concision. Je l'ajoute à tes réglages ? ». La voix se précise à l'usage, sans formulaire.

### Ordre de priorité

Consigne ponctuelle **>** réglages permanents **>** voix apprise. Le plus récent et le plus spécifique l'emporte toujours.

### Règle de non-blocage

Si l'utilisateur arrive au Studio sans rien avoir réglé, on génère quand même à partir du profil, avec une invitation discrète : « Ce post sonnerait plus comme toi si tu nous montrais trois de tes anciens posts. » Le gain est visible, donc il le fera.

## Interopération

&#91;embedded content: flux entre les menus · 8 modules, un objet pivot\]

Chaque module consomme la sortie du précédent, mais aucun ne bloque. Si l'utilisateur veut écrire un post sans plan éditorial, le Studio va chercher ses piliers directement. L'enchaînement guide, il n'emprisonne pas.

La flèche de retour est aussi importante que les autres : ce qui ressort du Studio et de Mon réseau enrichit le Profil Stratégique. Un résultat client mentionné au passage devient une preuve réutilisable partout ailleurs.

## Contraintes d'accès aux données LinkedIn

LinkedIn n'expose aucune API publique permettant de lire un profil tiers, et le scraping viole ses conditions d'utilisation. Plusieurs fournisseurs d'API de scraping ont fermé sous pression juridique ces dernières années. **Construire le produit sur un scraper tiers revient à accepter qu'il puisse s'arrêter du jour au lendemain.**

Le produit est donc conçu sans aucune dépendance à LinkedIn.

### Acquisition du profil utilisateur

| Voie | Principe | Statut |
| --- | --- | --- |
| Export PDF | L'utilisateur télécharge son propre profil depuis LinkedIn et l'upload. On parse | Retenue pour le MVP — légale, sans dépendance |
| Collage guidé | Formulaire où il colle headline, about, expériences | Retenue — repli immédiat |
| Saisie assistée | Pour qui n'a pas de compte : entretien, puis génération du profil | Retenue |
| Extension navigateur | Lit la page que l'utilisateur consulte lui-même | Zone grise — à envisager plus tard seulement |

### Conséquence sur Mon réseau

Impossible de produire une liste nominative de prospects. L'outil fait autrement, et mieux que ce que les gens font seuls :

1. **Ciblage** — à partir du Profil Stratégique : intitulés de poste, secteurs, tailles d'entreprise, pays. Pour l'emploi, des RH, recruteurs et managers du métier visé ; pour le freelance, des décideurs correspondant à l'offre.
2. **Requêtes prêtes à coller** — recherches LinkedIn construites avec les bons filtres et opérateurs booléens. L'utilisateur obtient sa liste lui-même, en un clic.
3. **Messages d'approche** — il colle le profil trouvé, l'outil génère la note de connexion (300 caractères maximum), le message de suivi et la relance, en croisant les deux profils.
4. **Suivi** — pipeline contacté / a répondu / en discussion / conclu, avec rappels de relance.

### Actif à construire

Un répertoire maison d'entreprises et de recruteurs actifs par pays (Bénin, Côte d'Ivoire, Sénégal, Togo) et par secteur. Long à bâtir, mais personne ne l'a, et ce serait l'élément le plus difficile à copier du produit.

## Monétisation

Système de crédits, pas d'abonnement. C'est ce qui fonctionne le mieux en Afrique francophone : le pouvoir d'achat rend l'engagement récurrent difficile à vendre, et l'usage est naturellement irrégulier — on optimise son profil, on cherche pendant quelques semaines, on s'arrête.

L'utilisateur recharge un pack de crédits. Chaque action en consomme un nombre connu d'avance. Crédits épuisés, il recharge et continue. Aucune échéance, aucun prélèvement automatique.

### Barème indicatif

Le coût en crédits doit suivre le coût réel de l'action, sinon la marge est imprévisible. Ordres de grandeur à calibrer avant le développement du module de paiement :

| Action | Coût relatif | Pourquoi |
| --- | --- | --- |
| Audit complet du profil | Élevé | Entrée longue, sortie longue, plusieurs blocs analysés |
| Réécriture d'un bloc | Faible | Sortie courte |
| Génération du profil complet (sans compte) | Élevé | Équivalent à l'audit plus la rédaction |
| Plan éditorial 30 jours | Moyen | Une sortie structurée, pas de texte long |
| Rédaction d'un post | Faible | Sortie courte |
| Carrousel | Très faible | Rendu HTML/CSS, aucune IA d'image |
| Image d'illustration | Élevé | L'appel le plus cher du produit |
| Message d'approche | Faible | Sortie très courte |

Trois règles pour tenir la marge : plafonner la longueur des sorties, mettre en cache ce qui se répète, et débiter les crédits **après** une génération réussie, jamais avant.

### Freemium — à trancher

L'option la plus solide : offrir quelques crédits à l'inscription plutôt qu'une version gratuite limitée. L'utilisateur peut lancer son audit, voir son score et une ou deux réécritures, puis se heurte au solde vide au moment précis où il a le plus envie de continuer. Plus simple à construire qu'un système de paliers, et plus efficace commercialement.

Encaissement par les processeurs mobile money déjà en place (MoneyFusion, Moneroo, PawaPay au nom de DIGITIPS CONSULTING), avec Stripe en réserve si le produit s'ouvre à l'international.

Questions ouvertes : le prix des packs, le nombre de crédits offerts à l'inscription, et le barème définitif action par action.

## Modèle de données

Seize tables réparties en quatre domaines. Toutes portent un `user_id` et sont protégées par RLS.

&#91;embedded content: domaines de données · 16 tables\]

### Identité et crédits

| Table | Rôle | Colonnes clés |
| --- | --- | --- |
| `profiles` | Extension de `auth.users` | `id`, `full_name`, `country`, `objective`, `credits_balance` |
| `credit_transactions` | Registre des mouvements de crédits | `user_id`, `delta`, `reason`, `ref_id`, `balance_after` |
| `payments` | Rechargements encaissés | `user_id`, `provider`, `provider_ref` (unique), `amount`, `credits`, `status` |
| `generations` | Trace de chaque appel IA | `user_id`, `kind`, `status`, `cost_credits`, `tokens_in`, `tokens_out` |

### Profil Stratégique

| Table | Rôle | Colonnes clés |
| --- | --- | --- |
| `strategic_profiles` | Une ligne par utilisateur — le pivot | `user_id` (PK), `headline`, `about`, `offer`, `target_audience`, `voice` (jsonb), `raw_source`, `completeness` |
| `experiences` | Postes et missions | `user_id`, `title`, `company`, `start_date`, `end_date`, `description`, `position` |
| `proofs` | Résultats, réalisations, témoignages | `user_id`, `label`, `value`, `context`, `source` |
| `audits` | Historique des audits, pour montrer la progression | `user_id`, `score_global`, `scores` (jsonb), `created_at` |
| `audit_suggestions` | Réécritures proposées | `audit_id`, `block`, `variant_index`, `content`, `impact`, `applied` |

### Contenu

| Table | Rôle | Colonnes clés |
| --- | --- | --- |
| `content_pillars` | Les 3 à 5 piliers validés | `user_id`, `name`, `description`, `position` |
| `content_plans` | Un plan 30/60/90 | `user_id`, `horizon`, `start_date` |
| `plan_slots` | Un créneau du calendrier | `plan_id`, `scheduled_date`, `pillar_id`, `format`, `angle`, `status`, `post_id` |
| `posts` | Contenu rédigé | `user_id`, `slot_id`, `pillar_id`, `body`, `tone`, `status` |
| `assets` | Carrousels et images générés | `user_id`, `post_id`, `kind`, `storage_path`, `meta` |

### Mon réseau

| Table | Rôle | Colonnes clés |
| --- | --- | --- |
| `targets` | Ciblage déduit du profil | `user_id`, `job_titles`, `sectors`, `countries`, `company_sizes`, `saved_queries` |
| `contacts` | Personnes trouvées et suivies | `user_id`, `full_name`, `headline`, `company`, `profile_url`, `status`, `next_followup_at` |
| `contact_messages` | Note de connexion, suivi, relance | `contact_id`, `kind`, `body`, `sent_at` |

### Règles de sécurité

Ce sont les points sur lesquels une erreur coûte de l'argent réel.

- **RLS activée partout**, politique `auth.uid() = user_id` sur chaque table.
- **`credit_transactions`, `payments` et `generations` sont en lecture seule côté client.** L'écriture est réservée au service role, depuis les Edge Functions. Sans cela, n'importe qui se crédite lui-même.
- **`credits_balance` n'est jamais modifiable directement.** Il est recalculé par un trigger sur le registre, qui reste la source de vérité.
- **Le débit intervient après succès.** On insère la ligne `generations` avant l'appel IA, et on ne débite qu'au passage au statut `success`. Un appel qui échoue ne coûte rien à l'utilisateur.
- **Buckets Storage privés** — `uploads` pour les PDF importés, `assets` pour les visuels. Accès par URL signée uniquement.
- **Webhooks de paiement vérifiés par signature**, avec `provider_ref` en contrainte unique pour l'idempotence. Un webhook rejoué ne doit jamais créditer deux fois.

Les champs à valeurs fermées (`objective`, `status`, `format`, `kind`, `reason`, `impact`) sont des enums Postgres, pas du texte libre.

## Périmètre

Le MVP doit prouver une seule chose : qu'un utilisateur accepte de payer pour voir son profil transformé. Tout ce qui ne sert pas cette preuve attend.

**MVP**

- Inscription et les trois questions d'entrée
- Capture du profil : upload PDF et collage guidé
- Audit complet avec réécritures prêtes à copier
- Mon profil : les trois onglets, alimentés progressivement
- Paiement et crédits
- Tableau de bord minimal

**Version 2**

- Stratégie de contenu et plan éditorial
- Studio : rédaction de posts et système de voix
- Bibliothèque

**Version 3**

- Mon réseau : ciblage, requêtes, messages d'approche, pipeline
- Génération de visuels (carrousels et images)
- Répertoire maison d'entreprises et de recruteurs

Le parcours sans compte LinkedIn (génération complète du profil) peut arriver dès le MVP : il réutilise le même moteur que l'audit et élargit nettement le marché adressable.

**Pas de landing page au début.** Tout l'effort va à l'interface et aux fonctionnalités. La page de vente se construit à la fin, une fois le produit stabilisé et son argumentaire éprouvé sur de vrais utilisateurs.

### Prochaine étape

Écrire les migrations SQL : enums, tables, politiques RLS, trigger de solde et contrainte d'idempotence sur les paiements.
