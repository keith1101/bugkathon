import datetime
import uuid
from typing import Optional

from sqlalchemy import DateTime, ForeignKeyConstraint, PrimaryKeyConstraint, String, Unicode, text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.mssql import UNIQUEIDENTIFIER as Uuid

from app.models.base import Base


class GeneratedAssets(Base):
    __tablename__ = 'generated_assets'
    __table_args__ = (
        ForeignKeyConstraint(['generation_log_id'], ['generation_log.id'], ondelete='CASCADE', name='FK_GeneratedAssets_GenerationLog'),
        PrimaryKeyConstraint('id', name='PK__generate__3213E83FC395744C')
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, server_default=text('(newid())'))
    generation_log_id: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False)
    participant_name: Mapped[str] = mapped_column(Unicode(255, 'SQL_Latin1_General_CP1_CI_AS'), nullable=False)
    participant_email: Mapped[str] = mapped_column(String(255, 'SQL_Latin1_General_CP1_CI_AS'), nullable=False)
    email_status: Mapped[str] = mapped_column(String(50, 'SQL_Latin1_General_CP1_CI_AS'), nullable=False, server_default=text("('PENDING')"))
    drive_file_id: Mapped[Optional[str]] = mapped_column(String(255, 'SQL_Latin1_General_CP1_CI_AS'))
    created_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime, server_default=text('(getdate())'))

    generation_log: Mapped['GenerationLog'] = relationship('GenerationLog', back_populates='generated_assets')