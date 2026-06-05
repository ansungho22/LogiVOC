from fastapi import APIRouter
from . import auth, categories, wiki, tasks, mcp, admin, graph

router = APIRouter()
router.include_router(auth.router)
router.include_router(categories.router)
router.include_router(wiki.router)
router.include_router(tasks.router)
router.include_router(mcp.router)
router.include_router(admin.router)
router.include_router(graph.router)
