from sqlalchemy.orm import Session
from ..models.category import Category
from ..models.wiki import KnowledgeWiki
from ..schemas.category import CategoryCreate, CategoryUpdate
import uuid

def get_categories(db: Session):
    return db.query(Category).filter(Category.parent_id == None).all()

def create_category(db: Session, category: CategoryCreate):
    db_category = Category(**category.model_dump())
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

def update_category(db: Session, category_id: uuid.UUID, category_update: CategoryUpdate):
    db_category = db.query(Category).filter(Category.id == category_id).first()
    if not db_category:
        return None
    
    update_data = category_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_category, key, value)
        
    db.commit()
    db.refresh(db_category)
    return db_category

def delete_category(db: Session, category_id: uuid.UUID):
    # Check if category is used in KnowledgeWiki
    wiki_count = db.query(KnowledgeWiki).filter(KnowledgeWiki.category_id == category_id).count()
    if wiki_count > 0:
        raise ValueError("카테고리가 이미 다른 문서에 사용되고 있어 삭제 불가능합니다.")
        
    db_category = db.query(Category).filter(Category.id == category_id).first()
    if db_category:
        db.delete(db_category)
        db.commit()
    return db_category
