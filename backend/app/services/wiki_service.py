from sqlalchemy.orm import Session
import uuid
import os
from openai import OpenAI
from ..models.wiki import KnowledgeWiki, WikiStatus
from ..schemas.wiki import KnowledgeWikiCreate, KnowledgeWikiUpdate
from ..schemas.search import SearchResultItem
from ..crud import crud_wiki

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def get_embedding(text: str) -> list[float]:
    api_key = os.getenv("OPENAI_API_KEY", "")
    if not api_key or api_key == "mock_key":
        return [0.0] * 1536
    response = client.embeddings.create(
        input=text,
        model="text-embedding-3-small"
    )
    return response.data[0].embedding

def create_wiki_with_embedding(db: Session, wiki: KnowledgeWikiCreate, author_id: uuid.UUID):
    embedding = get_embedding(wiki.content)
    db_wiki = KnowledgeWiki(
        **wiki.model_dump(),
        author_id=author_id,
        embedding=embedding
    )
    db.add(db_wiki)
    db.commit()
    db.refresh(db_wiki)
    return db_wiki

def update_wiki_with_embedding(db: Session, wiki_id: uuid.UUID, wiki_update: KnowledgeWikiUpdate):
    db_wiki = crud_wiki.get_wiki(db, wiki_id)
    if not db_wiki:
        return None
    
    update_data = wiki_update.model_dump(exclude_unset=True)
    if "title" in update_data:
        db_wiki.title = update_data["title"]
    if "category_id" in update_data:
        db_wiki.category_id = update_data["category_id"]
    if "content" in update_data:
        db_wiki.content = update_data["content"]
        db_wiki.embedding = get_embedding(update_data["content"])
        
    db.commit()
    db.refresh(db_wiki)
    return db_wiki

def search_wiki(db: Session, query: str, category_id: uuid.UUID | None = None, limit: int = 5):
    query_embedding = get_embedding(query)
    
    distance = KnowledgeWiki.embedding.cosine_distance(query_embedding).label('distance')
    
    base_query = db.query(KnowledgeWiki, distance).filter(KnowledgeWiki.status == WikiStatus.PUBLISHED)
    if category_id:
        base_query = base_query.filter(KnowledgeWiki.category_id == category_id)
        
    results = base_query.order_by(distance).limit(limit).all()
    
    response_items = []
    for wiki, dist in results:
        snippet = wiki.content[:200] + "..." if len(wiki.content) > 200 else wiki.content
        response_items.append(SearchResultItem(
            wiki_id=wiki.id,
            title=wiki.title,
            similarity=1.0 - dist,
            content_snippet=snippet
        ))
    
    return response_items

def verify_wiki(db: Session, wiki_id: uuid.UUID, action: str, content: str | None = None):
    db_wiki = crud_wiki.get_wiki(db, wiki_id)
    if not db_wiki:
        return None
    
    if action.upper() == "GO":
        if content:
            db_wiki.content = content
        db_wiki.embedding = get_embedding(db_wiki.content)
        db_wiki.status = WikiStatus.PUBLISHED
        db.commit()
        db.refresh(db_wiki)
        return {"id": db_wiki.id, "status": db_wiki.status.value}
    elif action.upper() == "STOP":
        db.delete(db_wiki)
        db.commit()
        return {"id": wiki_id, "status": "DELETED"}
    else:
        raise ValueError("Invalid action. Must be 'GO' or 'STOP'.")
