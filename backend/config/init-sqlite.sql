-- SQLite 数据库初始化脚本
-- 用于本地开发测试

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    openid VARCHAR(64) DEFAULT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(50) DEFAULT NULL,
    idcard VARCHAR(18) DEFAULT NULL,
    role VARCHAR(20) DEFAULT 'LESSEE',
    status INTEGER DEFAULT 0,
    real_name_status INTEGER DEFAULT 0,
    real_name_at DATETIME DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contracts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    contract_no VARCHAR(64) NOT NULL UNIQUE,
    title VARCHAR(200) NOT NULL,
    status INTEGER DEFAULT 1,
    lessor_user_id INTEGER NOT NULL,
    partyA_company VARCHAR(200),
    partyA_phone VARCHAR(20),
    partyA_contact VARCHAR(100),
    partyA_phone2 VARCHAR(20),
    partyA_account VARCHAR(100),
    partyA_idcard VARCHAR(18),
    partyB_name VARCHAR(100),
    partyB_idCard VARCHAR(18),
    partyB_phone VARCHAR(20),
    partyB_contact VARCHAR(100),
    house_address VARCHAR(255) NOT NULL,
    house_area DECIMAL(10,2) DEFAULT NULL,
    rent_purpose VARCHAR(50) DEFAULT NULL,
    lease_start DATE NOT NULL,
    lease_end DATE NOT NULL,
    lease_months INTEGER DEFAULT NULL,
    advance_notice_days INTEGER DEFAULT NULL,
    monthly_rent DECIMAL(10,2) NOT NULL,
    year_rent DECIMAL(10,2) DEFAULT NULL,
    payment_method INTEGER DEFAULT 1,
    payment_cycle INTEGER DEFAULT NULL,
    payment_count INTEGER DEFAULT 1,
    first_payment_amount DECIMAL(10,2) DEFAULT NULL,
    second_payment_amount DECIMAL(10,2) DEFAULT NULL,
    second_payment_date DATE DEFAULT NULL,
    third_payment_amount DECIMAL(10,2) DEFAULT NULL,
    deposit DECIMAL(10,2) DEFAULT 0,
    deposit_chinese VARCHAR(100) DEFAULT NULL,
    total_amount DECIMAL(12,2),
    intermediary_name VARCHAR(100),
    partyA_commission DECIMAL(10,2) DEFAULT NULL,
    partyA_commission_chinese VARCHAR(100) DEFAULT NULL,
    partyB_commission DECIMAL(10,2) DEFAULT NULL,
    partyB_commission_chinese VARCHAR(100) DEFAULT NULL,
    fee_water BOOLEAN DEFAULT TRUE,
    fee_electric BOOLEAN DEFAULT TRUE,
    fee_gas BOOLEAN DEFAULT TRUE,
    fee_property BOOLEAN DEFAULT FALSE,
    fee_heating BOOLEAN DEFAULT FALSE,
    electricity_meter VARCHAR(50) DEFAULT NULL,
    water_meter VARCHAR(50) DEFAULT NULL,
    gas_meter VARCHAR(50) DEFAULT NULL,
    inventory_items TEXT,
    remark TEXT DEFAULT NULL,
    partyA_sign_status INTEGER,
    partyB_sign_status INTEGER,
    partyA_signed_at DATETIME DEFAULT NULL,
    partyB_signed_at DATETIME DEFAULT NULL,
    partyA_signature TEXT DEFAULT NULL,
    partyB_signature TEXT DEFAULT NULL,
    sign_date DATE DEFAULT NULL,
    reject_reason VARCHAR(255) DEFAULT NULL,
    effective_at DATETIME DEFAULT NULL,
    expires_at DATETIME DEFAULT NULL,
    invite_code VARCHAR(64) DEFAULT NULL,
    invite_expires_at DATETIME DEFAULT NULL,
    contract_pdf_path VARCHAR(255) DEFAULT NULL,
    created_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lessor_user_id) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_openid ON users(openid);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_contracts_no ON contracts(contract_no);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_created_by ON contracts(created_by);
CREATE INDEX IF NOT EXISTS idx_contracts_lessor_user_id ON contracts(lessor_user_id);
CREATE INDEX IF NOT EXISTS idx_contracts_partyB_phone ON contracts(partyB_phone);
CREATE INDEX IF NOT EXISTS idx_contracts_invite_code ON contracts(invite_code);
CREATE INDEX IF NOT EXISTS idx_contracts_effective ON contracts(effective_at);
CREATE INDEX IF NOT EXISTS idx_contracts_expires ON contracts(expires_at);
