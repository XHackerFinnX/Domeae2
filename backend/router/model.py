from pydantic import BaseModel
from typing import Dict, Any, Optional

class UserId(BaseModel):
    user_id: int
    
class SaveDataRequest(BaseModel):
    projects: Dict[str, Any]
    currentProject: Optional[str] = None

class SaveResponse(BaseModel):
    status: str
    message: str
    timestamp: str