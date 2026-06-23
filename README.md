# Sud ERP Tools

Application composee de plusieurs outils ERP : matrice de risque et budget & arbitrage.

## Lancement Docker

```bash
docker compose up --build
```

La gateway expose l'application sur `http://localhost:80`.

Routage Docker :

- `http://localhost:80/` est redirige vers le frontend.
- `http://localhost:80/api` et `http://localhost:80/api/*` sont rediriges vers le backend FastAPI.
- Le frontend appelle l'API via le chemin relatif `/api`.

## Lancement developpement frontend

```bash
cd frontend
npm install
npm run dev
```

Le serveur Vite proxy les appels `/api/*` vers `http://localhost:8000/*`.

## Ajouter un ERP tool

1. Creer un composant dans `frontend/src/tools/<nom-outil>/<NomOutil>.jsx`.
2. Importer ce composant dans `frontend/src/tools/erpTools.js`.
3. Ajouter une entree dans le tableau `erpTools` :

```js
{
  id: 'mon-outil',
  title: 'Mon outil',
  shortTitle: 'Mon outil',
  description: 'Description courte de l outil.',
  component: MonOutil
}
```

La navigation est generee automatiquement par `ERPToolsShell`.


## Outil Budget & Arbitrage

L outil `Budget & Arbitrage` permet de gerer un portefeuille de projets IT dans une enveloppe budgetaire contrainte. Il s appuie sur les notions du cours : CAPEX/OPEX, TCO, ROI, projets non negociables, grille de scoring multicriteres et arbitrage sous contrainte.

Fonctions disponibles :

- CRUD complet des projets budgetaires dans la collection MongoDB `budget_projects` ;
- CRUD RH dans la collection MongoDB `budget_employees` : employe, role, equipe, heures/semaine, taux horaire, ETP, charges patronales, prime et allocation projet ;
- CRUD licences et abonnements dans la collection MongoDB `budget_expenses` : licence ponctuelle, mensuelle, annuelle, abonnement logiciel, hebergement, cloud, prestataire, maintenance ;
- contexte financier persistant : budget disponible, chiffre d affaires annuel, couts annuels actuels, tresorerie, rentrees mensuelles, couts mensuels, date cible, marge de securite, reserve minimale et seuil cout projet / CA ;
- calcul automatique du TCO, du ROI, du payback, du cout RH annuel charge, du cout recurrent des licences et du cout ponctuel ;
- calcul d autorisation automatique par projet selon TCO / chiffre d affaires, ROI, payback et caractere non negociable ;
- scoring /20 sur valeur metier, risque reduit, ROI estime et complexite inverse ;
- suivi des decisions : a arbitrer, a financer, reporte, rejete ;
- visualisations : ROI portefeuille, camembert des couts annuels, marge operationnelle et projection de cash ;
- mini algo de budget futur : projette la capacite de financement a une date cible selon les rentrees d argent, les couts courants, la tresorerie, la croissance et la marge de securite ;
- bouton pour charger un cas pratique enrichi avec MFA, EDR, ERP, Migration Azure, SIEM, Site web, RH et abonnements exemples.

Endpoints backend projets :

- `GET /budget-projects/`
- `POST /budget-projects/`
- `GET /budget-projects/{id}`
- `PUT /budget-projects/{id}`
- `DELETE /budget-projects/{id}`

Endpoints backend RH :

- `GET /budget-employees/`
- `POST /budget-employees/`
- `GET /budget-employees/{id}`
- `PUT /budget-employees/{id}`
- `DELETE /budget-employees/{id}`

Endpoints backend licences et abonnements :

- `GET /budget-expenses/`
- `POST /budget-expenses/`
- `GET /budget-expenses/{id}`
- `PUT /budget-expenses/{id}`
- `DELETE /budget-expenses/{id}`

## Theme clair / sombre

Le frontend propose un bouton de bascule de theme dans l'en-tete de `ERPToolsShell`.

Implementation :

- les couleurs sont centralisees dans les variables CSS de `frontend/src/index.css` ;
- le theme courant est applique via `data-theme="dark"` ou `data-theme="light"` sur la balise `<html>` ;
- le choix utilisateur est persiste dans `localStorage` avec la cle `sud-erp-theme` ;
- l'export PNG reprend automatiquement la palette du theme actif.
