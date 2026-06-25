export const courseToolConfigs = {
  'strategy-pilotage': {
    id: 'strategy-pilotage',
    title: 'Pilotage de la strategie du SI',
    shortTitle: 'Pilotage strategie',
    block: 'Bloc 1',
    description: 'Role du SI, alignement business, composants et decisions DSI.',
    intro: 'Structure le SI comme un levier de strategie, pas comme une simple liste technique.',
    contextFields: [
      { name: 'company_context', label: 'Contexte organisationnel', placeholder: 'Activite, taille, sites, enjeux de croissance...' },
      { name: 'si_role', label: 'Role du SI', placeholder: 'Collecter, stocker, traiter et diffuser l information utile...' },
      { name: 'business_alignment', label: 'Alignement metier', placeholder: 'Objectifs business servis par le SI : croissance, productivite, qualite...' },
      { name: 'dsi_positioning', label: 'Posture DSI', placeholder: 'Valeur, risques, couts, dependances et trajectoire strategique...' }
    ],
    collections: [
      {
        name: 'components',
        title: 'Composants du SI',
        description: 'Les 5 briques fondamentales : utilisateurs, applications, donnees, infrastructure, regles et processus.',
        fields: [
          { name: 'name', label: 'Nom', required: true, placeholder: 'ERPNext, donnees agronomiques, utilisateurs support...' },
          { name: 'category', label: 'Categorie', type: 'select', options: ['Utilisateurs', 'Applications', 'Donnees', 'Infrastructure', 'Regles & Processus'] },
          { name: 'role', label: 'Role dans le SI', type: 'textarea' },
          { name: 'business_value', label: 'Valeur metier', type: 'select', options: ['Faible', 'Moyenne', 'Elevee', 'Critique'] },
          { name: 'risk_level', label: 'Niveau de risque', type: 'select', options: ['Faible', 'Moyen', 'Eleve', 'Critique'] },
          { name: 'owner', label: 'Responsable' }
        ],
        summaryFields: ['category', 'business_value', 'risk_level', 'owner']
      },
      {
        name: 'axes',
        title: 'Axes strategiques SI',
        description: 'Traduction des objectifs metier en contribution SI mesurable.',
        fields: [
          { name: 'name', label: 'Axe', required: true, placeholder: 'Resilience SI, croissance internationale, automatisation...' },
          { name: 'business_goal', label: 'Objectif metier', type: 'textarea' },
          { name: 'si_contribution', label: 'Contribution du SI', type: 'textarea' },
          { name: 'priority', label: 'Priorite', type: 'select', options: ['Basse', 'Moyenne', 'Haute', 'Critique'] },
          { name: 'kpi', label: 'KPI associe' },
          { name: 'owner', label: 'Sponsor' }
        ],
        summaryFields: ['priority', 'kpi', 'owner']
      },
      {
        name: 'decisions',
        title: 'Decisions DSI',
        description: 'Arbitrages structurants entre strategie, risques, couts et valeur.',
        fields: [
          { name: 'name', label: 'Decision', required: true },
          { name: 'rationale', label: 'Justification', type: 'textarea' },
          { name: 'impact', label: 'Impact attendu', type: 'textarea' },
          { name: 'horizon', label: 'Horizon', type: 'select', options: ['Court terme', 'Moyen terme', 'Long terme'] },
          { name: 'status', label: 'Statut', type: 'select', options: ['A cadrer', 'Validee', 'En cours', 'A arbitrer'] }
        ],
        summaryFields: ['horizon', 'status']
      }
    ]
  },
  'si-cartography': {
    id: 'si-cartography',
    title: 'Cartographie et architecture du SI',
    shortTitle: 'Cartographie SI',
    block: 'Bloc 2',
    description: 'Applications, flux, donnees, infrastructure et dependances critiques.',
    intro: 'Produit une cartographie exploitable par un DSI : lisible, structuree et orientee dependances.',
    contextFields: [
      { name: 'scope', label: 'Perimetre cartographie', placeholder: 'Sites, entites, processus et applications couverts...' },
      { name: 'architecture_summary', label: 'Synthese architecture', placeholder: 'On-premise, SaaS, cloud, reseau, bases de donnees...' },
      { name: 'security_zones', label: 'Zones de confiance et securite', placeholder: 'Interne, DMZ, IoT, acces VPN, donnees sensibles...' },
      { name: 'spof_summary', label: 'SPOF et dependances critiques', placeholder: 'Composants dont la panne bloque un service critique...' }
    ],
    collections: [
      {
        name: 'applications',
        title: 'Applications',
        description: 'Vue applicative : qui fait quoi dans le SI.',
        fields: [
          { name: 'name', label: 'Application', required: true, placeholder: 'ERPNext, Dolibarr, Metabase...' },
          { name: 'type', label: 'Type', type: 'select', options: ['ERP', 'Finance', 'BI', 'Collaboration', 'Securite', 'Infrastructure', 'IoT', 'Autre'] },
          { name: 'role', label: 'Role fonctionnel', type: 'textarea' },
          { name: 'hosting', label: 'Hebergement', type: 'select', options: ['On-premise', 'Cloud', 'SaaS', 'Hybride'] },
          { name: 'data', label: 'Donnees traitees' },
          { name: 'criticality', label: 'Criticite', type: 'select', options: ['Faible', 'Moyenne', 'Elevee', 'Critique'] },
          { name: 'owner', label: 'Proprietaire' }
        ],
        summaryFields: ['type', 'hosting', 'criticality', 'owner']
      },
      {
        name: 'flows',
        title: 'Flux de donnees',
        description: 'Flux orientes entre applications, API, bases et utilisateurs.',
        fields: [
          { name: 'name', label: 'Nom du flux', required: true, placeholder: 'ERPNext vers Dolibarr' },
          { name: 'source', label: 'Source' },
          { name: 'target', label: 'Cible' },
          { name: 'data', label: 'Donnees echangees' },
          { name: 'protocol', label: 'Protocole / methode', placeholder: 'API, batch, CSV, SQL, webhook...' },
          { name: 'frequency', label: 'Frequence', type: 'select', options: ['Temps reel', 'Horaire', 'Quotidienne', 'Hebdomadaire', 'Mensuelle'] },
          { name: 'security', label: 'Securite du flux', type: 'select', options: ['Chiffre', 'A renforcer', 'Non documente'] }
        ],
        summaryFields: ['source', 'target', 'frequency', 'security']
      },
      {
        name: 'dependencies',
        title: 'Dependances et SPOF',
        description: 'Composants critiques dont la defaillance provoque un effet cascade.',
        fields: [
          { name: 'name', label: 'Composant critique', required: true },
          { name: 'depends_on', label: 'Depend de' },
          { name: 'impact', label: 'Impact en cas de panne', type: 'textarea' },
          { name: 'spof', label: 'SPOF', type: 'select', options: ['Oui', 'Non', 'A verifier'] },
          { name: 'mitigation', label: 'Mitigation', type: 'textarea' },
          { name: 'criticality', label: 'Criticite', type: 'select', options: ['Faible', 'Moyenne', 'Elevee', 'Critique'] }
        ],
        summaryFields: ['depends_on', 'spof', 'criticality']
      }
    ]
  },
  'si-diagnostic': {
    id: 'si-diagnostic',
    title: 'Diagnostic strategique du SI',
    shortTitle: 'Diagnostic SI',
    block: 'Bloc 3',
    description: 'Evaluation du SI, SWOT, dette technique et recommandations DSI.',
    intro: 'Transforme la cartographie en diagnostic actionnable : constats, scores, priorites et recommandations.',
    contextFields: [
      { name: 'diagnostic_scope', label: 'Perimetre du diagnostic', placeholder: 'Applications, infrastructure, securite, couts, usages...' },
      { name: 'executive_summary', label: 'Synthese executive', placeholder: 'Le SI soutient-il la strategie ou la freine-t-il ?' },
      { name: 'main_alerts', label: 'Signaux d alerte', placeholder: 'Incidents, dette technique, dependances, shadow IT...' },
      { name: 'decision_guidance', label: 'Orientation de decision', placeholder: 'Priorites proposees au DSI/CODIR...' }
    ],
    collections: [
      {
        name: 'assessments',
        title: 'Evaluation 7 dimensions',
        description: 'Performance, securite, couts, agilite, dette technique, dependances, shadow IT.',
        fields: [
          { name: 'name', label: 'Dimension', required: true, type: 'select', options: ['Performance', 'Securite', 'Couts', 'Agilite', 'Dette technique', 'Dependances fournisseurs', 'Shadow IT'] },
          { name: 'score', label: 'Score /5', type: 'number', min: 1, max: 5 },
          { name: 'finding', label: 'Constat', type: 'textarea' },
          { name: 'evidence', label: 'Elements observes', type: 'textarea' },
          { name: 'recommendation', label: 'Recommandation', type: 'textarea' },
          { name: 'priority', label: 'Priorite', type: 'select', options: ['Basse', 'Moyenne', 'Haute', 'Critique'] }
        ],
        summaryFields: ['score', 'priority']
      },
      {
        name: 'swot',
        title: 'Matrice SWOT SI',
        description: 'Forces, faiblesses, opportunites et menaces du SI.',
        fields: [
          { name: 'name', label: 'Element SWOT', required: true },
          { name: 'quadrant', label: 'Quadrant', type: 'select', options: ['Force', 'Faiblesse', 'Opportunite', 'Menace'] },
          { name: 'description', label: 'Description', type: 'textarea' },
          { name: 'impact', label: 'Impact', type: 'select', options: ['Faible', 'Moyen', 'Eleve', 'Critique'] },
          { name: 'action', label: 'Action recommandee', type: 'textarea' }
        ],
        summaryFields: ['quadrant', 'impact']
      },
      {
        name: 'recommendations',
        title: 'Recommandations DSI',
        description: 'Actions issues du diagnostic et transformables en roadmap.',
        fields: [
          { name: 'name', label: 'Recommandation', required: true },
          { name: 'rationale', label: 'Justification', type: 'textarea' },
          { name: 'expected_benefit', label: 'Benefice attendu', type: 'textarea' },
          { name: 'priority', label: 'Priorite', type: 'select', options: ['Basse', 'Moyenne', 'Haute', 'Critique'] },
          { name: 'owner', label: 'Responsable' },
          { name: 'horizon', label: 'Horizon', type: 'select', options: ['0-6 mois', '6-18 mois', '18-36 mois'] }
        ],
        summaryFields: ['priority', 'owner', 'horizon']
      }
    ]
  },
  'si-governance': {
    id: 'si-governance',
    title: 'Gouvernance du SI',
    shortTitle: 'Gouvernance SI',
    block: 'Bloc 4',
    description: 'Acteurs, comites, RACI, arbitrages et mecanismes de decision.',
    intro: 'Clarifie qui decide, qui execute, qui valide et comment le SI reste aligne avec les objectifs metier.',
    contextFields: [
      { name: 'governance_principles', label: 'Principes de gouvernance', placeholder: 'Alignement business/IT, creation de valeur, maitrise des risques...' },
      { name: 'decision_model', label: 'Modele de decision', placeholder: 'Comites, seuils budgétaires, arbitrage CODIR...' },
      { name: 'escalation_rules', label: 'Regles d escalade', placeholder: 'Operationnel -> pilotage -> strategique...' },
      { name: 'reporting_model', label: 'Reporting et controle', placeholder: 'KPI, risques, budgets, avancement roadmap...' }
    ],
    collections: [
      {
        name: 'actors',
        title: 'Acteurs de gouvernance',
        description: 'CEO, CFO, DSI, RSSI, metiers et leurs logiques de decision.',
        fields: [
          { name: 'name', label: 'Acteur', required: true, placeholder: 'CEO, CFO, DSI, RSSI...' },
          { name: 'role', label: 'Role dans la gouvernance', type: 'textarea' },
          { name: 'expectations', label: 'Attentes principales', type: 'textarea' },
          { name: 'decision_power', label: 'Pouvoir de decision', type: 'select', options: ['Decision finale', 'Validation budget', 'Visa securite', 'Responsable execution', 'Consultatif', 'Informe'] },
          { name: 'kpi', label: 'Indicateur suivi' }
        ],
        summaryFields: ['decision_power', 'kpi']
      },
      {
        name: 'committees',
        title: 'Comites SI',
        description: 'Instances operationnelles, tactiques et strategiques.',
        fields: [
          { name: 'name', label: 'Comite', required: true },
          { name: 'level', label: 'Niveau', type: 'select', options: ['Operationnel', 'Pilotage', 'Strategique'] },
          { name: 'frequency', label: 'Frequence', type: 'select', options: ['Hebdomadaire', 'Mensuelle', 'Trimestrielle', 'Semestrielle'] },
          { name: 'participants', label: 'Participants' },
          { name: 'scope', label: 'Perimetre de decision', type: 'textarea' },
          { name: 'outputs', label: 'Livrables / decisions', type: 'textarea' }
        ],
        summaryFields: ['level', 'frequency', 'participants']
      },
      {
        name: 'raci',
        title: 'Matrice RACI',
        description: 'Clarification des responsabilites sur les decisions et actions SI.',
        fields: [
          { name: 'name', label: 'Action / decision', required: true },
          { name: 'responsible', label: 'R - Responsible' },
          { name: 'accountable', label: 'A - Accountable' },
          { name: 'consulted', label: 'C - Consulted' },
          { name: 'informed', label: 'I - Informed' }
        ],
        summaryFields: ['responsible', 'accountable']
      },
      {
        name: 'decisions',
        title: 'Arbitrages de gouvernance',
        description: 'Historique et justification des decisions IT structurantes.',
        fields: [
          { name: 'name', label: 'Decision', required: true },
          { name: 'status', label: 'Statut', type: 'select', options: ['Proposee', 'Validee', 'Reportee', 'Refusee'] },
          { name: 'budget', label: 'Budget concerne', type: 'number' },
          { name: 'rationale', label: 'Justification', type: 'textarea' },
          { name: 'risk_accepted', label: 'Risque accepte si report', type: 'textarea' },
          { name: 'next_review', label: 'Prochaine revue' }
        ],
        summaryFields: ['status', 'budget', 'next_review']
      }
    ]
  }
};
