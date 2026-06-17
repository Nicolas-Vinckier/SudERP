# Frontend Sud ERP Tools

Frontend React/Vite de l'application Sud ERP Tools.

## Scripts

```bash
npm install
npm run dev
npm run lint
npm run build
```

## API

Par defaut, le frontend appelle l'API via `/api`.

- En Docker, la gateway Nginx route `/api` vers le backend.
- En developpement local, Vite proxy `/api/*` vers `http://localhost:8000/*`.
- La variable `VITE_API_BASE_URL` permet de surcharger le chemin API si necessaire.

## Ajouter un ERP tool

Les outils sont declares dans `src/tools/erpTools.js`. Ajouter un nouveau composant outil puis l'enregistrer dans ce tableau pour l'afficher dans la navigation.
