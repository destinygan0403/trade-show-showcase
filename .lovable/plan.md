
# Plan — App de trading pilotée par un admin

On passe de la démo locale à une vraie app multi-utilisateurs avec un espace admin qui contrôle tout. On active Lovable Cloud (base + auth + emails).

## 1. Auth & rôles
- Login email/password (Lovable Cloud). Pages `/auth` (sign-in / sign-up) et `/reset-password`.
- Table `profiles` (nom, email de notif, solde, devise, account_id, statut) auto-créée via trigger à l'inscription.
- Table `user_roles` + enum `app_role` (`admin`, `user`) + fonction `has_role()` (pattern sécurisé, pas de rôle sur le profile).
- Layout protégé `_authenticated/` pour l'app trading, `_authenticated/_admin/` pour l'admin.
- Le tout premier compte créé devient admin (via trigger sur `auth.users`), les suivants sont `user`.

## 2. Dashboard utilisateur (existant, branché sur la DB)
- Le store local actuel est remplacé par des lectures Supabase RLS (`profiles`, `positions`, `transactions`).
- Le "secret menu" 5-taps est supprimé (remplacé par l'admin).
- L'utilisateur voit : solde, equity, P/L total, ses positions ouvertes/closes, historique dépôts/retraits.

## 3. Prises de position (pilotées par le graphe + admin)
- L'utilisateur ouvre une position depuis l'onglet Trade : symbole, sens (Buy/Sell), lot, prix d'entrée = dernier prix du ticker XAU/USD.
- La position est créée avec statut `pending_admin_decision` et un **verdict** que l'admin choisit :
  - `auto` (P/L suit vraiment le marché simulé),
  - `force_win` avec montant cible,
  - `force_loss` avec montant cible,
  - `force_close_at` (prix cible).
- Un ticker serveur simulé (ou côté client validé) fait évoluer le `current_price`. Quand l'utilisateur clôture (ou l'admin), le P/L final respecte le verdict : si `force_win`, on ajuste le prix de clôture pour atteindre le gain demandé ; sinon on prend le P/L marché.
- Email "position ouverte" et "position clôturée" envoyés au user + à l'email de notif admin.

## 4. Recharges & retraits
Workflow standard des apps de trading :
- User crée une **demande de dépôt** : méthode (Virement bancaire / Carte / Crypto BTC-USDT), montant, devise.
  - Virement : on affiche un IBAN configuré dans l'admin, user colle une référence de virement.
  - Carte : formulaire visuel (numéro masqué), statut "en vérification".
  - Crypto : on affiche une adresse wallet BTC/USDT configurée dans l'admin, user colle le hash de transaction.
- User crée une **demande de retrait** : méthode + destination (IBAN / carte / wallet), montant.
- Statuts : `pending` → `approved` / `rejected` (par l'admin). À l'approbation, le solde de `profiles` bouge automatiquement.
- Emails à chaque changement de statut au user + à l'email admin de notif.

## 5. Espace Admin (`/admin`)
Onglets :
- **Utilisateurs** : liste, recherche, éditer nom affiché, email, solde, P/L total, statut, changer mot de passe (via Admin API), promouvoir/rétrograder admin.
- **Positions** : voir toutes les positions, définir le verdict (auto / force win / force loss + montant), forcer la clôture d'une position.
- **Transactions** : liste des demandes de dépôt/retrait avec preuve/hash, boutons Approuver / Rejeter + note interne. Approuver = mouvement de solde automatique.
- **Paramètres** : email destinataire de toutes les notifs (par défaut = email de l'admin), IBAN de dépôt, adresse BTC, adresse USDT, nom de la marque affiché.
- **Notifications** : bouton "envoyer une notif" (in-app + email) à un user.

Toutes les actions admin passent par des `createServerFn` avec middleware `requireSupabaseAuth` + check `has_role(admin)` avant d'utiliser `supabaseAdmin`.

## 6. Emails (Lovable Emails)
Prérequis : configurer un domaine d'envoi (l'utilisateur devra brancher son domaine — bouton dédié).
Templates transactionnels :
- Bienvenue / vérification à l'inscription.
- Connexion réussie / changement de mot de passe.
- Dépôt reçu / approuvé / rejeté.
- Retrait demandé / approuvé / rejeté.
- Position ouverte / clôturée (avec P/L).
- Notification manuelle envoyée par l'admin.
Chaque email part vers le user ET vers l'email admin de notif configuré.

## 7. Ordre d'implémentation
1. Activer Lovable Cloud, créer les tables (`profiles`, `user_roles`, `app_settings`, `positions`, `transactions`) avec RLS + GRANTs + trigger auto-profile + trigger premier admin.
2. Pages auth + gate `_authenticated` + gate `_admin`.
3. Refonte du dashboard user branchée DB (remplace le store local).
4. Flow ouverture/clôture de positions avec verdicts admin.
5. Flow dépôt/retrait + validation admin.
6. Espace admin complet.
7. Setup domaine email + scaffolding templates + branchement sur chaque événement.

## Notes techniques (peuvent être ignorées)
- `positions.verdict` : enum (`auto`, `force_win`, `force_loss`).
- Prix de clôture recalculé côté serveur pour matcher le P/L cible quand verdict forcé, pour rester cohérent avec le graphe.
- Le ticker XAU/USD reste simulé côté client mais le P/L "officiel" est calculé serveur à la clôture.
- Pas de vrai paiement — les recharges/retraits sont purement déclaratifs + validation admin.
- Aucun texte "démo" ou "fictif" dans l'UI, comme demandé.
