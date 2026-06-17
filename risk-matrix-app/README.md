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
