CREATE DATABASE GDGoCCertificateSystemDb;
GO
USE GDGoCCertificateSystemDb;
GO

-- 2. Tạo bảng users (Core Team)
CREATE TABLE users (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    name NVARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    created_at DATETIME DEFAULT GETDATE()
);
GO

-- 3. Tạo bảng events (Sự kiện)
CREATE TABLE events (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    name NVARCHAR(255) NOT NULL,
    event_date DATE NOT NULL,
    created_by UNIQUEIDENTIFIER NOT NULL,
    created_at DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_Events_Users FOREIGN KEY (created_by) REFERENCES users(id)
);
GO

-- 4. Tạo bảng templates (Mẫu SVG)
CREATE TABLE templates (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    event_id UNIQUEIDENTIFIER NOT NULL,
    name NVARCHAR(255) NOT NULL,
    svg_content NVARCHAR(MAX) NOT NULL, -- Sử dụng NVARCHAR(MAX) để lưu chuỗi XML/SVG không giới hạn độ dài
    variables NVARCHAR(MAX) NOT NULL, -- SQL Server lưu JSON dưới dạng chuỗi text
    created_at DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_Templates_Events FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);
GO

-- 5. Tạo bảng generation_log (Tiến trình xử lý hàng loạt)
CREATE TABLE generation_log (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    template_id UNIQUEIDENTIFIER NOT NULL,
    google_sheet_url NVARCHAR(MAX) NOT NULL,
    drive_folder_id VARCHAR(255) NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- PENDING, PROCESSING, COMPLETED, FAILED
    total_records INT NOT NULL DEFAULT 0,
    processed INT NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_GenerationLog_Templates FOREIGN KEY (template_id) REFERENCES templates(id)
);
GO

-- 6. Tạo bảng generated_assets (Ấn phẩm chi tiết)
CREATE TABLE generated_assets (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    generation_log_id UNIQUEIDENTIFIER NOT NULL,
    participant_name NVARCHAR(255) NOT NULL,
    participant_email VARCHAR(255) NOT NULL,
    drive_file_id VARCHAR(255) NULL,
    email_status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- PENDING, SENT, FAILED
    created_at DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_GeneratedAssets_GenerationLog FOREIGN KEY (generation_log_id) REFERENCES generation_log(id) ON DELETE CASCADE
);
GO

USE GDGoCCertificateSystemDb;
GO

-- ============================================================
-- SEED: users (Core Team)
-- password gốc: 123456
-- hash: bcrypt $2b$10$ (passlib Python compatible)
-- Được generate bằng: passlib.context.CryptContext(schemes=["bcrypt"]).hash("123456")
-- NOTE: $2b$ và $2y$ đều verify được bằng passlib
-- ============================================================

INSERT INTO users (id, email, hashed_password, name, role, created_at)
VALUES
    -- Admin
    (
        'a1000000-0000-0000-0000-000000000001',
        'admin@gdgoc.dev',
        '$2b$10$joWfwdBer70T0D5XhKdlj.We4jLfuFEkdK6zRxSttImZjoc1yCHWm',
        N'GDGoC Admin',
        'ADMIN',
        GETDATE()
    ),
    -- Ban Sự kiện
    (
        'a1000000-0000-0000-0000-000000000002',
        'sukien@gdgoc.dev',
        '$2b$10$joWfwdBer70T0D5XhKdlj.We4jLfuFEkdK6zRxSttImZjoc1yCHWm',
        N'Nguyễn Văn An',
        'EVENT',
        GETDATE()
    ),
    -- Ban Truyền thông
    (
        'a1000000-0000-0000-0000-000000000003',
        'truyenthong@gdgoc.dev',
        '$2b$10$joWfwdBer70T0D5XhKdlj.We4jLfuFEkdK6zRxSttImZjoc1yCHWm',
        N'Trần Thị Bình',
        'MEDIA',
        GETDATE()
    ),
    -- Member thường
    (
        'a1000000-0000-0000-0000-000000000004',
        'member1@gdgoc.dev',
        '$2b$10$joWfwdBer70T0D5XhKdlj.We4jLfuFEkdK6zRxSttImZjoc1yCHWm',
        N'Lê Hoàng Cường',
        'MEMBER',
        GETDATE()
    ),
    -- Member thường 2
    (
        'a1000000-0000-0000-0000-000000000005',
        'member2@gdgoc.dev',
        '$2b$10$joWfwdBer70T0D5XhKdlj.We4jLfuFEkdK6zRxSttImZjoc1yCHWm',
        N'Phạm Minh Đức',
        'MEMBER',
        GETDATE()
    );
GO

-- ============================================================
-- SEED: events (do Admin tạo)
-- ============================================================

INSERT INTO events (id, name, event_date, created_by, created_at)
VALUES
    (
        'b2000000-0000-0000-0000-000000000001',
        N'GDGoC Workshop — FastAPI & Clean Architecture',
        '2026-01-15',
        'a1000000-0000-0000-0000-000000000001',  -- Admin
        GETDATE()
    ),
    (
        'b2000000-0000-0000-0000-000000000002',
        N'GDGoC Bugkathon 2026',
        '2026-02-26',
        'a1000000-0000-0000-0000-000000000002',  -- Ban Sự kiện
        GETDATE()
    );
GO

-- ============================================================
-- SEED: templates (SVG template cho từng event)
-- svg_content & variables là placeholder, thay bằng SVG thật khi có
-- ============================================================

INSERT INTO templates (id, event_id, name, svg_content, variables, created_at)
VALUES
    (
        'c3000000-0000-0000-0000-000000000001',
        'b2000000-0000-0000-0000-000000000001',
        N'Certificate of Completion — Workshop',
        N'<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600">
  <rect width="800" height="600" fill="#ffffff" stroke="#4285F4" stroke-width="4"/>
  <text x="400" y="80" text-anchor="middle" font-size="28" fill="#4285F4">Certificate of Completion</text>
  <text id="participant_name" x="400" y="220" text-anchor="middle" font-size="36" fill="#333333">{{participant_name}}</text>
  <text id="event_name" x="400" y="300" text-anchor="middle" font-size="20" fill="#666666">{{event_name}}</text>
  <text id="event_date" x="400" y="360" text-anchor="middle" font-size="16" fill="#999999">{{event_date}}</text>
</svg>',
        N'["participant_name", "event_name", "event_date"]',
        GETDATE()
    ),
    (
        'c3000000-0000-0000-0000-000000000002',
        'b2000000-0000-0000-0000-000000000002',
        N'Certificate of Participation — Bugkathon 2026',
        N'<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600">
  <rect width="800" height="600" fill="#0f0f0f" stroke="#EA4335" stroke-width="4"/>
  <text x="400" y="80" text-anchor="middle" font-size="28" fill="#EA4335">Bugkathon 2026 — GDGoC</text>
  <text id="participant_name" x="400" y="220" text-anchor="middle" font-size="36" fill="#ffffff">{{participant_name}}</text>
  <text id="event_name" x="400" y="300" text-anchor="middle" font-size="20" fill="#cccccc">{{event_name}}</text>
  <text id="participant_role" x="400" y="360" text-anchor="middle" font-size="18" fill="#FBBC04">{{participant_role}}</text>
</svg>',
        N'["participant_name", "event_name", "participant_role"]',
        GETDATE()
    );
GO

-- ============================================================
-- SEED: generated_assets (Assets demo cho Bugkathon 2026)
-- ============================================================

INSERT INTO generated_assets (
    id,
    generation_log_id,
    participant_name,
    participant_email,
    drive_file_id,
    email_status,
    created_at
)
VALUES
    (
        'd4000000-0000-0000-0000-000000000001',
        'c3000000-0000-0000-0000-000000000002', -- template Bugkathon
        N'Nguyễn Văn A',
        'vana@example.com',
        'drive_file_id_001',
        'SENT',
        GETDATE()
    ),
    (
        'd4000000-0000-0000-0000-000000000002',
        'c3000000-0000-0000-0000-000000000002',
        N'Trần Thị B',
        'thib@example.com',
        'drive_file_id_002',
        'PENDING',
        GETDATE()
    );
GO