import os
# pyrefly: ignore [missing-import]
from motor.motor_asyncio import AsyncIOMotorClient

MONGO_DETAILS = os.getenv("MONGO_URL", "mongodb://localhost:27017")

client = AsyncIOMotorClient(MONGO_DETAILS)
database = client.risk_matrix_db
risk_collection = database.get_collection("risks")

# Helper to format data from DB
def risk_helper(risk) -> dict:
    return {
        "id": str(risk["_id"]),
        "description": risk["description"],
        "probability": risk["probability"],
        "impact": risk["impact"],
        "cia_pillar": risk["cia_pillar"],
        "mitigation": risk["mitigation"],
    }
