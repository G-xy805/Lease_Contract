-- 租赁合同系统数据库初始化脚本
-- 根据 spec.md 设计
-- MySQL 版本

CREATE DATABASE IF NOT EXISTS lease_contract DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE lease_contract;

-- 用户表（11个字段）
CREATE TABLE IF NOT EXISTS users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    openid VARCHAR(64) DEFAULT NULL COMMENT '微信openid',
    phone VARCHAR(20) NOT NULL UNIQUE COMMENT '手机号（登录账号）',
    name VARCHAR(50) DEFAULT NULL COMMENT '姓名',
    idcard VARCHAR(18) DEFAULT NULL COMMENT '身份证号',
    idcard_front VARCHAR(255) DEFAULT NULL COMMENT '身份证正面照片路径',
    idcard_back VARCHAR(255) DEFAULT NULL COMMENT '身份证背面照片路径',
    real_name_status TINYINT DEFAULT 0 COMMENT '实名认证状态（0:未认证, 1:已认证）',
    real_name_at DATETIME DEFAULT NULL COMMENT '实名认证时间',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_phone (phone),
    INDEX idx_openid (openid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- 合同主表（与 lease_contract_template.html 模板占位符一一对应）
CREATE TABLE IF NOT EXISTS contracts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    contract_no VARCHAR(64) NOT NULL UNIQUE COMMENT '合同编号',
    title VARCHAR(200) NOT NULL COMMENT '合同标题',

    -- 甲方（出租方）信息
    lessor_user_id BIGINT UNSIGNED NOT NULL COMMENT '甲方用户ID',
    lessor_name VARCHAR(100) NOT NULL COMMENT '甲方姓名',
    lessor_phone VARCHAR(20) NOT NULL COMMENT '甲方联系电话',
    lessor_phone2 VARCHAR(20) DEFAULT NULL COMMENT '甲方第二个电话',
    lessor_idcard VARCHAR(18) DEFAULT NULL COMMENT '甲方身份证号',
    lessor_account VARCHAR(100) DEFAULT NULL COMMENT '甲方收款账户',
    lessor_contact VARCHAR(50) DEFAULT NULL COMMENT '甲方委托代理人',
    partyA_company VARCHAR(200) DEFAULT NULL COMMENT '甲方公司名称',

    -- 乙方（承租方）信息
    lessee_name VARCHAR(100) NOT NULL COMMENT '乙方姓名',
    lessee_phone VARCHAR(20) NOT NULL COMMENT '乙方联系电话',
    lessee_idcard VARCHAR(18) DEFAULT NULL COMMENT '乙方身份证号',
    lessee_contact VARCHAR(50) DEFAULT NULL COMMENT '乙方委托代理人',

    -- 房屋信息
    house_address VARCHAR(255) NOT NULL COMMENT '房屋地址',
    house_area DECIMAL(10,2) DEFAULT NULL COMMENT '房屋面积（平方米）',
    rent_purpose VARCHAR(50) DEFAULT NULL COMMENT '租赁用途',

    -- 租赁期限
    lease_start DATE NOT NULL COMMENT '租赁开始日期',
    lease_end DATE NOT NULL COMMENT '租赁结束日期',
    lease_months INT DEFAULT NULL COMMENT '租赁月数',
    advance_notice_days INT DEFAULT NULL COMMENT '提前通知天数',

    -- 租金信息
    monthly_rent DECIMAL(10,2) NOT NULL COMMENT '月租金',
    year_rent DECIMAL(10,2) DEFAULT NULL COMMENT '年租金',
    payment_method TINYINT DEFAULT 1 COMMENT '支付方式（1:月付, 3:季付, 6:半年付, 12:年付）',
    payment_cycle INT DEFAULT NULL COMMENT '支付周期（月数）',
    payment_count INT DEFAULT 1 COMMENT '支付次数',
    first_payment_amount DECIMAL(10,2) DEFAULT NULL COMMENT '第一次支付金额',
    second_payment_amount DECIMAL(10,2) DEFAULT NULL COMMENT '第二次支付金额',
    second_payment_date DATE DEFAULT NULL COMMENT '第二次支付日期',
    third_payment_amount DECIMAL(10,2) DEFAULT NULL COMMENT '第三次支付金额',
    third_payment_date DATE DEFAULT NULL COMMENT '第三次支付日期',

    -- 押金
    deposit DECIMAL(10,2) DEFAULT 0 COMMENT '押金金额',
    deposit_chinese VARCHAR(100) DEFAULT NULL COMMENT '押金金额中文大写',

    -- 费用约定
    fee_water TINYINT(1) DEFAULT 1 COMMENT '水费乙方承担',
    fee_electric TINYINT(1) DEFAULT 1 COMMENT '电费乙方承担',
    fee_gas TINYINT(1) DEFAULT 1 COMMENT '燃气费乙方承担',
    fee_tv TINYINT(1) DEFAULT 1 COMMENT '电视费乙方承担',
    fee_network TINYINT(1) DEFAULT 1 COMMENT '网络费乙方承担',
    fee_property TINYINT(1) DEFAULT 0 COMMENT '物业费甲方承担',
    fee_heating TINYINT(1) DEFAULT 0 COMMENT '暖气费甲方承担',

    -- 丙方居间服务（非必填）
    partyA_commission DECIMAL(10,2) DEFAULT NULL COMMENT '甲方佣金',
    partyA_commission_chinese VARCHAR(100) DEFAULT NULL COMMENT '甲方佣金中文大写',
    partyB_commission DECIMAL(10,2) DEFAULT NULL COMMENT '乙方佣金',
    partyB_commission_chinese VARCHAR(100) DEFAULT NULL COMMENT '乙方佣金中文大写',

    -- 水电表读数
    electricity_meter DECIMAL(10,2) DEFAULT NULL COMMENT '电表读数',
    water_meter DECIMAL(10,2) DEFAULT NULL COMMENT '水表读数',
    gas_meter DECIMAL(10,2) DEFAULT NULL COMMENT '燃气表读数',

    -- 物品清单（26项）
    item_tv_qty INT DEFAULT 0 COMMENT '电视数量',
    item_wardrobe_qty INT DEFAULT 0 COMMENT '衣柜数量',
    item_tv_remote_qty INT DEFAULT 0 COMMENT '电视遥控器数量',
    item_tv_table_qty INT DEFAULT 0 COMMENT '电视柜数量',
    item_box_qty INT DEFAULT 0 COMMENT '机顶盒数量',
    item_sofa_qty INT DEFAULT 0 COMMENT '沙发数量',
    item_coffee_table_qty INT DEFAULT 0 COMMENT '茶几数量',
    item_dining_table_qty INT DEFAULT 0 COMMENT '餐桌数量',
    item_chair_qty INT DEFAULT 0 COMMENT '餐桌椅子数量',
    item_bed_qty INT DEFAULT 0 COMMENT '床数量',
    item_nightstand_qty INT DEFAULT 0 COMMENT '床头柜数量',
    item_curtain_qty INT DEFAULT 0 COMMENT '窗帘数量',
    item_ac_qty INT DEFAULT 0 COMMENT '空调数量',
    item_ac_remote_qty INT DEFAULT 0 COMMENT '空调遥控器数量',
    item_fridge_qty INT DEFAULT 0 COMMENT '冰箱数量',
    item_mattress_qty INT DEFAULT 0 COMMENT '床垫子数量',
    item_washer_qty INT DEFAULT 0 COMMENT '洗衣机数量',
    item_water_heater_qty INT DEFAULT 0 COMMENT '热水器数量',
    item_gas_stove_qty INT DEFAULT 0 COMMENT '煤气灶数量',
    item_hood_qty INT DEFAULT 0 COMMENT '油烟机数量',
    item_induction_qty INT DEFAULT 0 COMMENT '电磁灶数量',
    item_door_card_qty INT DEFAULT 0 COMMENT '门禁卡数量',
    item_water_card_qty INT DEFAULT 0 COMMENT '水卡数量',
    item_power_card_qty INT DEFAULT 0 COMMENT '电卡数量',

    -- 备注
    remark TEXT DEFAULT NULL COMMENT '合同备注',

    -- 签署状态
    lessor_sign_status TINYINT DEFAULT 0 COMMENT '甲方签署状态（0:未签署, 1:已签署）',
    lessee_sign_status TINYINT DEFAULT 0 COMMENT '乙方签署状态（0:未签署, 1:已签署）',
    lessor_signed_at DATETIME DEFAULT NULL COMMENT '甲方签署时间',
    lessee_signed_at DATETIME DEFAULT NULL COMMENT '乙方签署时间',
    lessor_signature TEXT DEFAULT NULL COMMENT '甲方签名图片（Base64）',
    lessee_signature TEXT DEFAULT NULL COMMENT '乙方签名图片（Base64）',
    sign_date DATE DEFAULT NULL COMMENT '签约日期',

    -- 合同状态（1:待甲方签署, 2:待乙方签署, 3:已签署, 4:已拒绝, 5:已取消, 6:已到期）
    status TINYINT DEFAULT 1 COMMENT '合同状态',
    reject_reason VARCHAR(255) DEFAULT NULL COMMENT '拒绝原因',
    effective_at DATETIME DEFAULT NULL COMMENT '合同生效时间',
    expires_at DATETIME DEFAULT NULL COMMENT '合同到期时间',

    -- 签署邀请
    invite_code VARCHAR(64) DEFAULT NULL COMMENT '乙方签署邀请码',
    invite_expires_at DATETIME DEFAULT NULL COMMENT '邀请过期时间',

    -- 合同文档
    contract_pdf_path VARCHAR(255) DEFAULT NULL COMMENT '生成的正式合同PDF路径',

    -- 元数据
    created_by BIGINT UNSIGNED NOT NULL COMMENT '创建人用户ID',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

    -- 外键约束
    FOREIGN KEY (lessor_user_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,

    -- 索引
    INDEX idx_contract_no (contract_no),
    INDEX idx_created_by (created_by),
    INDEX idx_lessee_phone (lessee_phone),
    INDEX idx_invite_code (invite_code),
    INDEX idx_lessor_user_id (lessor_user_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='合同主表';
