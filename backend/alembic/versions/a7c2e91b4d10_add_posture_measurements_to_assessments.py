"""Add posture measurements to assessments

Revision ID: a7c2e91b4d10
Revises: c969fcebe36d
Create Date: 2026-10-01 16:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a7c2e91b4d10'
down_revision: Union[str, Sequence[str], None] = 'c969fcebe36d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table('assessments', schema=None) as batch_op:
        batch_op.add_column(sa.Column('head_offset_pct', sa.Float(), nullable=True))
        batch_op.add_column(sa.Column('shoulder_tilt_deg', sa.Float(), nullable=True))
        batch_op.add_column(sa.Column('trunk_lean', sa.String(), nullable=True))
        batch_op.add_column(sa.Column('neck_angle_deg', sa.Float(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('assessments', schema=None) as batch_op:
        batch_op.drop_column('neck_angle_deg')
        batch_op.drop_column('trunk_lean')
        batch_op.drop_column('shoulder_tilt_deg')
        batch_op.drop_column('head_offset_pct')
