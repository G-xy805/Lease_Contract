-- 租赁合同系统数据库初始化脚本
-- 根据 spec.md 设计
-- MySQL 版本

CREATE DATABASE IF NOT EXISTS lease_contract DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE lease_contract;

-- 用户表（与模板字段对应）
CREATE TABLE IF NOT EXISTS users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    openid VARCHAR(64) DEFAULT NULL COMMENT '微信openid',
    phone VARCHAR(20) NOT NULL UNIQUE COMMENT '手机号（登录账号）',
    name VARCHAR(50) DEFAULT NULL COMMENT '姓名',
    idcard VARCHAR(18) DEFAULT NULL COMMENT '身份证号',
    role ENUM('LESSOR', 'LESSEE', 'ADMIN') DEFAULT 'LESSEE' COMMENT '用户角色（LESSOR:出租方, LESSEE:承租方, ADMIN:管理员）',
    real_name_status TINYINT DEFAULT 0 COMMENT '实名认证状态（0:未认证, 1:已认证）',
    real_name_at DATETIME DEFAULT NULL COMMENT '实名认证时间',
    status TINYINT DEFAULT 0 COMMENT '账号状态（0:正常, 1:封禁）',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_users_phone (phone),
    INDEX idx_users_openid (openid),
    INDEX idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- 合同主表（与 lease_contract_template.html 模板占位符一一对应）
CREATE TABLE IF NOT EXISTS contracts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    contract_no VARCHAR(64) NOT NULL UNIQUE COMMENT '合同编号',
    title VARCHAR(200) NOT NULL COMMENT '合同标题',

    -- 合同状态（1:待签署, 2:待乙方签署, 3:已签署, 4:已拒绝, 5:已取消）
    status TINYINT DEFAULT 1 COMMENT '合同状态',
    reject_reason VARCHAR(255) DEFAULT NULL COMMENT '拒绝原因',

    -- 创建人信息
    created_by BIGINT UNSIGNED NOT NULL COMMENT '创建人用户ID',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

    -- 甲方（出租方）信息
    lessor_user_id BIGINT UNSIGNED NOT NULL COMMENT '甲方用户ID',
    partyA_company VARCHAR(200) DEFAULT NULL COMMENT '甲方公司/姓名',
    partyA_phone VARCHAR(20) COMMENT '甲方电话',
    partyA_contact VARCHAR(100) COMMENT '甲方代理人',
    partyA_phone2 VARCHAR(20) COMMENT '甲方备用电话',
    partyA_account VARCHAR(100) COMMENT '甲方收款账户',

    -- 乙方（承租方）信息
    partyB_name VARCHAR(100) COMMENT '乙方姓名',
    partyB_idCard VARCHAR(18) COMMENT '乙方身份证',
    partyB_phone VARCHAR(20) COMMENT '乙方电话',
    partyB_contact VARCHAR(100) COMMENT '乙方代理人',

    -- 房屋信息
    house_address VARCHAR(255) NOT NULL COMMENT '房屋地址',
    house_area DECIMAL(10,2) DEFAULT NULL COMMENT '建筑面积（平方米）',
    rent_purpose VARCHAR(50) DEFAULT NULL COMMENT '租赁用途',

    -- 租赁期限
    lease_start DATE NOT NULL COMMENT '租赁开始日期',
    lease_end DATE NOT NULL COMMENT '租赁结束日期',
    lease_months INT DEFAULT NULL COMMENT '租赁月数',
    advance_notice_days INT DEFAULT NULL COMMENT '提前通知天数',

    -- 租金信息
    monthly_rent DECIMAL(10,2) NOT NULL COMMENT '每月租金（元）',
    year_rent DECIMAL(10,2) DEFAULT NULL COMMENT '年租金（自动计算 = monthly_rent * 12）',
    payment_method TINYINT DEFAULT 1 COMMENT '支付方式（1:月付, 2:季付, 3:半年付, 4:年付）',
    payment_cycle INT DEFAULT NULL COMMENT '支付周期（月数）',
    payment_count INT DEFAULT NULL COMMENT '租金分几次支付',
    first_payment_amount DECIMAL(10,2) DEFAULT NULL COMMENT '第一次支付金额',
    second_payment_amount DECIMAL(10,2) DEFAULT NULL COMMENT '第二次支付金额',
    second_payment_date DATE DEFAULT NULL COMMENT '第二次支付日期',
    third_payment_amount DECIMAL(10,2) DEFAULT NULL COMMENT '第三次支付金额',
    deposit DECIMAL(10,2) DEFAULT 0 COMMENT '押金（小写）',
    deposit_chinese VARCHAR(100) DEFAULT NULL COMMENT '押金（大写）',
    total_amount DECIMAL(12,2) COMMENT '合同总金额',

    -- 居间信息
    intermediary_name VARCHAR(100) COMMENT '居间人名称',
    partyA_commission DECIMAL(10,2) DEFAULT NULL COMMENT '甲方佣金',
    partyA_commission_chinese VARCHAR(100) DEFAULT NULL COMMENT '甲方佣金大写',
    partyB_commission DECIMAL(10,2) DEFAULT NULL COMMENT '乙方佣金',
    partyB_commission_chinese VARCHAR(100) DEFAULT NULL COMMENT '乙方佣金大写',

    -- 费用约定
    fee_water TINYINT(1) DEFAULT 1 COMMENT '水费乙方承担',
    fee_electric TINYINT(1) DEFAULT 1 COMMENT '电费乙方承担',
    fee_gas TINYINT(1) DEFAULT 1 COMMENT '燃气费乙方承担',
    fee_property TINYINT(1) DEFAULT 0 COMMENT '物业费乙方承担',
    fee_heating TINYINT(1) DEFAULT 0 COMMENT '暖气费乙方承担',

    -- 物品清单（JSON格式）
    inventory_items TEXT COMMENT '物品清单JSON数组',

    -- 水电表读数
    electricity_meter VARCHAR(50) DEFAULT NULL COMMENT '电表数',
    water_meter VARCHAR(50) DEFAULT NULL COMMENT '水表数',
    gas_meter VARCHAR(50) DEFAULT NULL COMMENT '煤气表数',

    -- 备注
    remark TEXT DEFAULT NULL COMMENT '备注',

    -- 签署状态
    partyA_sign_status TINYINT DEFAULT 0 COMMENT '甲方签署状态（0:未签, 1:已签）',
    partyB_sign_status TINYINT DEFAULT 0 COMMENT '乙方签署状态（0:未签, 1:已签）',
    partyA_signed_at DATETIME DEFAULT NULL COMMENT '甲方签署时间',
    partyB_signed_at DATETIME DEFAULT NULL COMMENT '乙方签署时间',
    partyA_signature TEXT DEFAULT NULL COMMENT '甲方签名图片（Base64）',
    partyB_signature TEXT DEFAULT NULL COMMENT '乙方签名图片（Base64）',
    sign_date DATE DEFAULT NULL COMMENT '签约日期',

    -- 合同有效期
    effective_at DATETIME DEFAULT NULL COMMENT '合同生效时间',
    expires_at DATETIME DEFAULT NULL COMMENT '合同到期时间',

    -- 签署邀请
    invite_code VARCHAR(64) DEFAULT NULL COMMENT '签署邀请码',
    invite_expires_at DATETIME DEFAULT NULL COMMENT '邀请过期时间',

    -- 合同文档
    contract_pdf_path VARCHAR(255) DEFAULT NULL COMMENT 'PDF文件路径',

    -- 外键约束
    FOREIGN KEY (lessor_user_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,

    -- 索引（统一使用 idx_ 前缀）
    UNIQUE INDEX idx_contracts_no (contract_no),
    INDEX idx_contracts_status (status),
    INDEX idx_contracts_created_by (created_by),
    INDEX idx_contracts_lessor_user_id (lessor_user_id),
    INDEX idx_contracts_partyB_phone (partyB_phone),
    INDEX idx_contracts_invite_code (invite_code),
    INDEX idx_contracts_effective (effective_at),
    INDEX idx_contracts_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='合同主表';
