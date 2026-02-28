import datetime
import uuid
from typing import Optional

from sqlalchemy import Date, DateTime, ForeignKeyConstraint, Index, PrimaryKeyConstraint, Unicode, text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.mssql import UNIQUEIDENTIFIER as Uuid

from app.models.base import Base


class Events(Base):
    __tablename__ = 'events'
    __table_args__ = (
        ForeignKeyConstraint(['created_by'], ['users.id'], name='FK_Events_Users'),
        PrimaryKeyConstraint('id', name='PK__events__3213E83FE6B789F9')
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, server_default=text('(newid())'))
    name: Mapped[str] = mapped_column(Unicode(255, 'SQL_Latin1_General_CP1_CI_AS'), nullable=False)
    event_date: Mapped[datetime.date] = mapped_column(Date, nullable=False)
    created_by: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False)
    created_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime, server_default=text('(getdate())'))

    users: Mapped['Users'] = relationship('Users', back_populates='events')
    templates: Mapped[list['Templates']] = relationship('Templates', back_populates='event')