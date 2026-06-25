from datetime import datetime, timezone

from bson.errors import InvalidId
from bson.objectid import ObjectId
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from database import (
    DEFAULT_BUDGET_SETTINGS,
    DEFAULT_ROADMAP_CONTEXT,
    budget_employee_collection,
    budget_employee_helper,
    budget_expense_collection,
    budget_expense_helper,
    budget_project_collection,
    budget_project_helper,
    risk_collection,
    kpi_collection,
    kpi_helper,
    risk_helper,
    roadmap_context_collection,
    roadmap_context_helper,
    roadmap_project_collection,
    roadmap_project_helper,
    settings_collection,
    settings_helper,
)
from models import (
    BudgetEmployeeSchema,
    BudgetExpenseSchema,
    BudgetProjectSchema,
    KpiBulkCreateSchema,
    KpiIndicatorSchema,
    RiskSchema,
    RoadmapContextSchema,
    ToolDbDataImportSchema,
    UpdateBudgetEmployeeModel,
    UpdateBudgetExpenseModel,
    UpdateBudgetProjectModel,
    UpdateKpiIndicatorModel,
    UpdateRiskModel,
    BudgetSettingsSchema,
    UpdateBudgetSettingsModel,
    RoadmapProjectSchema,
    UpdateRoadmapContextModel,
    UpdateRoadmapProjectModel,
)

app = FastAPI(title="Sud ERP Tools API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def parse_object_id(id: str) -> ObjectId:
    try:
        return ObjectId(id)
    except InvalidId as exc:
        raise HTTPException(status_code=400, detail="Invalid resource id") from exc


SUPPORTED_TOOL_IDS = {
    "risk-matrix",
    "budget-arbitrage",
    "strategic-roadmap",
    "kpi-pilotage",
}


def clean_import_record(record: dict) -> dict:
    return {key: value for key, value in record.items() if key not in {"id", "_id"}}


def clean_import_records(records) -> list[dict]:
    if records is None:
        return []
    if not isinstance(records, list):
        raise HTTPException(status_code=422, detail="Expected a JSON array for records")
    return [clean_import_record(record) for record in records if isinstance(record, dict)]


def build_export_payload(tool_id: str, data: dict) -> dict:
    return {
        "schema_version": 1,
        "tool_id": tool_id,
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "data": data,
    }


async def export_tool_data(tool_id: str) -> dict:
    if tool_id == "risk-matrix":
        risks = []
        async for risk in risk_collection.find():
            risks.append(risk_helper(risk))
        return build_export_payload(tool_id, {"risks": risks})

    if tool_id == "budget-arbitrage":
        settings = await settings_collection.find_one({"_id": "global_budget"})
        projects = []
        employees = []
        expenses = []

        async for project in budget_project_collection.find():
            projects.append(budget_project_helper(project))
        async for employee in budget_employee_collection.find():
            employees.append(budget_employee_helper(employee))
        async for expense in budget_expense_collection.find():
            expenses.append(budget_expense_helper(expense))

        return build_export_payload(tool_id, {
            "settings": settings_helper(settings or DEFAULT_BUDGET_SETTINGS),
            "projects": projects,
            "employees": employees,
            "expenses": expenses,
        })

    if tool_id == "strategic-roadmap":
        context = await roadmap_context_collection.find_one({"_id": "global_roadmap"})
        projects = []
        async for project in roadmap_project_collection.find():
            projects.append(roadmap_project_helper(project))

        return build_export_payload(tool_id, {
            "context": roadmap_context_helper(context or DEFAULT_ROADMAP_CONTEXT),
            "projects": projects,
        })

    if tool_id == "kpi-pilotage":
        indicators = []
        async for indicator in kpi_collection.find().sort("display_order", 1):
            indicators.append(kpi_helper(indicator))
        return build_export_payload(tool_id, {"indicators": indicators})

    raise HTTPException(status_code=404, detail="Unsupported tool id")


async def import_risk_matrix_data(data: dict, replace_existing: bool) -> dict:
    risks = [RiskSchema(**record).model_dump() for record in clean_import_records(data.get("risks", []))]
    if replace_existing:
        await risk_collection.delete_many({})
    if risks:
        await risk_collection.insert_many(risks)
    return {"imported": {"risks": len(risks)}}


async def import_budget_arbitrage_data(data: dict, replace_existing: bool) -> dict:
    settings_data = clean_import_record(data.get("settings", {})) if isinstance(data.get("settings", {}), dict) else {}
    projects = [BudgetProjectSchema(**record).model_dump() for record in clean_import_records(data.get("projects", []))]
    employees = [BudgetEmployeeSchema(**record).model_dump() for record in clean_import_records(data.get("employees", []))]
    expenses = [BudgetExpenseSchema(**record).model_dump() for record in clean_import_records(data.get("expenses", []))]

    if replace_existing:
        await budget_project_collection.delete_many({})
        await budget_employee_collection.delete_many({})
        await budget_expense_collection.delete_many({})

    if settings_data:
        settings = BudgetSettingsSchema(**settings_data).model_dump()
        await settings_collection.update_one(
            {"_id": "global_budget"}, {"$set": settings}, upsert=True
        )
    if projects:
        await budget_project_collection.insert_many(projects)
    if employees:
        await budget_employee_collection.insert_many(employees)
    if expenses:
        await budget_expense_collection.insert_many(expenses)

    return {
        "imported": {
            "settings": 1 if settings_data else 0,
            "projects": len(projects),
            "employees": len(employees),
            "expenses": len(expenses),
        }
    }


async def import_strategic_roadmap_data(data: dict, replace_existing: bool) -> dict:
    context_data = clean_import_record(data.get("context", {})) if isinstance(data.get("context", {}), dict) else {}
    projects = [RoadmapProjectSchema(**record).model_dump() for record in clean_import_records(data.get("projects", []))]

    if replace_existing:
        await roadmap_project_collection.delete_many({})

    if context_data:
        context = RoadmapContextSchema(**context_data).model_dump()
        await roadmap_context_collection.update_one(
            {"_id": "global_roadmap"}, {"$set": context}, upsert=True
        )
    if projects:
        await roadmap_project_collection.insert_many(projects)

    return {
        "imported": {
            "context": 1 if context_data else 0,
            "projects": len(projects),
        }
    }


async def import_kpi_pilotage_data(data: dict, replace_existing: bool) -> dict:
    indicators = [KpiIndicatorSchema(**record).model_dump() for record in clean_import_records(data.get("indicators", []))]
    if replace_existing:
        await kpi_collection.delete_many({})
    if indicators:
        await kpi_collection.insert_many(indicators)
    return {"imported": {"indicators": len(indicators)}}


async def import_tool_data(tool_id: str, data: dict, replace_existing: bool) -> dict:
    if tool_id == "risk-matrix":
        return await import_risk_matrix_data(data, replace_existing)
    if tool_id == "budget-arbitrage":
        return await import_budget_arbitrage_data(data, replace_existing)
    if tool_id == "strategic-roadmap":
        return await import_strategic_roadmap_data(data, replace_existing)
    if tool_id == "kpi-pilotage":
        return await import_kpi_pilotage_data(data, replace_existing)
    raise HTTPException(status_code=404, detail="Unsupported tool id")



@app.get("/tools/{tool_id}/db-data")
async def get_tool_db_data(tool_id: str):
    if tool_id not in SUPPORTED_TOOL_IDS:
        raise HTTPException(status_code=404, detail="Unsupported tool id")
    return await export_tool_data(tool_id)


@app.post("/tools/{tool_id}/db-data/import")
async def import_tool_db_data(tool_id: str, payload: ToolDbDataImportSchema):
    if tool_id not in SUPPORTED_TOOL_IDS:
        raise HTTPException(status_code=404, detail="Unsupported tool id")
    result = await import_tool_data(tool_id, payload.data, payload.replace_existing)
    return {"status": "imported", "tool_id": tool_id, **result}


@app.get("/")
async def root():
    return {"message": "Welcome to Sud ERP Tools API"}


@app.post("/risks/")
async def add_risk(risk: RiskSchema):
    risk_dict = risk.model_dump()
    new_risk = await risk_collection.insert_one(risk_dict)
    created_risk = await risk_collection.find_one({"_id": new_risk.inserted_id})
    return risk_helper(created_risk)


@app.get("/risks/")
async def get_risks():
    risks = []
    async for risk in risk_collection.find():
        risks.append(risk_helper(risk))
    return risks


@app.get("/risks/{id}")
async def get_risk(id: str):
    risk_id = parse_object_id(id)
    risk = await risk_collection.find_one({"_id": risk_id})
    if risk:
        return risk_helper(risk)
    raise HTTPException(status_code=404, detail="Risk not found")


@app.put("/risks/{id}")
async def update_risk(id: str, req: UpdateRiskModel):
    risk_id = parse_object_id(id)
    req = {k: v for k, v in req.model_dump().items() if v is not None}
    update_result = await risk_collection.update_one(
        {"_id": risk_id}, {"$set": req}
    )
    if update_result.modified_count == 1:
        updated_risk = await risk_collection.find_one({"_id": risk_id})
        return risk_helper(updated_risk)
    existing_risk = await risk_collection.find_one({"_id": risk_id})
    if existing_risk:
        return risk_helper(existing_risk)
    raise HTTPException(status_code=404, detail="Risk not found")


@app.delete("/risks/{id}")
async def delete_risk(id: str):
    risk_id = parse_object_id(id)
    delete_result = await risk_collection.delete_one({"_id": risk_id})
    if delete_result.deleted_count == 1:
        return {"status": "Successfully deleted risk"}
    raise HTTPException(status_code=404, detail="Risk not found")


@app.post("/budget-projects/")
async def add_budget_project(project: BudgetProjectSchema):
    project_dict = project.model_dump()
    new_project = await budget_project_collection.insert_one(project_dict)
    created_project = await budget_project_collection.find_one({"_id": new_project.inserted_id})
    return budget_project_helper(created_project)


@app.get("/budget-projects/")
async def get_budget_projects():
    projects = []
    async for project in budget_project_collection.find():
        projects.append(budget_project_helper(project))
    return projects


@app.get("/budget-projects/{id}")
async def get_budget_project(id: str):
    project_id = parse_object_id(id)
    project = await budget_project_collection.find_one({"_id": project_id})
    if project:
        return budget_project_helper(project)
    raise HTTPException(status_code=404, detail="Budget project not found")


@app.put("/budget-projects/{id}")
async def update_budget_project(id: str, req: UpdateBudgetProjectModel):
    project_id = parse_object_id(id)
    req = {k: v for k, v in req.model_dump().items() if v is not None}
    update_result = await budget_project_collection.update_one(
        {"_id": project_id}, {"$set": req}
    )
    if update_result.modified_count == 1:
        updated_project = await budget_project_collection.find_one({"_id": project_id})
        return budget_project_helper(updated_project)
    existing_project = await budget_project_collection.find_one({"_id": project_id})
    if existing_project:
        return budget_project_helper(existing_project)
    raise HTTPException(status_code=404, detail="Budget project not found")


@app.delete("/budget-projects/{id}")
async def delete_budget_project(id: str):
    project_id = parse_object_id(id)
    delete_result = await budget_project_collection.delete_one({"_id": project_id})
    if delete_result.deleted_count == 1:
        return {"status": "Successfully deleted budget project"}
    raise HTTPException(status_code=404, detail="Budget project not found")


@app.post("/budget-employees/")
async def add_budget_employee(employee: BudgetEmployeeSchema):
    employee_dict = employee.model_dump()
    new_employee = await budget_employee_collection.insert_one(employee_dict)
    created_employee = await budget_employee_collection.find_one({"_id": new_employee.inserted_id})
    return budget_employee_helper(created_employee)


@app.get("/budget-employees/")
async def get_budget_employees():
    employees = []
    async for employee in budget_employee_collection.find():
        employees.append(budget_employee_helper(employee))
    return employees


@app.get("/budget-employees/{id}")
async def get_budget_employee(id: str):
    employee_id = parse_object_id(id)
    employee = await budget_employee_collection.find_one({"_id": employee_id})
    if employee:
        return budget_employee_helper(employee)
    raise HTTPException(status_code=404, detail="Budget employee not found")


@app.put("/budget-employees/{id}")
async def update_budget_employee(id: str, req: UpdateBudgetEmployeeModel):
    employee_id = parse_object_id(id)
    req = {k: v for k, v in req.model_dump().items() if v is not None}
    update_result = await budget_employee_collection.update_one(
        {"_id": employee_id}, {"$set": req}
    )
    if update_result.modified_count == 1:
        updated_employee = await budget_employee_collection.find_one({"_id": employee_id})
        return budget_employee_helper(updated_employee)
    existing_employee = await budget_employee_collection.find_one({"_id": employee_id})
    if existing_employee:
        return budget_employee_helper(existing_employee)
    raise HTTPException(status_code=404, detail="Budget employee not found")


@app.delete("/budget-employees/{id}")
async def delete_budget_employee(id: str):
    employee_id = parse_object_id(id)
    delete_result = await budget_employee_collection.delete_one({"_id": employee_id})
    if delete_result.deleted_count == 1:
        return {"status": "Successfully deleted budget employee"}
    raise HTTPException(status_code=404, detail="Budget employee not found")


@app.post("/budget-expenses/")
async def add_budget_expense(expense: BudgetExpenseSchema):
    expense_dict = expense.model_dump()
    new_expense = await budget_expense_collection.insert_one(expense_dict)
    created_expense = await budget_expense_collection.find_one({"_id": new_expense.inserted_id})
    return budget_expense_helper(created_expense)


@app.get("/budget-expenses/")
async def get_budget_expenses():
    expenses = []
    async for expense in budget_expense_collection.find():
        expenses.append(budget_expense_helper(expense))
    return expenses


@app.get("/budget-expenses/{id}")
async def get_budget_expense(id: str):
    expense_id = parse_object_id(id)
    expense = await budget_expense_collection.find_one({"_id": expense_id})
    if expense:
        return budget_expense_helper(expense)
    raise HTTPException(status_code=404, detail="Budget expense not found")


@app.put("/budget-expenses/{id}")
async def update_budget_expense(id: str, req: UpdateBudgetExpenseModel):
    expense_id = parse_object_id(id)
    req = {k: v for k, v in req.model_dump().items() if v is not None}
    update_result = await budget_expense_collection.update_one(
        {"_id": expense_id}, {"$set": req}
    )
    if update_result.modified_count == 1:
        updated_expense = await budget_expense_collection.find_one({"_id": expense_id})
        return budget_expense_helper(updated_expense)
    existing_expense = await budget_expense_collection.find_one({"_id": expense_id})
    if existing_expense:
        return budget_expense_helper(existing_expense)
    raise HTTPException(status_code=404, detail="Budget expense not found")


@app.delete("/budget-expenses/{id}")
async def delete_budget_expense(id: str):
    expense_id = parse_object_id(id)
    delete_result = await budget_expense_collection.delete_one({"_id": expense_id})
    if delete_result.deleted_count == 1:
        return {"status": "Successfully deleted budget expense"}
    raise HTTPException(status_code=404, detail="Budget expense not found")


@app.get("/strategic-roadmap/context")
async def get_roadmap_context():
    context = await roadmap_context_collection.find_one({"_id": "global_roadmap"})
    if not context:
        await roadmap_context_collection.insert_one(DEFAULT_ROADMAP_CONTEXT)
        return roadmap_context_helper(DEFAULT_ROADMAP_CONTEXT)
    return roadmap_context_helper(context)


@app.put("/strategic-roadmap/context")
async def update_roadmap_context(req: UpdateRoadmapContextModel):
    req_dict = {k: v for k, v in req.model_dump().items() if v is not None}
    await roadmap_context_collection.update_one(
        {"_id": "global_roadmap"}, {"$set": req_dict}, upsert=True
    )
    context = await roadmap_context_collection.find_one({"_id": "global_roadmap"})
    return roadmap_context_helper(context)


@app.post("/strategic-roadmap/projects/")
async def add_roadmap_project(project: RoadmapProjectSchema):
    project_dict = project.model_dump()
    new_project = await roadmap_project_collection.insert_one(project_dict)
    created_project = await roadmap_project_collection.find_one({"_id": new_project.inserted_id})
    return roadmap_project_helper(created_project)


@app.get("/strategic-roadmap/projects/")
async def get_roadmap_projects():
    projects = []
    async for project in roadmap_project_collection.find():
        projects.append(roadmap_project_helper(project))
    return projects


@app.get("/strategic-roadmap/projects/{id}")
async def get_roadmap_project(id: str):
    project_id = parse_object_id(id)
    project = await roadmap_project_collection.find_one({"_id": project_id})
    if project:
        return roadmap_project_helper(project)
    raise HTTPException(status_code=404, detail="Roadmap project not found")


@app.put("/strategic-roadmap/projects/{id}")
async def update_roadmap_project(id: str, req: UpdateRoadmapProjectModel):
    project_id = parse_object_id(id)
    req_dict = {k: v for k, v in req.model_dump().items() if v is not None}
    update_result = await roadmap_project_collection.update_one(
        {"_id": project_id}, {"$set": req_dict}
    )
    if update_result.modified_count == 1:
        updated_project = await roadmap_project_collection.find_one({"_id": project_id})
        return roadmap_project_helper(updated_project)
    existing_project = await roadmap_project_collection.find_one({"_id": project_id})
    if existing_project:
        return roadmap_project_helper(existing_project)
    raise HTTPException(status_code=404, detail="Roadmap project not found")


@app.delete("/strategic-roadmap/projects/{id}")
async def delete_roadmap_project(id: str):
    project_id = parse_object_id(id)
    delete_result = await roadmap_project_collection.delete_one({"_id": project_id})
    if delete_result.deleted_count == 1:
        return {"status": "Successfully deleted roadmap project"}
    raise HTTPException(status_code=404, detail="Roadmap project not found")


@app.post("/kpi-indicators/")
async def add_kpi_indicator(kpi: KpiIndicatorSchema):
    kpi_dict = kpi.model_dump()
    new_kpi = await kpi_collection.insert_one(kpi_dict)
    created_kpi = await kpi_collection.find_one({"_id": new_kpi.inserted_id})
    return kpi_helper(created_kpi)


@app.post("/kpi-indicators/bulk")
async def add_kpi_indicators_bulk(payload: KpiBulkCreateSchema):
    if payload.replace_existing:
        await kpi_collection.delete_many({})

    kpi_docs = [kpi.model_dump() for kpi in payload.indicators]
    if not kpi_docs:
        return {"created_count": 0, "indicators": []}

    result = await kpi_collection.insert_many(kpi_docs)
    created_kpis = []
    async for kpi in kpi_collection.find({"_id": {"$in": result.inserted_ids}}).sort("display_order", 1):
        created_kpis.append(kpi_helper(kpi))

    return {"created_count": len(created_kpis), "indicators": created_kpis}


@app.get("/kpi-indicators/")
async def get_kpi_indicators():
    kpis = []
    async for kpi in kpi_collection.find().sort("display_order", 1):
        kpis.append(kpi_helper(kpi))
    return kpis


@app.get("/kpi-indicators/{id}")
async def get_kpi_indicator(id: str):
    kpi_id = parse_object_id(id)
    kpi = await kpi_collection.find_one({"_id": kpi_id})
    if kpi:
        return kpi_helper(kpi)
    raise HTTPException(status_code=404, detail="KPI indicator not found")


@app.put("/kpi-indicators/{id}")
async def update_kpi_indicator(id: str, req: UpdateKpiIndicatorModel):
    kpi_id = parse_object_id(id)
    req_dict = {k: v for k, v in req.model_dump().items() if v is not None}
    update_result = await kpi_collection.update_one({"_id": kpi_id}, {"$set": req_dict})
    if update_result.modified_count == 1:
        updated_kpi = await kpi_collection.find_one({"_id": kpi_id})
        return kpi_helper(updated_kpi)
    existing_kpi = await kpi_collection.find_one({"_id": kpi_id})
    if existing_kpi:
        return kpi_helper(existing_kpi)
    raise HTTPException(status_code=404, detail="KPI indicator not found")


@app.delete("/kpi-indicators/{id}")
async def delete_kpi_indicator(id: str):
    kpi_id = parse_object_id(id)
    delete_result = await kpi_collection.delete_one({"_id": kpi_id})
    if delete_result.deleted_count == 1:
        return {"status": "Successfully deleted KPI indicator"}
    raise HTTPException(status_code=404, detail="KPI indicator not found")


@app.get("/settings/budget")
async def get_budget_settings():
    settings = await settings_collection.find_one({"_id": "global_budget"})
    if not settings:
        await settings_collection.insert_one(DEFAULT_BUDGET_SETTINGS)
        return settings_helper(DEFAULT_BUDGET_SETTINGS)
    return settings_helper(settings)


@app.put("/settings/budget")
async def update_budget_settings(req: UpdateBudgetSettingsModel):
    req_dict = {k: v for k, v in req.model_dump().items() if v is not None}
    await settings_collection.update_one(
        {"_id": "global_budget"}, {"$set": req_dict}, upsert=True
    )
    settings = await settings_collection.find_one({"_id": "global_budget"})
    return settings_helper(settings)
