from pydantic import BaseModel, Field
from typing import Optional


class RiskSchema(BaseModel):
    description: str = Field(...)
    probability: int = Field(
        ..., ge=1, le=5, description="Probability score from 1 to 5"
    )
    impact: int = Field(..., ge=1, le=5, description="Impact score from 1 to 5")
    cia_pillar: str = Field(
        ..., description="Confidentiality, Integrity, or Availability"
    )
    mitigation: str = Field(...)

    class Config:
        json_schema_extra = {
            "example": {
                "description": "Unauthorized access to database",
                "probability": 3,
                "impact": 5,
                "cia_pillar": "Confidentiality",
                "mitigation": "Implement role-based access control and MFA.",
            }
        }


class UpdateRiskModel(BaseModel):
    description: Optional[str] = None
    probability: Optional[int] = Field(None, ge=1, le=5)
    impact: Optional[int] = Field(None, ge=1, le=5)
    cia_pillar: Optional[str] = None
    mitigation: Optional[str] = None


class BudgetProjectSchema(BaseModel):
    name: str = Field(..., min_length=1)
    description: str = Field(..., min_length=1)
    category: str = Field(default="Infrastructure")
    budget_type: str = Field(default="CAPEX")
    requested_budget: float = Field(
        ..., ge=0, description="Amount requested from the current budget envelope"
    )
    capex_amount: float = Field(default=0, ge=0)
    opex_amount_annual: float = Field(default=0, ge=0)
    hidden_costs: float = Field(default=0, ge=0)
    expected_gain_annual: float = Field(default=0, ge=0)
    roi_horizon_years: int = Field(default=3, ge=1, le=10)
    business_value: int = Field(..., ge=1, le=5)
    risk_reduction: int = Field(..., ge=1, le=5)
    roi_score: int = Field(..., ge=1, le=5)
    complexity_score: int = Field(
        ...,
        ge=1,
        le=5,
        description="Inverse complexity score: 5 means easy, 1 means complex",
    )
    is_mandatory: bool = Field(default=False)
    decision: str = Field(default="a_arbitrer")
    justification: str = Field(default="")
    accepted_risk: str = Field(default="")

    class Config:
        json_schema_extra = {
            "example": {
                "name": "MFA",
                "description": "Deploy multi-factor authentication for all remote accesses.",
                "category": "Security",
                "budget_type": "OPEX",
                "requested_budget": 30000,
                "capex_amount": 0,
                "opex_amount_annual": 30000,
                "hidden_costs": 0,
                "expected_gain_annual": 0,
                "roi_horizon_years": 3,
                "business_value": 3,
                "risk_reduction": 5,
                "roi_score": 3,
                "complexity_score": 5,
                "is_mandatory": True,
                "decision": "a_financer",
                "justification": "Cyber insurance prerequisite and strong risk reduction.",
                "accepted_risk": "Higher exposure to account compromise if postponed.",
            }
        }


class UpdateBudgetProjectModel(BaseModel):
    name: Optional[str] = Field(None, min_length=1)
    description: Optional[str] = Field(None, min_length=1)
    category: Optional[str] = None
    budget_type: Optional[str] = None
    requested_budget: Optional[float] = Field(None, ge=0)
    capex_amount: Optional[float] = Field(None, ge=0)
    opex_amount_annual: Optional[float] = Field(None, ge=0)
    hidden_costs: Optional[float] = Field(None, ge=0)
    expected_gain_annual: Optional[float] = Field(None, ge=0)
    roi_horizon_years: Optional[int] = Field(None, ge=1, le=10)
    business_value: Optional[int] = Field(None, ge=1, le=5)
    risk_reduction: Optional[int] = Field(None, ge=1, le=5)
    roi_score: Optional[int] = Field(None, ge=1, le=5)
    complexity_score: Optional[int] = Field(None, ge=1, le=5)
    is_mandatory: Optional[bool] = None
    decision: Optional[str] = None
    justification: Optional[str] = None
    accepted_risk: Optional[str] = None


class BudgetEmployeeSchema(BaseModel):
    full_name: str = Field(..., min_length=1)
    role: str = Field(default="Equipe IT")
    department: str = Field(default="DSI")
    weekly_hours: float = Field(default=35, ge=0, le=80)
    hourly_rate: float = Field(default=0, ge=0)
    workload_rate: float = Field(default=1, ge=0, le=1)
    employer_charge_rate: float = Field(default=0.45, ge=0, le=3)
    annual_bonus: float = Field(default=0, ge=0)
    project_allocation_rate: float = Field(default=1, ge=0, le=1)
    start_date: str = Field(default="")
    end_date: str = Field(default="")
    notes: str = Field(default="")


class UpdateBudgetEmployeeModel(BaseModel):
    full_name: Optional[str] = Field(None, min_length=1)
    role: Optional[str] = None
    department: Optional[str] = None
    weekly_hours: Optional[float] = Field(None, ge=0, le=80)
    hourly_rate: Optional[float] = Field(None, ge=0)
    workload_rate: Optional[float] = Field(None, ge=0, le=1)
    employer_charge_rate: Optional[float] = Field(None, ge=0, le=3)
    annual_bonus: Optional[float] = Field(None, ge=0)
    project_allocation_rate: Optional[float] = Field(None, ge=0, le=1)
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    notes: Optional[str] = None


class BudgetExpenseSchema(BaseModel):
    name: str = Field(..., min_length=1)
    expense_type: str = Field(default="Logiciel")
    billing_frequency: str = Field(default="monthly")
    unit_cost: float = Field(default=0, ge=0)
    quantity: float = Field(default=1, ge=0)
    start_date: str = Field(default="")
    end_date: str = Field(default="")
    owner: str = Field(default="")
    vendor: str = Field(default="")
    is_critical: bool = Field(default=False)
    notes: str = Field(default="")


class UpdateBudgetExpenseModel(BaseModel):
    name: Optional[str] = Field(None, min_length=1)
    expense_type: Optional[str] = None
    billing_frequency: Optional[str] = None
    unit_cost: Optional[float] = Field(None, ge=0)
    quantity: Optional[float] = Field(None, ge=0)
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    owner: Optional[str] = None
    vendor: Optional[str] = None
    is_critical: Optional[bool] = None
    notes: Optional[str] = None


class BudgetSettingsSchema(BaseModel):
    available_budget: float = Field(default=500000, ge=0)
    annual_revenue: float = Field(default=2500000, ge=0)
    current_annual_costs: float = Field(default=0, ge=0)
    cash_reserve: float = Field(default=0, ge=0)
    forecast_monthly_revenue: float = Field(default=0, ge=0)
    forecast_monthly_costs: float = Field(default=0, ge=0)
    forecast_target_date: str = Field(default="")
    safety_margin_percent: float = Field(default=15, ge=0, le=90)
    minimum_cash_buffer: float = Field(default=0, ge=0)
    max_project_cost_revenue_ratio: float = Field(default=8, ge=0, le=100)
    monthly_revenue_growth_percent: float = Field(default=0, ge=-50, le=100)
    monthly_cost_growth_percent: float = Field(default=0, ge=-50, le=100)


class UpdateBudgetSettingsModel(BaseModel):
    available_budget: Optional[float] = Field(None, ge=0)
    annual_revenue: Optional[float] = Field(None, ge=0)
    current_annual_costs: Optional[float] = Field(None, ge=0)
    cash_reserve: Optional[float] = Field(None, ge=0)
    forecast_monthly_revenue: Optional[float] = Field(None, ge=0)
    forecast_monthly_costs: Optional[float] = Field(None, ge=0)
    forecast_target_date: Optional[str] = None
    safety_margin_percent: Optional[float] = Field(None, ge=0, le=90)
    minimum_cash_buffer: Optional[float] = Field(None, ge=0)
    max_project_cost_revenue_ratio: Optional[float] = Field(None, ge=0, le=100)
    monthly_revenue_growth_percent: Optional[float] = Field(None, ge=-50, le=100)
    monthly_cost_growth_percent: Optional[float] = Field(None, ge=-50, le=100)


class RoadmapContextSchema(BaseModel):
    current_state: str = Field(default="")
    target_vision: str = Field(default="")
    business_objectives: str = Field(default="")
    governance: str = Field(default="")


class UpdateRoadmapContextModel(BaseModel):
    current_state: Optional[str] = None
    target_vision: Optional[str] = None
    business_objectives: Optional[str] = None
    governance: Optional[str] = None


class RoadmapProjectSchema(BaseModel):
    name: str = Field(..., min_length=1)
    scope: str = Field(default="")
    benefit: str = Field(default="")
    budget: float = Field(default=0, ge=0)
    value: int = Field(default=3, ge=1, le=5)
    risk: int = Field(default=3, ge=1, le=5)
    cost: int = Field(default=3, ge=1, le=5)
    complexity: int = Field(default=3, ge=1, le=5)
    phase: str = Field(default="year-1")
    owner: str = Field(default="")
    kpi: str = Field(default="")


class UpdateRoadmapProjectModel(BaseModel):
    name: Optional[str] = Field(None, min_length=1)
    scope: Optional[str] = None
    benefit: Optional[str] = None
    budget: Optional[float] = Field(None, ge=0)
    value: Optional[int] = Field(None, ge=1, le=5)
    risk: Optional[int] = Field(None, ge=1, le=5)
    cost: Optional[int] = Field(None, ge=1, le=5)
    complexity: Optional[int] = Field(None, ge=1, le=5)
    phase: Optional[str] = None
    owner: Optional[str] = None
    kpi: Optional[str] = None



class KpiIndicatorSchema(BaseModel):
    name: str = Field(..., min_length=1)
    family: str = Field(default="technical")
    service: str = Field(default="")
    objective: str = Field(default="")
    description: str = Field(default="")
    owner: str = Field(default="")
    source: str = Field(default="")
    frequency: str = Field(default="Mensuelle")
    unit: str = Field(default="%")
    comparator: str = Field(default="gte")
    target_value: float = Field(default=0)
    observed_value: float = Field(default=0)
    period: str = Field(default="")
    trend: str = Field(default="stable")
    formula_type: str = Field(default="manual")
    formula_inputs: dict[str, float] = Field(default_factory=dict)
    is_sla: bool = Field(default=False)
    sla_target: float = Field(default=0, ge=0, le=100)
    criticality: str = Field(default="Moyenne")
    action_plan: str = Field(default="")
    display_order: int = Field(default=0)


class UpdateKpiIndicatorModel(BaseModel):
    name: Optional[str] = Field(None, min_length=1)
    family: Optional[str] = None
    service: Optional[str] = None
    objective: Optional[str] = None
    description: Optional[str] = None
    owner: Optional[str] = None
    source: Optional[str] = None
    frequency: Optional[str] = None
    unit: Optional[str] = None
    comparator: Optional[str] = None
    target_value: Optional[float] = None
    observed_value: Optional[float] = None
    period: Optional[str] = None
    trend: Optional[str] = None
    formula_type: Optional[str] = None
    formula_inputs: Optional[dict[str, float]] = None
    is_sla: Optional[bool] = None
    sla_target: Optional[float] = Field(None, ge=0, le=100)
    criticality: Optional[str] = None
    action_plan: Optional[str] = None
    display_order: Optional[int] = None
