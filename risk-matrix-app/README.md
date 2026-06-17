# Sud ERP Tools

Application composee de plusieurs outils ERP. Le premier outil disponible est la matrice de risque.

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

## Theme clair / sombre

Le frontend propose un bouton de bascule de theme dans l'en-tete de `ERPToolsShell`.

Implementation :

- les couleurs sont centralisees dans les variables CSS de `frontend/src/index.css` ;
- le theme courant est applique via `data-theme="dark"` ou `data-theme="light"` sur la balise `<html>` ;
- le choix utilisateur est persiste dans `localStorage` avec la cle `sud-erp-theme` ;
- l'export PNG reprend automatiquement la palette du theme actif.
