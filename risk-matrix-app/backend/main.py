from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from database import risk_collection, risk_helper
from models import RiskSchema, UpdateRiskModel
from bson.objectid import ObjectId

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Welcome to Risk Matrix API"}

@app.post("/risks/")
async def add_risk(risk: RiskSchema):
    risk_dict = risk.dict()
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
    risk = await risk_collection.find_one({"_id": ObjectId(id)})
    if risk:
        return risk_helper(risk)
    raise HTTPException(status_code=404, detail="Risk not found")

@app.put("/risks/{id}")
async def update_risk(id: str, req: UpdateRiskModel):
    req = {k: v for k, v in req.dict().items() if v is not None}
    update_result = await risk_collection.update_one(
        {"_id": ObjectId(id)}, {"$set": req}
    )
    if update_result.modified_count == 1:
        updated_risk = await risk_collection.find_one({"_id": ObjectId(id)})
        return risk_helper(updated_risk)
    existing_risk = await risk_collection.find_one({"_id": ObjectId(id)})
    if existing_risk:
        return risk_helper(existing_risk)
    raise HTTPException(status_code=404, detail="Risk not found")

@app.delete("/risks/{id}")
async def delete_risk(id: str):
    delete_result = await risk_collection.delete_one({"_id": ObjectId(id)})
    if delete_result.deleted_count == 1:
        return {"status": "Successfully deleted risk"}
    raise HTTPException(status_code=404, detail="Risk not found")
