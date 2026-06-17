from pydantic import BaseModel, Field
from typing import Optional

class RiskSchema(BaseModel):
    description: str = Field(...)
    probability: int = Field(..., ge=1, le=5, description="Probability score from 1 to 5")
    impact: int = Field(..., ge=1, le=5, description="Impact score from 1 to 5")
    cia_pillar: str = Field(..., description="Confidentiality, Integrity, or Availability")
    mitigation: str = Field(...)

    class Config:
        json_schema_extra = {
            "example": {
                "description": "Unauthorized access to database",
                "probability": 3,
                "impact": 5,
                "cia_pillar": "Confidentiality",
                "mitigation": "Implement role-based access control and MFA."
            }
        }

class UpdateRiskModel(BaseModel):
    description: Optional[str] = None
    probability: Optional[int] = Field(None, ge=1, le=5)
    impact: Optional[int] = Field(None, ge=1, le=5)
    cia_pillar: Optional[str] = None
    mitigation: Optional[str] = None
