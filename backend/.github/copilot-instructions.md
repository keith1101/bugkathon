# GitHub Copilot Instructions — GDGoC Certificate System (Backend)

## Project Overview

Internal tool for generating, rendering, and distributing bulk personalized SVG-to-PDF certificates.

- Reads participant data from **Google Sheets**
- Generates personalized **SVG → PDF** certificates
- Uploads to **Google Drive**, sends via **Gmail**
- Tracks progress in **SQL Server** database

---

## Tech Stack

- **Runtime:** Python 3.10+
- **Framework:** FastAPI 0.115+
- **Database:** SQL Server (Database First) via SQLAlchemy 2.0 Async + aioodbc
- **Validation:** Pydantic v2 + pydantic-settings
- **Google APIs:** google-api-python-client (Sheets, Drive, Gmail)
- **SVG→PDF:** CairoSVG + lxml
- **Testing:** pytest + pytest-asyncio

---

## Folder Structure

```
backend/
├── app/
│   ├── api/
│   │   ├── deps.py              # Tất cả Dependency Injection (Depends)
│   │   └── v1/
│   │       ├── router.py        # Aggregate tất cả routers
│   │       ├── users.py
│   │       ├── events.py
│   │       ├── templates.py
│   │       └── generation_log.py
│   ├── core/
│   │   ├── config.py            # pydantic-settings đọc .env
│   │   ├── database.py          # SQLAlchemy async engine + session
│   │   ├── google_auth.py       # Google Service Account auth helper
│   │   ├── exceptions.py        # Custom exception classes
│   │   └── exception_handlers.py
│   ├── models/                  # SQLAlchemy ORM (Database First, reflect từ DB)
│   │   ├── base.py              # DeclarativeBase
│   │   ├── user.py              # → Users table
│   │   ├── event.py             # → events table
│   │   ├── template.py          # → templates table
│   │   ├── generation_log.py    # → generation_log table
│   │   └── generated_asset.py   # → generated_assets table
│   ├── repositories/            # Data Access Layer — chỉ chứa SQLAlchemy queries
│   │   ├── user_repository.py
│   │   ├── event_repository.py
│   │   ├── template_repository.py
│   │   ├── generation_log_repository.py
│   │   └── generated_asset_repository.py
│   ├── schemas/                 # Pydantic v2 DTOs (tách biệt với ORM models)
│   │   ├── user.py
│   │   ├── event.py
│   │   ├── template.py
│   │   ├── generation_log.py
│   │   └── generated_asset.py
│   ├── services/                # Business Logic Layer
│   │   ├── user_service.py
│   │   ├── event_service.py
│   │   ├── template_service.py
│   │   ├── generation_log_service.py  # Orchestrate toàn bộ batch job
│   │   ├── svg_service.py             # lxml: thay text nodes trong SVG XML
│   │   ├── pdf_service.py             # CairoSVG: SVG bytes → PDF bytes
│   │   ├── google_sheets_service.py   # Đọc danh sách người nhận
│   │   ├── google_drive_service.py    # Upload PDF lên Drive
│   │   └── gmail_service.py           # Gửi email certificate
│   └── main.py                  # FastAPI app entry point
├── credentials/                 # Google Service Account JSON (gitignored!)
├── tests/
├── .env                         # (gitignored!)
├── .env.example
└── requirements.txt
```

---

## Architecture Rules (CRITICAL — Always Follow)

### 1. 3-Layer Architecture

```
Router (api/v1/)  →  Service (services/)  →  Repository (repositories/)
     ↓                      ↓                        ↓
HTTP only            Business Logic            SQLAlchemy queries only
Pydantic I/O         Google APIs calls         No business logic
No DB queries        No HTTP logic             No HTTP logic
```

### 2. Dependency Injection

- **Tất cả** `Depends(...)` được khai báo trong `app/api/deps.py`
- Router chỉ import từ `deps.py`, **không** tự khởi tạo Service/Repository
- Service nhận Repository qua constructor injection

```python
# ✅ ĐÚNG
@router.get("/")
async def list_users(service: UserService = Depends(get_user_service)):
    ...

# ❌ SAI — không khởi tạo trực tiếp trong router
@router.get("/")
async def list_users(db: AsyncSession = Depends(get_db)):
    repo = UserRepository(db)   # ❌
    service = UserService(repo) # ❌
    ...
```

### 3. Async Rules

- Tất cả endpoint và I/O bound functions dùng `async def`
- Tất cả SQLAlchemy queries dùng `await`
- Background job (batch processing) dùng `BackgroundTasks` — **không block main thread**

```python
# ✅ ĐÚNG
async def get_by_id(self, id: uuid.UUID) -> Users | None:
    result = await self.db.execute(select(Users).where(Users.id == id))
    return result.scalar_one_or_none()
```

### 4. Database First — ORM Models

- **Không dùng** `Base.metadata.create_all()` — DB schema đã tồn tại sẵn
- Models phản ánh đúng SQL schema trong `Bugkathon_GDGoC-Certificate-System.sql`
- Class names: `Users`, `Events`, `Templates`, `GenerationLog`, `GeneratedAssets`
- Dùng `Mapped[]` và `mapped_column()` style (SQLAlchemy 2.0)

### 5. Pydantic v2 Schemas

- Dùng `model_config = {"from_attributes": True}` thay `orm_mode = True`
- Tách biệt hoàn toàn `...Base`, `...Create`, `...Response` cho mỗi entity
- Field bắt buộc: `Field(...)` — field optional: `Field(default=None)`
- Dùng `@field_validator(mode="before")` để parse JSON string từ DB (ví dụ: `variables` trong Templates)

---

## Database Schema (Reference)

```sql
-- users: id, email, name(NVARCHAR), role, created_at
-- events: id, name(NVARCHAR), event_date, created_by(FK→users), created_at
-- templates: id, event_id(FK→events CASCADE), name, svg_content(NVARCHAR MAX), variables(NVARCHAR MAX JSON), created_at
-- generation_log: id, template_id(FK→templates), google_sheet_url, drive_folder_id, status, total_records, processed, created_at, updated_at
-- generated_assets: id, generation_log_id(FK→generation_log CASCADE), participant_name, participant_email, drive_file_id, email_status, created_at
```

**Status values:**

- `generation_log.status`: `PENDING` | `PROCESSING` | `COMPLETED` | `FAILED`
- `generated_assets.email_status`: `PENDING` | `SENT` | `FAILED`

---

## Google APIs Pattern

```python
# Tất cả Google clients được build trong app/core/google_auth.py
# Service Account file: credentials/service_account.json (từ settings)
# Scopes đọc từ .env:
#   GOOGLE_DRIVE_SCOPES=https://www.googleapis.com/auth/drive.file
#   GOOGLE_SHEETS_SCOPES=https://www.googleapis.com/auth/spreadsheets.readonly
#   GMAIL_SCOPES=https://www.googleapis.com/auth/gmail.send

# Gmail dùng Domain-Wide Delegation:
credentials.with_subject(settings.GMAIL_SENDER_EMAIL)
```

---

## Error Handling Rules

### Custom Exceptions (app/core/exceptions.py)

```python
NotFoundException       # 404 — Resource không tìm thấy trong DB
ValidationException     # 422 — Business logic validation fail
GoogleAPIException      # 502 — Lỗi Google APIs
SVGParseException       # 500 — Lỗi parse SVG XML
```

### Batch Job Error Handling

- **Không** stop toàn bộ batch khi 1 record fail
- Ghi lỗi vào `generated_assets.email_status = 'FAILED'`
- Log exception message, tiếp tục record tiếp theo
- Chỉ mark `generation_log.status = 'FAILED'` khi **toàn bộ** batch fail

```python
# ✅ Pattern đúng cho batch loop
for participant in participants:
    try:
        await self._process_one(participant, log_id)
    except Exception as e:
        await self._mark_asset_failed(participant, str(e))
        continue  # ← không raise, tiếp tục record tiếp
```

---

## SVG Manipulation Pattern

```python
# Dùng lxml để locate <text> node bằng id attribute
# VD: <text id="participant_name">Placeholder</text>
# → Thay text content bằng tên người nhận thực tế

from lxml import etree

tree = etree.fromstring(svg_content.encode())
node = tree.find('.//*[@id="participant_name"]')
if node is not None:
    node.text = "Nguyễn Văn A"
```

---

## Naming Conventions

| Layer            | Convention                | Ví dụ                                 |
| ---------------- | ------------------------- | ------------------------------------- |
| ORM Model class  | PascalCase + plural       | `Users`, `Events`, `GenerationLog`    |
| Repository class | PascalCase + `Repository` | `UserRepository`                      |
| Service class    | PascalCase + `Service`    | `GenerationLogService`                |
| Router file      | snake_case                | `generation_log.py`                   |
| Schema class     | PascalCase + suffix       | `UserCreate`, `UserResponse`          |
| Pydantic field   | snake_case                | `participant_name`, `drive_folder_id` |
| DB column        | snake_case                | match DB schema chính xác             |

---

## Environment Variables (.env)

```ini
APP_ENV=development
APP_HOST=0.0.0.0
APP_PORT=8000

DATABASE_URL=mssql+aioodbc://sa:password@localhost:1433/GDGoCCertificateSystemDb?driver=ODBC+Driver+17+for+SQL+Server

GOOGLE_SERVICE_ACCOUNT_FILE=credentials/service_account.json
GOOGLE_DRIVE_SCOPES=https://www.googleapis.com/auth/drive.file
GOOGLE_SHEETS_SCOPES=https://www.googleapis.com/auth/spreadsheets.readonly
GMAIL_SCOPES=https://www.googleapis.com/auth/gmail.send
GMAIL_SENDER_EMAIL=noreply@yourdomain.com
```

---

## What Copilot Should NOT Do

- ❌ Không viết SQL query thô (raw SQL) — dùng SQLAlchemy ORM
- ❌ Không import `settings` trong `models/` hoặc `repositories/`
- ❌ Không viết business logic trong Router
- ❌ Không gọi Google APIs trực tiếp trong Router hoặc Repository
- ❌ Không dùng `Base.metadata.create_all()` — Database First
- ❌ Không dùng `orm_mode = True` — dùng `from_attributes = True` (Pydantic v2)
- ❌ Không block main thread trong batch processing
