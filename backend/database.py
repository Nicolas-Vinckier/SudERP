import os
# pyrefly: ignore [missing-import]
from motor.motor_asyncio import AsyncIOMotorClient

MONGO_DETAILS = os.getenv("MONGO_URL", "mongodb://localhost:27017")

client = AsyncIOMotorClient(MONGO_DETAILS)
database = client.risk_matrix_db
risk_collection = database.get_collection("risks")
budget_project_collection = database.get_collection("budget_projects")
budget_employee_collection = database.get_collection("budget_employees")
budget_expense_collection = database.get_collection("budget_expenses")
settings_collection = database.get_collection("settings")
roadmap_context_collection = database.get_collection("roadmap_context")
roadmap_project_collection = database.get_collection("roadmap_projects")
kpi_collection = database.get_collection("kpi_indicators")
course_tool_collection = database.get_collection("course_tools")

DEFAULT_ROADMAP_CONTEXT = {
    "_id": "global_roadmap",
    "current_state": "",
    "target_vision": "",
    "business_objectives": "",
    "governance": "",
}


DEFAULT_BUDGET_SETTINGS = {
    "_id": "global_budget",
    "available_budget": 500000,
    "annual_revenue": 2500000,
    "current_annual_costs": 0,
    "cash_reserve": 0,
    "forecast_monthly_revenue": 0,
    "forecast_monthly_costs": 0,
    "forecast_target_date": "",
    "safety_margin_percent": 15,
    "minimum_cash_buffer": 0,
    "max_project_cost_revenue_ratio": 8,
    "monthly_revenue_growth_percent": 0,
    "monthly_cost_growth_percent": 0,
}



def kpi_helper(kpi) -> dict:
    return {
        "id": str(kpi["_id"]),
        "name": kpi["name"],
        "family": kpi.get("family", "technical"),
        "service": kpi.get("service", ""),
        "objective": kpi.get("objective", ""),
        "description": kpi.get("description", ""),
        "owner": kpi.get("owner", ""),
        "source": kpi.get("source", ""),
        "frequency": kpi.get("frequency", "Mensuelle"),
        "unit": kpi.get("unit", "%"),
        "comparator": kpi.get("comparator", "gte"),
        "target_value": kpi.get("target_value", 0),
        "observed_value": kpi.get("observed_value", 0),
        "period": kpi.get("period", ""),
        "trend": kpi.get("trend", "stable"),
        "formula_type": kpi.get("formula_type", "manual"),
        "formula_inputs": kpi.get("formula_inputs", {}),
        "is_sla": kpi.get("is_sla", False),
        "sla_target": kpi.get("sla_target", 0),
        "criticality": kpi.get("criticality", "Moyenne"),
        "action_plan": kpi.get("action_plan", ""),
        "display_order": kpi.get("display_order", 0),
    }


def roadmap_context_helper(context) -> dict:
    return {
        "id": str(context["_id"]),
        "current_state": context.get("current_state", DEFAULT_ROADMAP_CONTEXT["current_state"]),
        "target_vision": context.get("target_vision", DEFAULT_ROADMAP_CONTEXT["target_vision"]),
        "business_objectives": context.get("business_objectives", DEFAULT_ROADMAP_CONTEXT["business_objectives"]),
        "governance": context.get("governance", DEFAULT_ROADMAP_CONTEXT["governance"]),
    }


def roadmap_project_helper(project) -> dict:
    return {
        "id": str(project["_id"]),
        "name": project["name"],
        "scope": project.get("scope", ""),
        "benefit": project.get("benefit", ""),
        "budget": project.get("budget", 0),
        "value": project.get("value", 3),
        "risk": project.get("risk", 3),
        "cost": project.get("cost", 3),
        "complexity": project.get("complexity", 3),
        "phase": project.get("phase", "year-1"),
        "owner": project.get("owner", ""),
        "kpi": project.get("kpi", ""),
    }


def settings_helper(settings) -> dict:
    return {
        "id": str(settings["_id"]),
        "available_budget": settings.get("available_budget", DEFAULT_BUDGET_SETTINGS["available_budget"]),
        "annual_revenue": settings.get("annual_revenue", DEFAULT_BUDGET_SETTINGS["annual_revenue"]),
        "current_annual_costs": settings.get("current_annual_costs", DEFAULT_BUDGET_SETTINGS["current_annual_costs"]),
        "cash_reserve": settings.get("cash_reserve", DEFAULT_BUDGET_SETTINGS["cash_reserve"]),
        "forecast_monthly_revenue": settings.get("forecast_monthly_revenue", DEFAULT_BUDGET_SETTINGS["forecast_monthly_revenue"]),
        "forecast_monthly_costs": settings.get("forecast_monthly_costs", DEFAULT_BUDGET_SETTINGS["forecast_monthly_costs"]),
        "forecast_target_date": settings.get("forecast_target_date", DEFAULT_BUDGET_SETTINGS["forecast_target_date"]),
        "safety_margin_percent": settings.get("safety_margin_percent", DEFAULT_BUDGET_SETTINGS["safety_margin_percent"]),
        "minimum_cash_buffer": settings.get("minimum_cash_buffer", DEFAULT_BUDGET_SETTINGS["minimum_cash_buffer"]),
        "max_project_cost_revenue_ratio": settings.get("max_project_cost_revenue_ratio", DEFAULT_BUDGET_SETTINGS["max_project_cost_revenue_ratio"]),
        "monthly_revenue_growth_percent": settings.get("monthly_revenue_growth_percent", DEFAULT_BUDGET_SETTINGS["monthly_revenue_growth_percent"]),
        "monthly_cost_growth_percent": settings.get("monthly_cost_growth_percent", DEFAULT_BUDGET_SETTINGS["monthly_cost_growth_percent"]),
    }


# Helper to format risk data from DB
def risk_helper(risk) -> dict:
    return {
        "id": str(risk["_id"]),
        "description": risk["description"],
        "probability": risk["probability"],
        "impact": risk["impact"],
        "cia_pillar": risk["cia_pillar"],
        "mitigation": risk["mitigation"],
    }


# Helper to format budget project data from DB
def budget_project_helper(project) -> dict:
    return {
        "id": str(project["_id"]),
        "name": project["name"],
        "description": project["description"],
        "category": project.get("category", "Infrastructure"),
        "budget_type": project.get("budget_type", "CAPEX"),
        "requested_budget": project.get("requested_budget", 0),
        "capex_amount": project.get("capex_amount", 0),
        "opex_amount_annual": project.get("opex_amount_annual", 0),
        "hidden_costs": project.get("hidden_costs", 0),
        "expected_gain_annual": project.get("expected_gain_annual", 0),
        "roi_horizon_years": project.get("roi_horizon_years", 3),
        "business_value": project.get("business_value", 1),
        "risk_reduction": project.get("risk_reduction", 1),
        "roi_score": project.get("roi_score", 1),
        "complexity_score": project.get("complexity_score", 1),
        "is_mandatory": project.get("is_mandatory", False),
        "decision": project.get("decision", "a_arbitrer"),
        "justification": project.get("justification", ""),
        "accepted_risk": project.get("accepted_risk", ""),
    }


def budget_employee_helper(employee) -> dict:
    return {
        "id": str(employee["_id"]),
        "full_name": employee["full_name"],
        "role": employee.get("role", "Equipe IT"),
        "department": employee.get("department", "DSI"),
        "weekly_hours": employee.get("weekly_hours", 35),
        "hourly_rate": employee.get("hourly_rate", 0),
        "workload_rate": employee.get("workload_rate", 1),
        "employer_charge_rate": employee.get("employer_charge_rate", 0.45),
        "annual_bonus": employee.get("annual_bonus", 0),
        "project_allocation_rate": employee.get("project_allocation_rate", 1),
        "start_date": employee.get("start_date", ""),
        "end_date": employee.get("end_date", ""),
        "notes": employee.get("notes", ""),
    }


def budget_expense_helper(expense) -> dict:
    return {
        "id": str(expense["_id"]),
        "name": expense["name"],
        "expense_type": expense.get("expense_type", "Logiciel"),
        "billing_frequency": expense.get("billing_frequency", "monthly"),
        "unit_cost": expense.get("unit_cost", 0),
        "quantity": expense.get("quantity", 1),
        "start_date": expense.get("start_date", ""),
        "end_date": expense.get("end_date", ""),
        "owner": expense.get("owner", ""),
        "vendor": expense.get("vendor", ""),
        "is_critical": expense.get("is_critical", False),
        "notes": expense.get("notes", ""),
    }
