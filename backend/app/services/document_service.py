from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc
import uuid
import json
from datetime import datetime
from ..models.wiki import KnowledgeWiki, WikiStatus
from ..models.category import Category
from ..schemas.document import DocumentSearchItem, DocumentSearchResponse, DocumentDetailResponse, CategorySimple
from .wiki_service import get_embedding

def search_documents(
    db: Session,
    query: str | None = None,
    category_id: uuid.UUID | None = None,
    status: str | None = None,
    start_date: str | None = None,
    end_date: str | None = None,
    page: int = 1,
    limit: int = 20,
    is_admin: bool = False
) -> DocumentSearchResponse:
    distance_label = None
    if query:
        query_embedding = get_embedding(query)
        distance = KnowledgeWiki.embedding.cosine_distance(query_embedding).label('distance')
        base_query = db.query(KnowledgeWiki, distance)
        distance_label = distance
    else:
        base_query = db.query(KnowledgeWiki)

    # Filter status
    if status:
        if not is_admin and status.upper() != "PUBLISHED":
            # For non-admins, if they request DRAFT or REJECTED, we can either block or just filter.
            # But normally, non-admins can only see PUBLISHED unless they are the author (auth context needed for that, simplified here)
            # Assuming strictly: non-admins only see PUBLISHED
            base_query = base_query.filter(KnowledgeWiki.status == WikiStatus.PUBLISHED)
        else:
            base_query = base_query.filter(KnowledgeWiki.status == status.upper())
    else:
        if not is_admin:
            base_query = base_query.filter(KnowledgeWiki.status == WikiStatus.PUBLISHED)

    # Filter category
    if category_id:
        base_query = base_query.filter(KnowledgeWiki.category_id == category_id)

    # Filter date
    if start_date:
        try:
            start_dt = datetime.strptime(start_date, "%Y-%m-%d")
            base_query = base_query.filter(KnowledgeWiki.created_at >= start_dt)
        except ValueError:
            pass
    if end_date:
        try:
            # inclusive end date up to end of the day
            end_dt = datetime.strptime(f"{end_date} 23:59:59", "%Y-%m-%d %H:%M:%S")
            base_query = base_query.filter(KnowledgeWiki.created_at <= end_dt)
        except ValueError:
            pass

    total = base_query.count()

    if query and distance_label is not None:
        results = base_query.order_by(distance_label).offset((page - 1) * limit).limit(limit).all()
        items = []
        for row in results:
            wiki, dist = row
            # construct summary
            summary = wiki.content[:200] + "..." if wiki.content and len(wiki.content) > 200 else (wiki.content or "")
            cat = CategorySimple(id=wiki.category.id, name=wiki.category.name) if wiki.category else None
            items.append(DocumentSearchItem(
                id=wiki.id,
                title=wiki.title or "",
                summary=summary,
                category=cat,
                status=wiki.status.value,
                semantic_score=round(1.0 - dist, 4) if dist is not None else None,
                created_at=wiki.created_at
            ))
    else:
        results = base_query.order_by(desc(KnowledgeWiki.created_at)).offset((page - 1) * limit).limit(limit).all()
        items = []
        for wiki in results:
            summary = wiki.content[:200] + "..." if wiki.content and len(wiki.content) > 200 else (wiki.content or "")
            cat = CategorySimple(id=wiki.category.id, name=wiki.category.name) if wiki.category else None
            items.append(DocumentSearchItem(
                id=wiki.id,
                title=wiki.title or "",
                summary=summary,
                category=cat,
                status=wiki.status.value,
                semantic_score=None,
                created_at=wiki.created_at
            ))

    return DocumentSearchResponse(
        total=total,
        page=page,
        limit=limit,
        data=items
    )

def get_document_details(db: Session, document_id: uuid.UUID, is_admin: bool = False, current_user_id: uuid.UUID | None = None) -> DocumentDetailResponse | None:
    wiki = db.query(KnowledgeWiki).filter(KnowledgeWiki.id == document_id).first()
    if not wiki:
        return None

    if not is_admin and wiki.status != WikiStatus.PUBLISHED:
        if not current_user_id or wiki.author_id != current_user_id:
            return None

    summary = wiki.content[:200] + "..." if wiki.content and len(wiki.content) > 200 else (wiki.content or "")
    cat = CategorySimple(id=wiki.category.id, name=wiki.category.name) if wiki.category else None

    structured_data = None
    if wiki.structured_data:
        try:
            structured_data = json.loads(wiki.structured_data)
        except json.JSONDecodeError:
            pass

    return DocumentDetailResponse(
        id=wiki.id,
        title=wiki.title or "",
        original_text=wiki.content or "",
        summary=summary,
        structured_data=structured_data,
        category=cat,
        status=wiki.status.value,
        created_at=wiki.created_at,
        updated_at=wiki.updated_at
    )
