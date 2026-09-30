"""Add focus sessions

Revision ID: b8d4f02c6e31
Revises: a7c2e91b4d10
Create Date: 2026-10-01 17:05:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b8d4f02c6e31'
down_revision: Union[str, Sequence[str], None] = 'a7c2e91b4d10'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'focus_sessions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('duration_seconds', sa.Integer(), nullable=False),
        sa.Column('samples', sa.Integer(), nullable=False),
        sa.Column('good_samples', sa.Integer(), nullable=False),
        sa.Column('good_pct', sa.Float(), nullable=False),
        sa.Column('nudges', sa.Integer(), nullable=False),
        sa.Column('timeline', sa.String(), nullable=True),
        sa.Column('reasons', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_focus_sessions_id'), 'focus_sessions', ['id'], unique=False)
    op.create_index(op.f('ix_focus_sessions_user_id'), 'focus_sessions', ['user_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_focus_sessions_user_id'), table_name='focus_sessions')
    op.drop_index(op.f('ix_focus_sessions_id'), table_name='focus_sessions')
    op.drop_table('focus_sessions')
