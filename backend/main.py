from bson.errors import InvalidId
from bson.objectid import ObjectId
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from database import (
    DEFAULT_BUDGET_SETTINGS,
    budget_employee_collection,
    budget_employee_helper,
    budget_expense_collection,
    budget_expense_helper,
    budget_project_collection,
    budget_project_helper,
    risk_collection,
    risk_helper,
    settings_collection,
    settings_helper,
)
from models import (
    BudgetEmployeeSchema,
    BudgetExpenseSchema,
    BudgetProjectSchema,
    RiskSchema,
    UpdateBudgetEmployeeModel,
    UpdateBudgetExpenseModel,
    UpdateBudgetProjectModel,
    UpdateRiskModel,
    BudgetSettingsSchema,
    UpdateBudgetSettingsModel,
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
