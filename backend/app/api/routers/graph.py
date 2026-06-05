from fastapi import APIRouter, Depends
from ... import models
from ...core import database
from ..dependencies import get_current_user

router = APIRouter(prefix="/graph", tags=["graph"])

@router.get("/topology")
def get_topology(current_user: models.User = Depends(get_current_user)):
    return {
        "nodes": [{"id": "payment", "label": "Payment Module"}, {"id": "db", "label": "Database"}],
        "edges": [{"source": "payment", "target": "db"}]
    }
