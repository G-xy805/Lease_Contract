# Checklist

## 第一优先级修复（严重问题）✅

- [x] MySQL init.sql users 表包含 role VARCHAR(20) 列
- [x] MySQL init.sql contracts 表与 SQLite 版本字段一致
- [x] migrateMissingColumns 包含 26 项物品清单字段迁移
- [x] migrateMissingColumns 包含 year_rent 字段迁移
- [x] migrateMissingColumns 包含 intermediary_name 字段迁移
- [x] migrateMissingColumns 包含 lessor_contact、lessee_contact 字段迁移
- [x] migrateMissingColumns 包含 partyA_company 字段迁移
- [x] migrateMissingColumns payment_cycle 字段类型为 INTEGER（保留VARCHAR兼容）
- [x] migrateMissingColumns 包含必要的索引创建
- [x] calculateTotalAmount 计算逻辑正确（使用整数运算）
- [x] 配置文件 contractTemplate.ts 已创建
- [x] 硬编码公司名称已移至配置

## 第二优先级修复（中等问题）✅

- [x] init-sqlite.sql 添加 lessee_contact 字段（已存在，无需修改）
- [x] 身份证号格式验证已添加
- [x] 手机号格式验证已添加
- [x] contractsController 中调用验证函数

## 第三优先级修复（优化增强）✅

- [x] 添加 lessor_phone 索引
- [x] 添加 lease_start、lease_end 索引

## 验证检查

- [x] TypeScript 导入语句正确
- [x] 验证函数调用位置正确
- [x] 配置引用正确
- [x] 迁移语句格式正确

## 修复报告

### 已完成的修复

1. **MySQL init.sql** - 添加 role 列 ✅
2. **SQLite init-sqlite.sql** - 验证无差异 ✅
3. **database.ts 迁移** - 添加所有缺失字段（30+ ALTER语句）✅
4. **calculateTotalAmount** - 整数运算修复 ✅
5. **contractTemplate.ts** - 新建配置文件 ✅
6. **contractsController.ts** - 硬编码替换+验证添加 ✅
7. **validation.ts** - 新建验证工具 ✅
8. **索引** - 添加3个新索引 ✅