-- SQLite 数据库初始化脚本
-- 用于本地开发测试
-- 根据 spec.md 设计

-- 用户表（12个字段）
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    openid VARCHAR(64) DEFAULT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(50) DEFAULT NULL,
    idcard VARCHAR(18) DEFAULT NULL,
    idcard_front VARCHAR(255) DEFAULT NULL,
    idcard_back VARCHAR(255) DEFAULT NULL,
    real_name_status INTEGER DEFAULT 0,
    real_name_at DATETIME DEFAULT NULL,
    role VARCHAR(20) DEFAULT 'PARTY_B',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 合同主表（完整字段设计，与 lease_contract_template.html 模板占位符一一对应）
CREATE TABLE IF NOT EXISTS contracts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    contract_no VARCHAR(64) NOT NULL UNIQUE,
    title VARCHAR(200) NOT NULL,

    -- 甲方（出租方）信息
    lessor_user_id INTEGER NOT NULL,
    lessor_name VARCHAR(100) NOT NULL,
    lessor_phone VARCHAR(20) NOT NULL,
    lessor_phone2 VARCHAR(20) DEFAULT NULL,
    lessor_idcard VARCHAR(18) DEFAULT NULL,
    lessor_account VARCHAR(100) DEFAULT NULL,
    lessor_contact VARCHAR(50) DEFAULT NULL,
    partyA_company VARCHAR(200) DEFAULT NULL,

    -- 乙方（承租方）信息
    lessee_name VARCHAR(100) NOT NULL,
    lessee_phone VARCHAR(20) NOT NULL,
    lessee_idcard VARCHAR(18) DEFAULT NULL,
    lessee_contact VARCHAR(50) DEFAULT NULL,

    -- 房屋信息
    house_address VARCHAR(255) NOT NULL,
    house_area DECIMAL(10,2) DEFAULT NULL,
    rent_purpose VARCHAR(50) DEFAULT NULL,

    -- 租赁期限
    lease_start DATE NOT NULL,
    lease_end DATE NOT NULL,
    lease_months INTEGER DEFAULT NULL,
    advance_notice_days INTEGER DEFAULT NULL,

    -- 租金信息
    monthly_rent DECIMAL(10,2) NOT NULL,
    year_rent DECIMAL(10,2) DEFAULT NULL,
    payment_method INTEGER DEFAULT 1,
    payment_cycle INTEGER DEFAULT NULL,
    payment_count INTEGER DEFAULT 1,
    first_payment_amount DECIMAL(10,2) DEFAULT NULL,
    second_payment_amount DECIMAL(10,2) DEFAULT NULL,
    second_payment_date DATE DEFAULT NULL,
    third_payment_amount DECIMAL(10,2) DEFAULT NULL,
    third_payment_date DATE DEFAULT NULL,

    -- 押金
    deposit DECIMAL(10,2) DEFAULT 0,
    deposit_chinese VARCHAR(100) DEFAULT NULL,

    -- 费用约定
    fee_water BOOLEAN DEFAULT TRUE,
    fee_electric BOOLEAN DEFAULT TRUE,
    fee_gas BOOLEAN DEFAULT TRUE,
    fee_tv BOOLEAN DEFAULT TRUE,
    fee_network BOOLEAN DEFAULT TRUE,
    fee_property BOOLEAN DEFAULT FALSE,
    fee_heating BOOLEAN DEFAULT FALSE,

    -- 丙方居间服务（非必填）
    partyA_commission DECIMAL(10,2) DEFAULT NULL,
    partyA_commission_chinese VARCHAR(100) DEFAULT NULL,
    partyB_commission DECIMAL(10,2) DEFAULT NULL,
    partyB_commission_chinese VARCHAR(100) DEFAULT NULL,

    -- 水电表读数
    electricity_meter DECIMAL(10,2) DEFAULT NULL,
    water_meter DECIMAL(10,2) DEFAULT NULL,
    gas_meter DECIMAL(10,2) DEFAULT NULL,

    -- 物品清单（26项）
    item_tv_qty INTEGER DEFAULT 0,
    item_wardrobe_qty INTEGER DEFAULT 0,
    item_tv_remote_qty INTEGER DEFAULT 0,
    item_tv_table_qty INTEGER DEFAULT 0,
    item_box_qty INTEGER DEFAULT 0,
    item_sofa_qty INTEGER DEFAULT 0,
    item_coffee_table_qty INTEGER DEFAULT 0,
    item_dining_table_qty INTEGER DEFAULT 0,
    item_chair_qty INTEGER DEFAULT 0,
    item_bed_qty INTEGER DEFAULT 0,
    item_nightstand_qty INTEGER DEFAULT 0,
    item_curtain_qty INTEGER DEFAULT 0,
    item_ac_qty INTEGER DEFAULT 0,
    item_ac_remote_qty INTEGER DEFAULT 0,
    item_fridge_qty INTEGER DEFAULT 0,
    item_mattress_qty INTEGER DEFAULT 0,
    item_washer_qty INTEGER DEFAULT 0,
    item_water_heater_qty INTEGER DEFAULT 0,
    item_gas_stove_qty INTEGER DEFAULT 0,
    item_hood_qty INTEGER DEFAULT 0,
    item_induction_qty INTEGER DEFAULT 0,
    item_door_card_qty INTEGER DEFAULT 0,
    item_water_card_qty INTEGER DEFAULT 0,
    item_power_card_qty INTEGER DEFAULT 0,

    -- 备注
    remark TEXT DEFAULT NULL,

    -- 签署状态
    lessor_sign_status INTEGER DEFAULT 0,
    lessee_sign_status INTEGER DEFAULT 0,
    lessor_signed_at DATETIME DEFAULT NULL,
    lessee_signed_at DATETIME DEFAULT NULL,
    lessor_signature TEXT DEFAULT NULL,
    lessee_signature TEXT DEFAULT NULL,
    sign_date DATE DEFAULT NULL,

    -- 合同状态（1:待甲方签署, 2:待乙方签署, 3:已签署, 4:已拒绝, 5:已取消, 6:已到期）
    status INTEGER DEFAULT 1,
    reject_reason VARCHAR(255) DEFAULT NULL,
    effective_at DATETIME DEFAULT NULL,
    expires_at DATETIME DEFAULT NULL,

    -- 签署邀请
    invite_code VARCHAR(64) DEFAULT NULL,
    invite_expires_at DATETIME DEFAULT NULL,

    -- 合同文档
    contract_pdf_path VARCHAR(255) DEFAULT NULL,

    -- 元数据
    created_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    -- 外键约束
    FOREIGN KEY (lessor_user_id) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_openid ON users(openid);
CREATE INDEX IF NOT EXISTS idx_contracts_contract_no ON contracts(contract_no);
CREATE INDEX IF NOT EXISTS idx_contracts_created_by ON contracts(created_by);
CREATE INDEX IF NOT EXISTS idx_contracts_lessee_phone ON contracts(lessee_phone);
CREATE INDEX IF NOT EXISTS idx_contracts_invite_code ON contracts(invite_code);
CREATE INDEX IF NOT EXISTS idx_contracts_lessor_user_id ON contracts(lessor_user_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
