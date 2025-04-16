"""
Revision ID: ${up_revision}
Revises: ${down_revision | comma,n}
Create Date: ${create_date}

"""
from typing import Sequence, Union

# Import SQLAlchemy for database operations
import sqlalchemy as sa
from sqlalchemy import MetaData, Table, Column
from user_settings import engine  # Reuse the database engine from user_settings.py

# Revision identifiers, used for tracking migrations
revision: str = ${repr(up_revision)}
down_revision: Union[str, None] = ${repr(down_revision)}
branch_labels: Union[str, Sequence[str], None] = ${repr(branch_labels)}
depends_on: Union[str, Sequence[str], None] = ${repr(depends_on)}


def upgrade() -> None:
    """
    Apply schema changes.
    """
    metadata = MetaData(bind=engine)
    metadata.reflect()

    ${upgrades if upgrades else "pass"}


def downgrade() -> None:
    """
    Revert schema changes.
    """
    metadata = MetaData(bind=engine)
    metadata.reflect()

    ${downgrades if downgrades else "pass"}
