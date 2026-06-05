"""Add structured_data to wiki

Revision ID: 8bdfe9bb4af1
Revises: 4a3dc4f00e0a
Create Date: 2026-06-05 10:22:20.112015

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8bdfe9bb4af1'
down_revision: Union[str, Sequence[str], None] = '4a3dc4f00e0a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('knowledge_wiki', sa.Column('structured_data', sa.String(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('knowledge_wiki', 'structured_data')
