# Bulk data

```http
POST /kpi-indicators/bulk
Content-Type: application/json
```

La cle `replace_existing` permet de remplacer les KPI existants avant insertion.
Mettre `false` pour ajouter les KPI sans vider la collection.

Exemple :

```bash
curl -X POST http://localhost:5000/kpi-indicators/bulk \
  -H "Content-Type: application/json" \
  --data-binary @backend/requests/hydrogrow_2030_kpis_bulk_body.json
```

## Exemple de body

```json
{
  "replace_existing": true,
  "indicators": [
    {
      "name": "string",
      "family": "string",
      "service": "string",
      "objective": "string",
      "description": "string",
      "owner": "string",
      "source": "string",
      "frequency": "string",
      "unit": "string",
      "comparator": "string",
      "target_value": number,
      "observed_value": number,
      "period": "string",
      "trend": "string",
      "formula_type": "string",
      "formula_inputs": {},
      "is_sla": true,
      "sla_target": number,
      "criticality": "string",
      "action_plan": "string",
      "display_order": number
    },
  ]
}
```
