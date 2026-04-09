import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: './config/.env' });

const DB_TYPE = process.env.DB_TYPE || 'mysql';

let mysqlPool: mysql.Pool | null = null;
let sqliteDb: Database.Database | null = null;

interface QueryResult {
  lastID?: number;
  changes?: number;
}

function initMySQL() {
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'lease_contract',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    charset: 'utf8mb4'
  };

  mysqlPool = mysql.createPool(dbConfig);
  console.log('MySQL连接池已创建');
}

function initSQLite() {
  const dbPath = process.env.SQLITE_PATH || './data/lease_contract.db';
  const absolutePath = path.resolve(process.cwd(), dbPath);
  const dbDir = path.dirname(absolutePath);

  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  sqliteDb = new Database(absolutePath);
  sqliteDb.pragma('journal_mode = DELETE');
  console.log(`SQLite数据库已连接: ${absolutePath}`);

  initSQLiteSchema();
}

/**
 * 初始化 SQLite 数据库表结构
 * 从 init-sqlite.sql 文件加载完整的 schema（包含所有表、字段、索引）
 * 加载完成后自动调用 migrateMissingColumns() 进行兼容性迁移
 */
function initSQLiteSchema() {
  if (!sqliteDb) return;

  // 构造 schema 文件路径：backend/src → backend/config/init-sqlite.sql
  const schemaPath = path.resolve(__dirname, '../config/init-sqlite.sql');
  console.log('📋 尝试加载 SQL schema:', schemaPath);

  if (fs.existsSync(schemaPath)) {
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    console.log(`📄 Schema 文件大小: ${schema.length} 字节`);

    try {
      sqliteDb.exec(schema);
      console.log('✅ SQLite 表结构初始化成功');
    } catch (err) {
      console.error('❌ 执行 schema 失败:', err);
    }
  } else {
    console.error('❌ Schema 文件不存在:', schemaPath);
  }

  // 验证表是否创建成功
  try {
    const tables = sqliteDb.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log(`📊 数据库中的表: ${(tables as any[]).map(t => (t as any).name).join(', ')}`);
  } catch (err) {
    console.error('❌ 查询表失败:', err);
  }

  // 执行数据迁移（新增列、数据转移、索引优化）
  migrateMissingColumns();
}

/**
 * 数据库结构迁移函数（全面优化版）
 * 支持从旧版数据库结构平滑迁移到新架构
 *
 * 迁移流程分三个阶段：
 *   第一阶段：新增列迁移（ALTER TABLE 添加缺失字段）
 *   第二阶段：数据迁移（日期拆分、用户关联、签名/邀请数据转移）
 *   第三阶段：索引优化（创建性能优化索引）
 */
function migrateMissingColumns() {
  if (!sqliteDb) return;

  console.log('🔄 开始数据库结构迁移检查...');

  // ===== 第一阶段：新增列迁移 =====
  console.log('📦 [第一阶段] 新增列迁移...');

  const newColumnMigrations = [
    // ==================== users 表新字段 ====================
    "ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'LESSEE'",
    "ALTER TABLE users ADD COLUMN status INTEGER DEFAULT 0",

    // ==================== contracts 表 - 用户关联 ====================
    "ALTER TABLE contracts ADD COLUMN lessee_user_id INTEGER",

    // ==================== contracts 表 - 甲方信息 ====================
    "ALTER TABLE contracts ADD COLUMN partyA_company VARCHAR(200)",
    "ALTER TABLE contracts ADD COLUMN partyA_phone VARCHAR(20)",
    "ALTER TABLE contracts ADD COLUMN partyA_contact VARCHAR(100)",
    "ALTER TABLE contracts ADD COLUMN partyA_phone2 VARCHAR(20)",
    "ALTER TABLE contracts ADD COLUMN partyA_account VARCHAR(100)",
    "ALTER TABLE contracts ADD COLUMN partyA_idcard VARCHAR(18)",

    // ==================== contracts 表 - 乙方信息 ====================
    "ALTER TABLE contracts ADD COLUMN partyB_name VARCHAR(100)",
    "ALTER TABLE contracts ADD COLUMN partyB_idCard VARCHAR(18)",
    "ALTER TABLE contracts ADD COLUMN partyB_phone VARCHAR(20)",
    "ALTER TABLE contracts ADD COLUMN partyB_contact VARCHAR(100)",

    // ==================== contracts 表 - 日期拆分字段（关键！）====================
    "ALTER TABLE contracts ADD COLUMN lease_start_year INTEGER",
    "ALTER TABLE contracts ADD COLUMN lease_start_month INTEGER",
    "ALTER TABLE contracts ADD COLUMN lease_start_day INTEGER",
    "ALTER TABLE contracts ADD COLUMN lease_end_year INTEGER",
    "ALTER TABLE contracts ADD COLUMN lease_end_month INTEGER",
    "ALTER TABLE contracts ADD COLUMN lease_end_day INTEGER",

    // ==================== contracts 表 - 租金相关新字段 ====================
    "ALTER TABLE contracts ADD COLUMN year_rent DECIMAL(10,2)",
    "ALTER TABLE contracts ADD COLUMN payment_cycle INTEGER",
    "ALTER TABLE contracts ADD COLUMN payment_count INTEGER DEFAULT 1",
    "ALTER TABLE contracts ADD COLUMN first_payment_amount DECIMAL(10,2)",
    "ALTER TABLE contracts ADD COLUMN second_payment_amount DECIMAL(10,2)",
    "ALTER TABLE contracts ADD COLUMN third_payment_amount DECIMAL(10,2)",
    "ALTER TABLE contracts ADD COLUMN fourth_payment_amount DECIMAL(10,2)",
    "ALTER TABLE contracts ADD COLUMN partyA_account_for_rent VARCHAR(100)",

    // ==================== contracts 表 - 押金和费用 ====================
    "ALTER TABLE contracts ADD COLUMN deposit_chinese VARCHAR(100)",
    "ALTER TABLE contracts ADD COLUMN fee_items TEXT",

    // ==================== contracts 表 - 居间服务 ====================
    "ALTER TABLE contracts ADD COLUMN intermediary_name VARCHAR(100)",
    "ALTER TABLE contracts ADD COLUMN partyA_commission DECIMAL(10,2)",
    "ALTER TABLE contracts ADD COLUMN partyA_commission_chinese VARCHAR(100)",
    "ALTER TABLE contracts ADD COLUMN partyB_commission DECIMAL(10,2)",
    "ALTER TABLE contracts ADD COLUMN partyB_commission_chinese VARCHAR(100)",

    // ==================== contracts 表 - 物品和水电表 ====================
    "ALTER TABLE contracts ADD COLUMN inventory_items TEXT",
    "ALTER TABLE contracts ADD COLUMN electricity_meter VARCHAR(50)",
    "ALTER TABLE contracts ADD COLUMN water_meter VARCHAR(50)",
    "ALTER TABLE contracts ADD COLUMN gas_meter VARCHAR(50)",

    // ==================== contracts 表 - 其他字段 ====================
    "ALTER TABLE contracts ADD COLUMN remark TEXT",
    "ALTER TABLE contracts ADD COLUMN reject_reason VARCHAR(255)",
    "ALTER TABLE contracts ADD COLUMN sign_date DATE",
    "ALTER TABLE contracts ADD COLUMN contract_pdf_path VARCHAR(255)",
    "ALTER TABLE contracts ADD COLUMN effective_at DATETIME",
    "ALTER TABLE contracts ADD COLUMN expires_at DATETIME",

    // ==================== signatures 表新字段（签名表优化）====================
    "ALTER TABLE signatures ADD COLUMN sign_name VARCHAR(100) DEFAULT ''",
    "ALTER TABLE signatures ADD COLUMN sign_phone VARCHAR(20)",
    "ALTER TABLE signatures ADD COLUMN sign_role VARCHAR(10) DEFAULT 'LESSOR'",
    "ALTER TABLE signatures ADD COLUMN sign_status INTEGER DEFAULT 1",
    "ALTER TABLE signatures ADD COLUMN ip_address VARCHAR(50)",
    "ALTER TABLE signatures ADD COLUMN device_info VARCHAR(255)",
    "ALTER TABLE signatures ADD COLUMN sign_location VARCHAR(255)",
    "ALTER TABLE signatures ADD COLUMN signed_at DATETIME DEFAULT CURRENT_TIMESTAMP",
    "ALTER TABLE signatures ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP",

    // ==================== sign_invitations 表新字段（邀请表优化）====================
    "ALTER TABLE sign_invitations ADD COLUMN invite_code VARCHAR(64)",
    "ALTER TABLE sign_invitations ADD COLUMN invitee_phone VARCHAR(20)",
    "ALTER TABLE sign_invitations ADD COLUMN invitee_role VARCHAR(10) DEFAULT 'LESSEE'",
    "ALTER TABLE sign_invitations ADD COLUMN expires_at DATETIME",
    "ALTER TABLE sign_invitations ADD COLUMN accepted_at DATETIME",
    "ALTER TABLE sign_invitations ADD COLUMN refused_reason VARCHAR(255)",
    "ALTER TABLE sign_invitations ADD COLUMN view_count INTEGER DEFAULT 0",
    "ALTER TABLE sign_invitations ADD COLUMN last_viewed_at DATETIME"
  ];

  let addedColumnsCount = 0;
  for (const sql of newColumnMigrations) {
    try {
      sqliteDb.exec(sql);
      addedColumnsCount++;
    } catch (e) {
      // 列已存在，忽略错误（SQLite 会报 "duplicate column name" 错误）
    }
  }
  console.log(`✅ 新增列迁移完成，成功添加 ${addedColumnsCount} 个字段`);

  // ===== 第二阶段：数据迁移（日期拆分 + 数据转移）=====
  console.log('🔧 [第二阶段] 数据迁移...');

  // 2.1 日期字段拆分：lease_start → lease_start_year/month/day
  try {
    const dateMigrateResult = sqliteDb.prepare(`
      SELECT id, lease_start, lease_end FROM contracts
      WHERE lease_start IS NOT NULL AND lease_start_year IS NULL
    `).all();

    if ((dateMigrateResult as any[]).length > 0) {
      for (const row of dateMigrateResult as any[]) {
        if (row.lease_start) {
          const startDate = new Date(row.lease_start);
          sqliteDb.prepare(`
            UPDATE contracts SET
              lease_start_year = ?, lease_start_month = ?, lease_start_day = ?
            WHERE id = ?
          `).run(
            startDate.getFullYear(),
            startDate.getMonth() + 1,
            startDate.getDate(),
            row.id
          );
        }
        if (row.lease_end) {
          const endDate = new Date(row.lease_end);
          sqliteDb.prepare(`
            UPDATE contracts SET
              lease_end_year = ?, lease_end_month = ?, lease_end_day = ?
            WHERE id = ?
          `).run(
            endDate.getFullYear(),
            endDate.getMonth() + 1,
            endDate.getDate(),
            row.id
          );
        }
      }
      console.log(`✅ 日期字段拆分完成，处理 ${(dateMigrateResult as any[]).length} 条记录`);
    } else {
      console.log('ℹ️  日期字段无需拆分（已是新数据库或无旧数据）');
    }
  } catch (e) {
    console.log('⚠️  日期字段拆分跳过:', e);
  }

  // 2.2 尝试根据 partyB_phone 匹配 lessee_user_id
  try {
    const updateResult = sqliteDb.prepare(`
      UPDATE contracts SET lessee_user_id = (
        SELECT u.id FROM users u WHERE u.phone = contracts.partyB_phone LIMIT 1
      )
      WHERE lessee_user_id IS NULL AND partyB_phone IS NOT NULL AND partyB_phone != ''
    `).run();
    console.log(`✅ lessee_user_id 自动关联完成，影响 ${updateResult.changes} 条记录`);
  } catch (e) {
    console.log('⚠️  lessee_user_id 关联跳过');
  }

  // 2.3 签名数据转移（从 contracts 到 signatures 表）
  try {
    const signMigrateResult = sqliteDb.prepare(`
      SELECT id, partyA_signature, partyA_signed_at, partyB_signature, partyB_signed_at,
             partyA_company, partyB_name, partyA_phone, partyB_phone
      FROM contracts
      WHERE (partyA_signature IS NOT NULL OR partyB_signature IS NOT NULL)
    `).all();

    if ((signMigrateResult as any[]).length > 0) {
      let migratedCount = 0;
      for (const row of signMigrateResult as any[]) {
        // 转移甲方签名
        if (row.partyA_signature) {
          try {
            sqliteDb.prepare(`
              INSERT OR IGNORE INTO signatures (
                contract_id, sign_role, sign_name, sign_phone,
                signature_data, signed_at
              ) VALUES (?, 'LESSOR', ?, ?, ?, ?)
            `).run(
              row.id,
              row.partyA_company || '',
              row.partyA_phone || '',
              row.partyA_signature,
              row.partyA_signed_at
            );
            migratedCount++;
          } catch (e2) { /* 忽略重复 */ }
        }
        // 转移乙方签名
        if (row.partyB_signature) {
          try {
            sqliteDb.prepare(`
              INSERT OR IGNORE INTO signatures (
                contract_id, sign_role, sign_name, sign_phone,
                signature_data, signed_at
              ) VALUES (?, 'LESSEE', ?, ?, ?, ?)
            `).run(
              row.id,
              row.partyB_name || '',
              row.partyB_phone || '',
              row.partyB_signature,
              row.partyB_signed_at
            );
            migratedCount++;
          } catch (e2) { /* 忽略重复 */ }
        }
      }
      console.log(`✅ 签名数据转移完成，处理 ${migratedCount} 条签名记录`);
    } else {
      console.log('ℹ️  无需签名数据转移（可能是新数据库或无旧签名）');
    }
  } catch (e) {
    console.log('⚠️  签名数据转移跳过:', e);
  }

  // 2.4 邀请码数据转移到 sign_invitations 表
  try {
    const inviteMigrateResult = sqliteDb.prepare(`
      SELECT id, invite_code, invite_expires_at, partyB_name, partyB_phone
      FROM contracts
      WHERE invite_code IS NOT NULL
    `).all();

    if ((inviteMigrateResult as any[]).length > 0) {
      let migratedCount = 0;
      for (const row of inviteMigrateResult as any[]) {
        try {
          sqliteDb.prepare(`
            INSERT OR IGNORE INTO sign_invitations (
              contract_id, invitation_no, invite_code, inviter_id,
              invitee_name, invitee_phone, invitee_role, status, expires_at
            ) VALUES (?, ?, ?, 0, ?, ?, 'LESSEE', 0, ?)
          `).run(
            row.id,
            row.invite_code,
            row.invite_code,
            row.partyB_name || '',
            row.partyB_phone || '',
            row.invite_expires_at
          );
          migratedCount++;
        } catch (e2) { /* 忽略重复 */ }
      }
      console.log(`✅ 邀请数据转移完成，处理 ${migratedCount} 条邀请记录`);
    } else {
      console.log('ℹ️  无需邀请数据转移（可能是新数据库或无旧邀请）');
    }
  } catch (e) {
    console.log('⚠️  邀请数据转移跳过:', e);
  }

  // ===== 第三阶段：创建/验证索引 =====
  console.log('⚡ [第三阶段] 索引验证与优化...');

  try {
    const indexStatements = [
      // ==================== users 表索引 ====================
      'CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)',
      'CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone)',
      'CREATE INDEX IF NOT EXISTS idx_users_openid ON users(openid)',

      // ==================== contracts 表索引（单列）====================
      'CREATE INDEX IF NOT EXISTS idx_contracts_no ON contracts(contract_no)',
      'CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status)',
      'CREATE INDEX IF NOT EXISTS idx_contracts_created_by ON contracts(created_by)',
      'CREATE INDEX IF NOT EXISTS idx_contracts_lessor_user_id ON contracts(lessor_user_id)',
      'CREATE INDEX IF NOT EXISTS idx_contracts_lessee_user_id ON contracts(lessee_user_id)',
      'CREATE INDEX IF NOT EXISTS idx_contracts_partyB_phone ON contracts(partyB_phone)',
      'CREATE INDEX IF NOT EXISTS idx_contracts_effective ON contracts(effective_at)',
      'CREATE INDEX IF NOT EXISTS idx_contracts_expires ON contracts(expires_at)',

      // ==================== contracts 表索引（复合索引 - 性能优化）====================
      'CREATE INDEX IF NOT EXISTS idx_contracts_status_created_by ON contracts(status, created_by)',
      'CREATE INDEX IF NOT EXISTS idx_contracts_status_lessor ON contracts(status, lessor_user_id, created_at)',

      // ==================== signatures 表索引 ====================
      'CREATE INDEX IF NOT EXISTS idx_signatures_contract_id ON signatures(contract_id)',
      'CREATE INDEX IF NOT EXISTS idx_signatures_user_id ON signatures(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_signatures_signed_at ON signatures(signed_at)',

      // ==================== sign_invitations 表索引 ====================
      'CREATE INDEX IF NOT EXISTS idx_invite_contract_id ON sign_invitations(contract_id)',
      'CREATE INDEX IF NOT EXISTS idx_invite_invitation_no ON sign_invitations(invitation_no)',
      'CREATE INDEX IF NOT EXISTS idx_invite_code ON sign_invitations(invite_code)',
      'CREATE INDEX IF NOT EXISTS idx_invite_invitee_phone ON sign_invitations(invitee_phone)',
      'CREATE INDEX IF NOT EXISTS idx_invite_status ON sign_invitations(status)',
      // ==================== 复合索引（性能优化）====================
      'CREATE INDEX IF NOT EXISTS idx_contracts_status_expires ON contracts(status, expires_at)',
      'CREATE INDEX IF NOT EXISTS idx_signatures_contract_role ON signatures(contract_id, sign_role)',
      'CREATE INDEX IF NOT EXISTS idx_invite_contract_status ON sign_invitations(contract_id, status)',
      // ==================== contract_templates 表索引 ====================
      'CREATE INDEX IF NOT EXISTS idx_templates_code ON contract_templates(code)',
      'CREATE INDEX IF NOT EXISTS idx_templates_status ON contract_templates(status)'
    ];

    let indexCreatedCount = 0;
    for (const sql of indexStatements) {
      try {
        sqliteDb.exec(sql);
        indexCreatedCount++;
      } catch (e) {
        // 索引已存在或其他错误，忽略
      }
    }
    console.log(`✅ 索引验证完成，成功创建/验证 ${indexCreatedCount} 个索引`);
  } catch (e) {
    console.error('❌ 索引创建失败:', e);
  }

  console.log('🎉 数据库迁移检查全部完成！');
}

export const testConnection = async (): Promise<void> => {
  try {
    if (DB_TYPE === 'sqlite') {
      if (sqliteDb) {
        sqliteDb.exec('SELECT 1');
        console.log('SQLite数据库连接成功');
      }
    } else {
      if (mysqlPool) {
        const connection = await mysqlPool.getConnection();
        connection.release();
        console.log('MySQL数据库连接成功');
      }
    }
  } catch (error) {
    console.error('数据库连接失败:', error);
    throw error;
  }
};

export const query = async <T extends any[]>(
  sql: string,
  params?: any[]
): Promise<T> => {
  if (DB_TYPE === 'sqlite') {
    if (!sqliteDb) throw new Error('SQLite未初始化');

    const stmt = sqliteDb.prepare(sql);
    const result = params && params.length > 0
      ? stmt.all(...params)
      : stmt.all();
    return result as T;
  } else {
    if (!mysqlPool) throw new Error('MySQL未初始化');
    const [rows] = await mysqlPool.query(sql, params);
    return rows as T;
  }
};

export const insert = async (
  sql: string,
  params?: any[]
): Promise<{ insertId: number; affectedRows: number }> => {
  if (DB_TYPE === 'sqlite') {
    if (!sqliteDb) throw new Error('SQLite未初始化');

    const stmt = sqliteDb.prepare(sql);
    const processedParams = params ? params.map(p => {
      if (p instanceof Date) {
        return p.toISOString();
      }
      return p;
    }) : undefined;

    const result = processedParams && processedParams.length > 0
      ? stmt.run(...processedParams)
      : stmt.run();

    return {
      insertId: Number(result.lastInsertRowid),
      affectedRows: result.changes
    };
  } else {
    if (!mysqlPool) throw new Error('MySQL未初始化');
    const [result] = await mysqlPool.execute(sql, params);
    const res = result as mysql.ResultSetHeader;
    return {
      insertId: Number(res.insertId),
      affectedRows: res.affectedRows
    };
  }
};

export const execute = async (
  sql: string,
  params?: any[]
): Promise<{ affectedRows: number }> => {
  if (DB_TYPE === 'sqlite') {
    if (!sqliteDb) throw new Error('SQLite未初始化');

    const stmt = sqliteDb.prepare(sql);
    const result = params && params.length > 0
      ? stmt.run(...params)
      : stmt.run();

    return { affectedRows: result.changes };
  } else {
    if (!mysqlPool) throw new Error('MySQL未初始化');
    const [result] = await mysqlPool.execute(sql, params);
    const res = result as mysql.ResultSetHeader;
    return { affectedRows: res.affectedRows };
  }
};

export const transaction = async <T>(
  callback: (connection: any) => Promise<T>
): Promise<T> => {
  if (DB_TYPE === 'sqlite') {
    if (!sqliteDb) throw new Error('SQLite未初始化');

    return new Promise((resolve, reject) => {
      const transaction = sqliteDb!.transaction(() => {
        return callback(sqliteDb);
      });

      try {
        const result = transaction();
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  } else {
    if (!mysqlPool) throw new Error('MySQL未初始化');
    const connection = await mysqlPool.getConnection();
    try {
      await connection.beginTransaction();
      const result = await callback(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
};

export const close = (): void => {
  if (DB_TYPE === 'sqlite' && sqliteDb) {
    sqliteDb.close();
    sqliteDb = null;
    console.log('SQLite数据库连接已关闭');
  }
};

if (DB_TYPE === 'mysql') {
  initMySQL();
} else if (DB_TYPE === 'sqlite') {
  initSQLite();
}

export { DB_TYPE };
export default DB_TYPE === 'sqlite' ? sqliteDb : mysqlPool;
