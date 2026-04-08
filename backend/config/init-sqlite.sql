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
    -- ========== 1. 基础信息 ==========
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    contract_no VARCHAR(64) NOT NULL UNIQUE,
    title VARCHAR(200) NOT NULL,
    status INTEGER DEFAULT 1,
    total_amount DECIMAL(12,2),

    -- ========== 2. 用户关联 ==========
    lessor_user_id INTEGER NOT NULL,
    created_by INTEGER NOT NULL,

    -- ========== 3. 甲乙双方信息（第一条 + 签署区） ==========
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

    -- ========== 4. 房屋基本情况（第一条） ==========
    house_address VARCHAR(255) NOT NULL,
    house_area DECIMAL(10,2) DEFAULT NULL,

    -- ========== 5. 租赁期限及用途（第二条） ==========
    lease_start DATE NOT NULL,
    lease_end DATE NOT NULL,
    lease_months INTEGER DEFAULT NULL,
    rent_purpose VARCHAR(50) DEFAULT NULL,
    advance_notice_days INTEGER DEFAULT NULL,

    -- ========== 6. 租金和支付方式（第三条） ==========
    monthly_rent DECIMAL(10,2) NOT NULL,
    year_rent DECIMAL(10,2) DEFAULT NULL,
    payment_method INTEGER DEFAULT 1,
    payment_cycle INTEGER DEFAULT NULL,
    payment_count INTEGER DEFAULT 1,
    first_payment_amount DECIMAL(10,2) DEFAULT NULL,
    first_payment_date DATE DEFAULT NULL,
    second_payment_amount DECIMAL(10,2) DEFAULT NULL,
    second_payment_date DATE DEFAULT NULL,
    third_payment_amount DECIMAL(10,2) DEFAULT NULL,
    fourth_payment_amount DECIMAL(10,2) DEFAULT NULL,

    -- ========== 7. 押金信息（第四条） ==========
    deposit DECIMAL(10,2) DEFAULT 0,
    deposit_chinese VARCHAR(100) DEFAULT NULL,

    -- ========== 8. 费用约定（第五条） ==========
    fee_water BOOLEAN DEFAULT TRUE,
    fee_electric BOOLEAN DEFAULT TRUE,
    fee_gas BOOLEAN DEFAULT TRUE,
    fee_tv BOOLEAN DEFAULT FALSE,
    fee_network BOOLEAN DEFAULT FALSE,
    fee_property BOOLEAN DEFAULT FALSE,
    fee_heating BOOLEAN DEFAULT FALSE,
    fee_items TEXT,

    -- ========== 9. 居间服务（第六条） ==========
    intermediary_name VARCHAR(100),
    partyA_commission DECIMAL(10,2) DEFAULT NULL,
    partyA_commission_chinese VARCHAR(100) DEFAULT NULL,
    partyB_commission DECIMAL(10,2) DEFAULT NULL,
    partyB_commission_chinese VARCHAR(100) DEFAULT NULL,

    -- ========== 10. 水电表读数（物品清单区） ==========
    electricity_meter VARCHAR(50) DEFAULT NULL,
    water_meter VARCHAR(50) DEFAULT NULL,
    gas_meter VARCHAR(50) DEFAULT NULL,

    -- ========== 11. 物品清单（JSON格式） ==========
    inventory_items TEXT,

    -- ========== 12. 备注及其他约定（第十四条） ==========
    remark TEXT DEFAULT NULL,

    -- ========== 13. 签署状态和时间戳 ==========
    partyA_sign_status INTEGER DEFAULT 0,
    partyB_sign_status INTEGER DEFAULT 0,
    partyA_signed_at DATETIME DEFAULT NULL,
    partyB_signed_at DATETIME DEFAULT NULL,
    partyA_signature TEXT DEFAULT NULL,
    partyB_signature TEXT DEFAULT NULL,
    sign_date DATE DEFAULT NULL,

    -- ========== 14. 邀请码相关 ==========
    invite_code VARCHAR(64) DEFAULT NULL,
    invite_expires_at DATETIME DEFAULT NULL,

    -- ========== 15. 其他状态字段 ==========
    reject_reason VARCHAR(255) DEFAULT NULL,
    effective_at DATETIME DEFAULT NULL,
    expires_at DATETIME DEFAULT NULL,
    contract_pdf_path VARCHAR(255) DEFAULT NULL,

    -- ========== 16. 时间戳 ==========
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    -- ========== 外键约束 ==========
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

-- 签署邀请表
CREATE TABLE IF NOT EXISTS sign_invitations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    contract_id INTEGER NOT NULL,
    invitation_no VARCHAR(64) NOT NULL UNIQUE,
    invite_type INTEGER NOT NULL,
    invite_name VARCHAR(100) NOT NULL,
    invite_phone VARCHAR(20) NOT NULL,
    invite_email VARCHAR(100),
    receiver_type INTEGER NOT NULL,
    receiver_name VARCHAR(100) NOT NULL,
    receiver_phone VARCHAR(20) NOT NULL,
    receiver_email VARCHAR(100),
    status INTEGER DEFAULT 1,
    expires_at DATETIME NOT NULL,
    accepted_at DATETIME,
    refused_reason VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contract_id) REFERENCES contracts(id)
);

CREATE INDEX IF NOT EXISTS idx_sign_invitations_contract_id ON sign_invitations(contract_id);
CREATE INDEX IF NOT EXISTS idx_sign_invitations_invitation_no ON sign_invitations(invitation_no);
CREATE INDEX IF NOT EXISTS idx_sign_invitations_receiver_phone ON sign_invitations(receiver_phone);
CREATE INDEX IF NOT EXISTS idx_sign_invitations_status ON sign_invitations(status);

-- 合同模板表
CREATE TABLE IF NOT EXISTS contract_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(200) NOT NULL,
    code VARCHAR(64) NOT NULL UNIQUE,
    description TEXT DEFAULT NULL,
    html_content TEXT DEFAULT NULL,
    field_mapping TEXT DEFAULT NULL,
    category VARCHAR(50) DEFAULT 'standard',
    status INTEGER DEFAULT 1,
    version VARCHAR(20) DEFAULT '1.0',
    created_by INTEGER DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_contract_templates_code ON contract_templates(code);
CREATE INDEX IF NOT EXISTS idx_contract_templates_status ON contract_templates(status);
CREATE INDEX IF NOT EXISTS idx_contract_templates_category ON contract_templates(category);

-- 签署记录表
CREATE TABLE IF NOT EXISTS signatures (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    contract_id INTEGER NOT NULL,
    user_id INTEGER DEFAULT NULL,
    sign_type VARCHAR(20) NOT NULL,
    sign_name VARCHAR(100) NOT NULL,
    sign_phone VARCHAR(20) DEFAULT NULL,
    signature_data TEXT NOT NULL,
    ip_address VARCHAR(50) DEFAULT NULL,
    device_info VARCHAR(255) DEFAULT NULL,
    sign_location VARCHAR(255) DEFAULT NULL,
    signed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contract_id) REFERENCES contracts(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_signatures_contract_id ON signatures(contract_id);
CREATE INDEX IF NOT EXISTS idx_signatures_user_id ON signatures(user_id);
CREATE INDEX IF NOT EXISTS idx_signatures_signed_at ON signatures(signed_at);
