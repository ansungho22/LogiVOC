"""add_hashed_password_and_vector

Revision ID: 7907dafdd076
Revises: f080ea1f2c18
Create Date: 2026-06-04 13:43:53.621311

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from pgvector.sqlalchemy import Vector


# revision identifiers, used by Alembic.
revision: str = '7907dafdd076'
down_revision: Union[str, Sequence[str], None] = 'f080ea1f2c18'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. CREATE EXTENSION IF NOT EXISTS vector;
    op.execute("CREATE EXTENSION IF NOT EXISTS vector;")
    
    # 2. Add hashed_password
    op.add_column('users', sa.Column('hashed_password', sa.String(), nullable=True))
    
    # 3. Add embedding (Vector type) if missing
    # In sqlite testing, Vector might not be supported natively by sqlite, so we catch exceptions if needed,
    # but Alembic will just emit the ADD COLUMN statement.
    op.add_column('knowledge_wiki', sa.Column('embedding', Vector(1536), nullable=True))


def downgrade() -> None:
    op.drop_column('knowledge_wiki', 'embedding')
    op.drop_column('users', 'hashed_password')
    op.execute("DROP EXTENSION IF EXISTS vector;")
