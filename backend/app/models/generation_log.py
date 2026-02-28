import datetime
import uuid
from typing import Optional

from sqlalchemy import DateTime, ForeignKeyConstraint, Integer, PrimaryKeyConstraint, String, Unicode, text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.mssql import UNIQUEIDENTIFIER as Uuid

from app.models.base import Base


class GenerationLog(Base):
    __tablename__ = 'generation_log'
    __table_args__ = (
        ForeignKeyConstraint(['template_id'], ['templates.id'], name='FK_GenerationLog_Templates'),
        PrimaryKeyConstraint('id', name='PK__generati__3213E83F8C66FEFF')
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, server_default=text('(newid())'))
    template_id: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False)
    google_sheet_url: Mapped[str] = mapped_column(Unicode(collation='SQL_Latin1_General_CP1_CI_AS'), nullable=False)
    status: Mapped[str] = mapped_column(String(50, 'SQL_Latin1_General_CP1_CI_AS'), nullable=False, server_default=text("('PENDING')"))
    total_records: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text('((0))'))
    processed: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text('((0))'))
    drive_folder_id: Mapped[Optional[str]] = mapped_column(String(255, 'SQL_Latin1_General_CP1_CI_AS'))
    created_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime, server_default=text('(getdate())'))
    updated_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime, server_default=text('(getdate())'))

    template: Mapped['Templates'] = relationship('Templates', back_populates='generation_log')
    generated_assets: Mapped[list['GeneratedAssets']] = relationship('GeneratedAssets', back_populates='generation_log')
