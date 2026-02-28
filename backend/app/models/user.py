import datetime
import uuid
from typing import Optional

from sqlalchemy import DateTime, Index, PrimaryKeyConstraint, String, Unicode, text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.mssql import UNIQUEIDENTIFIER as Uuid

from app.models.base import Base
class Users(Base):
    __tablename__ = 'users'
    __table_args__ = (
        PrimaryKeyConstraint('id', name='PK__users__3213E83F4E7CB582'),
        Index('UQ__users__AB6E61648C27F7BF', 'email', mssql_clustered=False, mssql_include=[], unique=True)
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, server_default=text('(newid())'))
    email: Mapped[str] = mapped_column(String(255, 'SQL_Latin1_General_CP1_CI_AS'), nullable=False)
    name: Mapped[str] = mapped_column(Unicode(255, 'SQL_Latin1_General_CP1_CI_AS'), nullable=False)
    role: Mapped[str] = mapped_column(String(50, 'SQL_Latin1_General_CP1_CI_AS'), nullable=False)
    hashed_password: Mapped[Optional[str]] = mapped_column(String(255, "SQL_Latin1_General_CP1_CI_AS"), nullable=False)
    created_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime, server_default=text('(getdate())'))

    events: Mapped[list['Events']] = relationship('Events', back_populates='users')
