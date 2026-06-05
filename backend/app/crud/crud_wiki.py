from sqlalchemy.orm import Session
from ..models.wiki import KnowledgeWiki
import uuid

def get_wiki(db: Session, wiki_id: uuid.UUID):
    return db.query(KnowledgeWiki).filter(KnowledgeWiki.id == wiki_id).first()

def get_all_wikis(db: Session, skip: int = 0, limit: int = 100):
    return db.query(KnowledgeWiki).offset(skip).limit(limit).all()

def delete_wiki(db: Session, wiki_id: uuid.UUID):
    db_wiki = db.query(KnowledgeWiki).filter(KnowledgeWiki.id == wiki_id).first()
    if db_wiki:
        db.delete(db_wiki)
        db.commit()
    return db_wiki
