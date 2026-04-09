-- ============================================================================
-- MySQL 数据库初始化脚本（MySQL 8.0+ 兼容版）
-- 版本: 2.0
-- 说明: 按照合同模板 lease_contract_template.html 的字段顺序重构数据库架构
--       消除数据冗余、完善外键约束、优化索引策略
--       从 SQLite 版本转换，适配 MySQL 8.0+ 语法
-- ============================================================================

-- ==================== MySQL 环境配置 ====================
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================================
-- 表结构定义
-- ============================================================================

-- ==================== 1. users 表（保持现状微调）====================
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    openid VARCHAR(64) DEFAULT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(50) DEFAULT NULL,
    idcard VARCHAR(18) DEFAULT NULL,
    role VARCHAR(20) DEFAULT 'LESSEE',
    status INT DEFAULT 0,
    real_name_status INT DEFAULT 0,
    real_name_at DATETIME DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==================== 2. contracts 表（重点重构 - 按模板14个分组顺序）====================
CREATE TABLE IF NOT EXISTS contracts (
    -- ==================== 分组1 - 基础标识 ====================
    id INT PRIMARY KEY AUTO_INCREMENT,
    contract_no VARCHAR(64) NOT NULL UNIQUE,
    title VARCHAR(200) NOT NULL DEFAULT '房屋租赁合同',
    status INT NOT NULL DEFAULT 1 CHECK(status BETWEEN 1 AND 7),

    -- ==================== 分组2 - 用户关联 ====================
    lessor_user_id INT NOT NULL,                         -- 甲方用户ID
    lessee_user_id INT,                                  -- 乙方用户ID（可为NULL，乙方注册后补充）
    created_by INT NOT NULL,                             -- 创建人ID

    -- ==================== 分组3 - 甲乙双方信息 ====================
    partyA_company VARCHAR(200),                         -- 甲方公司/姓名
    partyA_phone VARCHAR(20),                            -- 甲方联系电话
    partyA_contact VARCHAR(100),                         -- 甲方委托代理人
    partyA_phone2 VARCHAR(20),                           -- 甲方代理人联系电话
    partyA_account VARCHAR(100),                         -- 甲方账户信息
    partyA_idcard VARCHAR(18),                           -- 甲方身份证号

    partyB_name VARCHAR(100),                            -- 乙方姓名
    partyB_idCard VARCHAR(18),                           -- 乙方身份证号
    partyB_phone VARCHAR(20),                            -- 乙方联系电话
    partyB_contact VARCHAR(100),                         -- 乙方委托代理人

    -- ==================== 分组4 - 房屋基本情况 ====================
    house_address VARCHAR(255) NOT NULL,                 -- 房屋地址
    house_area DECIMAL(10,2),                            -- 建筑面积（平方米）

    -- ==================== 分组5 - 租赁期限及用途 ====================
    lease_start_year INT,                                -- 租赁开始年份
    lease_start_month INT,                               -- 租赁开始月份
    lease_start_day INT,                                 -- 租赁开始日期
    lease_end_year INT,                                  -- 租赁结束年份
    lease_end_month INT,                                 -- 租赁结束月份
    lease_end_day INT,                                   -- 租赁结束日期
    lease_months INT,                                    -- 租赁总月数
    rent_purpose VARCHAR(50),                            -- 租赁用途
    advance_notice_days INT,                             -- 提前通知天数

    -- ==================== 分组6 - 租金和支付方式 ====================
    monthly_rent DECIMAL(10,2) NOT NULL,                 -- 月租金
    year_rent DECIMAL(10,2),                             -- 年租金/总租金
    payment_method INT DEFAULT 1 CHECK(payment_method BETWEEN 1 AND 4),  -- 支付方式（1-月付 2-季付 3-半年付 4-年付）
    payment_cycle INT,                                   -- 支付周期（月数）
    payment_count INT DEFAULT 1,                         -- 支付次数
    first_payment_amount DECIMAL(10,2),                  -- 第一次支付金额
    second_payment_amount DECIMAL(10,2),                 -- 第二次支付金额
    third_payment_amount DECIMAL(10,2),                  -- 第三次支付金额
    fourth_payment_amount DECIMAL(10,2),                 -- 第四次支付金额
    partyA_account_for_rent VARCHAR(100),                -- 第三条第3款收款账户

    -- ==================== 分组7 - 押金信息 ====================
    deposit DECIMAL(10,2) DEFAULT 0,                     -- 押金金额
    deposit_chinese VARCHAR(100),                        -- 押金大写

    -- ==================== 分组8 - 费用约定（JSON格式）====================
    fee_items JSON,                                      -- 费用项目JSON（替代原来的7个BOOLEAN字段）

    -- ==================== 分组9 - 居间服务 ====================
    intermediary_name VARCHAR(100),                      -- 中介方名称
    partyA_commission DECIMAL(10,2),                     -- 甲方佣金
    partyA_commission_chinese VARCHAR(100),              -- 甲方佣金大写
    partyB_commission DECIMAL(10,2),                     -- 乙方佣金
    partyB_commission_chinese VARCHAR(100),              -- 乙方佣金大写

    -- ==================== 分组10 - 物品清单及水电表 ====================
    inventory_items JSON,                                -- 物品清单JSON
    electricity_meter VARCHAR(50),                       -- 电表读数
    water_meter VARCHAR(50),                             -- 水表读数
    gas_meter VARCHAR(50),                               -- 燃气表读数

    -- ==================== 分组11 - 备注及其他约定 ====================
    remark TEXT,                                         -- 备注及其他约定

    -- ==================== 分组12 - 合同文档 ====================
    contract_pdf_path VARCHAR(255),                      -- 合同PDF路径

    -- ==================== 分组13 - 状态和时间戳 ====================
    effective_at DATETIME,                               -- 生效时间
    expires_at DATETIME,                                 -- 过期时间
    reject_reason VARCHAR(255),                          -- 拒绝原因
    sign_date DATE,                                      -- 签约日期
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,       -- 创建时间
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,       -- 更新时间

    -- ==================== 外键约束 ====================
    CONSTRAINT fk_contracts_lessor FOREIGN KEY (lessor_user_id) REFERENCES users(id),
    CONSTRAINT fk_contracts_lessee FOREIGN KEY (lessee_user_id) REFERENCES users(id),
    CONSTRAINT fk_contracts_creator FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==================== 3. signatures 表（优化版）====================
CREATE TABLE IF NOT EXISTS signatures (
    id INT PRIMARY KEY AUTO_INCREMENT,
    contract_id INT NOT NULL,                            -- 关联合同ID
    user_id INT,                                         -- 签署用户ID
    sign_role VARCHAR(10) NOT NULL CHECK(sign_role IN ('LESSOR', 'LESSEE')),  -- 签署角色（甲方/乙方）
    sign_name VARCHAR(100) NOT NULL,                     -- 签署人姓名
    sign_phone VARCHAR(20),                              -- 签署人电话
    signature_data TEXT NOT NULL,                        -- 签名图片数据（Base64或路径）
    sign_status INT DEFAULT 1 CHECK(sign_status BETWEEN 0 AND 2),  -- 签署状态（0:待确认 1:已确认 2:已撤销）
    ip_address VARCHAR(50),                              -- 签署时IP地址
    device_info VARCHAR(255),                            -- 设备信息
    sign_location VARCHAR(255),                          -- 签署位置
    signed_at DATETIME DEFAULT CURRENT_TIMESTAMP,        -- 签署时间
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,       -- 创建时间

    -- ==================== 外键约束 ====================
    CONSTRAINT fk_signatures_contract FOREIGN KEY (contract_id) REFERENCES contracts(id),
    CONSTRAINT fk_signatures_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==================== 4. sign_invitations 表（简化为18个字段）====================
CREATE TABLE IF NOT EXISTS sign_invitations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    contract_id INT NOT NULL,                            -- 关联合同ID
    invitation_no VARCHAR(64) NOT NULL UNIQUE,           -- 邀请编号（唯一）
    invite_code VARCHAR(64) NOT NULL UNIQUE,             -- 邀请码（唯一，用于分享链接）
    inviter_id INT NOT NULL,                             -- 邀请人ID
    invitee_name VARCHAR(100) NOT NULL,                  -- 被邀请人姓名
    invitee_phone VARCHAR(20) NOT NULL,                  -- 被邀请人手机号
    invitee_role VARCHAR(10) NOT NULL CHECK(invitee_role IN ('LESSOR', 'LESSEE')),  -- 被邀请人角色
    status INT DEFAULT 0 CHECK(status BETWEEN 0 AND 3),  -- 邀请状态（0:待发送 1:已发送 2:已接受 3:已拒绝）
    expires_at DATETIME NOT NULL,                        -- 过期时间
    accepted_at DATETIME,                                -- 接受时间
    refused_reason VARCHAR(255),                         -- 拒绝原因
    view_count INT DEFAULT 0,                            -- 查看次数
    last_viewed_at DATETIME,                             -- 最后查看时间
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,       -- 创建时间
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,       -- 更新时间

    -- ==================== 外键约束 ====================
    CONSTRAINT fk_invite_contract FOREIGN KEY (contract_id) REFERENCES contracts(id),
    CONSTRAINT fk_invite_inviter FOREIGN KEY (inviter_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==================== 5. contract_templates 表（保持不变）====================
CREATE TABLE IF NOT EXISTS contract_templates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(200) NOT NULL,                          -- 模板名称
    code VARCHAR(64) NOT NULL UNIQUE,                    -- 模板编码（唯一）
    description TEXT DEFAULT NULL,                       -- 模板描述
    html_content TEXT DEFAULT NULL,                      -- HTML内容
    field_mapping JSON DEFAULT NULL,                     -- 字段映射配置（JSON格式）
    category VARCHAR(50) DEFAULT 'standard',             -- 模板分类
    status INT DEFAULT 1,                                -- 状态（1:启用 0:禁用）
    version VARCHAR(20) DEFAULT '1.0',                   -- 版本号
    created_by INT DEFAULT NULL,                         -- 创建人ID
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,       -- 创建时间
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,       -- 更新时间

    -- ==================== 外键约束 ====================
    CONSTRAINT fk_templates_creator FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- 索引创建（包括复合索引 - 性能优化）
-- ============================================================================

-- ==================== users 表索引 ====================
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_openid ON users(openid);
CREATE INDEX idx_users_role ON users(role);

-- ==================== contracts 表索引（优化后）====================
-- 单列索引
CREATE INDEX idx_contracts_no ON contracts(contract_no);
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_contracts_created_by ON contracts(created_by);
CREATE INDEX idx_contracts_lessor_user_id ON contracts(lessor_user_id);
CREATE INDEX idx_contracts_lessee_user_id ON contracts(lessee_user_id);
CREATE INDEX idx_contracts_partyB_phone ON contracts(partyB_phone);
CREATE INDEX idx_contracts_effective ON contracts(effective_at);
CREATE INDEX idx_contracts_expires ON contracts(expires_at);

-- 复合索引（性能优化 - 常用查询场景）
CREATE INDEX idx_contracts_status_created_by ON contracts(status, created_by);
CREATE INDEX idx_contracts_status_lessor ON contracts(status, lessor_user_id, created_at);
CREATE INDEX idx_contracts_status_expires ON contracts(status, expires_at);

-- ==================== signatures 表索引 ====================
CREATE INDEX idx_signatures_contract_id ON signatures(contract_id);
CREATE INDEX idx_signatures_user_id ON signatures(user_id);
CREATE INDEX idx_signatures_signed_at ON signatures(signed_at);
CREATE INDEX idx_signatures_contract_role ON signatures(contract_id, sign_role);

-- ==================== sign_invitations 表索引 ====================
CREATE INDEX idx_invite_contract_id ON sign_invitations(contract_id);
CREATE INDEX idx_invite_invitation_no ON sign_invitations(invitation_no);
CREATE INDEX idx_invite_code ON sign_invitations(invite_code);
CREATE INDEX idx_invite_invitee_phone ON sign_invitations(invitee_phone);
CREATE INDEX idx_invite_status ON sign_invitations(status);
CREATE INDEX idx_invite_contract_status ON sign_invitations(contract_id, status);

-- ==================== contract_templates 表索引 ====================
CREATE INDEX idx_templates_code ON contract_templates(code);
CREATE INDEX idx_templates_status ON contract_templates(status);

-- ==================== 恢复外键检查 ====================
SET FOREIGN_KEY_CHECKS = 1;
