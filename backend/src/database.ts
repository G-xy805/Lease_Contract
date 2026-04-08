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

function initSQLiteSchema() {
  if (!sqliteDb) return;

  const schemaPath = path.resolve(__dirname, '../config/init-sqlite.sql');
  console.log('尝试加载SQL schema:', schemaPath);

  if (fs.existsSync(schemaPath)) {
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    console.log('Schema文件大小:', schema.length, '字节');

    try {
      sqliteDb.exec(schema);
      console.log('SQLite表结构已初始化');
    } catch (err) {
      console.error('执行schema失败:', err);
    }
  } else {
    console.error('Schema文件不存在:', schemaPath);
  }

  // 验证表是否创建成功
  try {
    const tables = sqliteDb.exec("SELECT name FROM sqlite_master WHERE type='table'");
    console.log('数据库中的表:', tables);
  } catch (err) {
    console.error('查询表失败:', err);
  }

  migrateMissingColumns();
}

function migrateMissingColumns() {
  if (!sqliteDb) return;

  const alterStatements = [
    // users 表迁移
    // role 字段: PARTY_B -> LESSEE
    "ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'LESSEE'",
    // status 字段
    "ALTER TABLE users ADD COLUMN status INTEGER DEFAULT 0",

    // contracts 表迁移 - 甲乙方字段重命名
    "ALTER TABLE contracts ADD COLUMN partyA_company VARCHAR(200)",
    "ALTER TABLE contracts ADD COLUMN partyA_phone VARCHAR(20)",
    "ALTER TABLE contracts ADD COLUMN partyA_idcard VARCHAR(18)",
    "ALTER TABLE contracts ADD COLUMN partyA_account VARCHAR(100)",
    "ALTER TABLE contracts ADD COLUMN partyA_contact VARCHAR(100)",
    "ALTER TABLE contracts ADD COLUMN partyA_phone2 VARCHAR(20)",
    "ALTER TABLE contracts ADD COLUMN partyB_name VARCHAR(100)",
    "ALTER TABLE contracts ADD COLUMN partyB_phone VARCHAR(20)",
    "ALTER TABLE contracts ADD COLUMN partyB_idCard VARCHAR(18)",
    "ALTER TABLE contracts ADD COLUMN partyB_contact VARCHAR(100)",

    // 物品清单改为 JSON
    "ALTER TABLE contracts ADD COLUMN inventory_items TEXT",

    // 合同基础信息
    "ALTER TABLE contracts ADD COLUMN lessor_account VARCHAR(100)",
    "ALTER TABLE contracts ADD COLUMN rent_purpose VARCHAR(50)",
    "ALTER TABLE contracts ADD COLUMN lease_months INTEGER",
    "ALTER TABLE contracts ADD COLUMN advance_notice_days INTEGER",
    "ALTER TABLE contracts ADD COLUMN payment_cycle VARCHAR(20)",
    "ALTER TABLE contracts ADD COLUMN payment_count INTEGER DEFAULT 1",
    "ALTER TABLE contracts ADD COLUMN first_payment_amount DECIMAL(10,2)",
    "ALTER TABLE contracts ADD COLUMN first_payment_date DATE",
    "ALTER TABLE contracts ADD COLUMN second_payment_amount DECIMAL(10,2)",
    "ALTER TABLE contracts ADD COLUMN second_payment_date DATE",
    "ALTER TABLE contracts ADD COLUMN third_payment_amount DECIMAL(10,2)",
    "ALTER TABLE contracts ADD COLUMN third_payment_date DATE",
    "ALTER TABLE contracts ADD COLUMN fourth_payment_amount DECIMAL(10,2)",
    "ALTER TABLE contracts ADD COLUMN deposit_chinese VARCHAR(100)",
    "ALTER TABLE contracts ADD COLUMN total_amount DECIMAL(12,2)",

    // 费用约定 - 使用 fee_items JSON 字段存储
    "ALTER TABLE contracts ADD COLUMN fee_items TEXT",
    "ALTER TABLE contracts ADD COLUMN fee_tv BOOLEAN DEFAULT FALSE",
    "ALTER TABLE contracts ADD COLUMN fee_network BOOLEAN DEFAULT FALSE",

    // 居间信息
    "ALTER TABLE contracts ADD COLUMN intermediary_name VARCHAR(100)",
    "ALTER TABLE contracts ADD COLUMN partyA_commission DECIMAL(10,2)",
    "ALTER TABLE contracts ADD COLUMN partyA_commission_chinese VARCHAR(100)",
    "ALTER TABLE contracts ADD COLUMN partyB_commission DECIMAL(10,2)",
    "ALTER TABLE contracts ADD COLUMN partyB_commission_chinese VARCHAR(100)",

    // 签署信息
    "ALTER TABLE contracts ADD COLUMN partyA_sign_status INTEGER DEFAULT 0",
    "ALTER TABLE contracts ADD COLUMN partyB_sign_status INTEGER DEFAULT 0",

    // 物品清单相关
    "ALTER TABLE contracts ADD COLUMN electricity_meter VARCHAR(50)",
    "ALTER TABLE contracts ADD COLUMN water_meter VARCHAR(50)",
    "ALTER TABLE contracts ADD COLUMN gas_meter VARCHAR(50)",

    // 其他
    "ALTER TABLE contracts ADD COLUMN remark TEXT",
    "ALTER TABLE contracts ADD COLUMN reject_reason VARCHAR(255)",
    "ALTER TABLE contracts ADD COLUMN year_rent DECIMAL(10,2)"
  ];

  for (const sql of alterStatements) {
    try {
      sqliteDb.exec(sql);
    } catch (e) {
      // 列已存在，忽略错误
    }
  }

  // 创建索引
  try {
    sqliteDb.exec('CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)');
    sqliteDb.exec('CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone)');
    sqliteDb.exec('CREATE INDEX IF NOT EXISTS idx_users_openid ON users(openid)');
    sqliteDb.exec('CREATE INDEX IF NOT EXISTS idx_contracts_partyB_phone ON contracts(partyB_phone)');
    sqliteDb.exec('CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status)');
    sqliteDb.exec('CREATE INDEX IF NOT EXISTS idx_contracts_lessor_user ON contracts(lessor_user_id)');
    sqliteDb.exec('CREATE INDEX IF NOT EXISTS idx_contracts_invite_code ON contracts(invite_code)');

    // 创建 sign_invitations 表（如果不存在）
    sqliteDb.exec(`
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
      )
    `);

    // 创建 sign_invitations 表索引
    sqliteDb.exec('CREATE INDEX IF NOT EXISTS idx_sign_invitations_contract_id ON sign_invitations(contract_id)');
    sqliteDb.exec('CREATE INDEX IF NOT EXISTS idx_sign_invitations_invitation_no ON sign_invitations(invitation_no)');
    sqliteDb.exec('CREATE INDEX IF NOT EXISTS idx_sign_invitations_receiver_phone ON sign_invitations(receiver_phone)');
    sqliteDb.exec('CREATE INDEX IF NOT EXISTS idx_sign_invitations_status ON sign_invitations(status)');
  } catch (e) {
    // 索引已存在
  }
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
