import datetime
import uuid
from typing import Optional

from sqlalchemy import DateTime, ForeignKeyConstraint, PrimaryKeyConstraint, Unicode, text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.mssql import UNIQUEIDENTIFIER as Uuid

from app.models.base import Base


class Templates(Base):
    __tablename__ = 'templates'
    __table_args__ = (
        ForeignKeyConstraint(['event_id'], ['events.id'], ondelete='CASCADE', name='FK_Templates_Events'),
        PrimaryKeyConstraint('id', name='PK__template__3213E83F16B290F0')
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, server_default=text('(newid())'))
    event_id: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False)
    name: Mapped[str] = mapped_column(Unicode(255, 'SQL_Latin1_General_CP1_CI_AS'), nullable=False)
    svg_content: Mapped[str] = mapped_column(Unicode(collation='SQL_Latin1_General_CP1_CI_AS'), nullable=False)
    variables: Mapped[str] = mapped_column(Unicode(collation='SQL_Latin1_General_CP1_CI_AS'), nullable=False)
    created_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime, server_default=text('(getdate())'))

    event: Mapped['Events'] = relationship('Events', back_populates='templates')
    generation_log: Mapped[list['GenerationLog']] = relationship('GenerationLog', back_populates='template')
