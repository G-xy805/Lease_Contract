# Lease Contract 项目 - Agent指南

## 项目概览
- **名称**: Lease Contract (租赁合同系统)
- **类型**: 全栈应用 (后端 + 微信小程序前端)
- **后端**: TypeScript Node.js Express.js API
- **前端**: 微信小程序 (JavaScript/WXML/WXSS)
- **主要语言**: 后端 TypeScript, 前端 JavaScript
- **框架**: 后端 Express.js, 前端 微信小程序框架
- **数据库**: MySQL (通过 mysql2) + SQLite (通过 better-sqlite3)
- **位置**: 
  - 后端: `/backend` 目录
  - 前端: `/miniprogram` 目录

## 构建、lint 和 测试命令

### 后端开发
```bash
# 启动带自动重载的开发服务器
npm run dev --prefix backend

# 安装依赖
npm install --prefix backend
```

### 前端开发
```bash
# 启动微信小程序开发 (通过微信开发者工具)
# 或使用自定义构建脚本
npm run dev --prefix miniprogram

# 构建微信小程序
npm run build --prefix miniprogram
```

### 后端构建
```bash
# 编译 TypeScript 为 JavaScript
npm run build --prefix backend

# 启动生产服务器
npm start --prefix backend
```

### 后端 Lint 检查
```bash
# 在 TypeScript 源文件上运行 ESLint
npm run lint --prefix backend

# 修复可自动修复的 lint 问题
npm run lint --prefix backend -- --fix
```

### 测试
```bash
# 运行所有测试（当测试框架可用时）
npm test --prefix backend

# 运行特定测试（例如，按名称匹配）
npm test --prefix backend -- --testNamePattern="特定测试名称"

# 以监视模式运行测试
npm run test:watch --prefix backend

# 运行单个测试文件
npm test --prefix backend src/**/specific.test.ts

# 运行带详细输出的单个测试
npm test --prefix backend src/**/specific.test.ts -- --verbose
```

### 数据库操作
```bash
# 数据库架构定义在:
# - database_schema.md (文档)
# - 后端数据库设计与业务逻辑分析.md (详细设计)
# 实际架构实现位于 backend/src/database.ts
```

## 代码风格指南

### TypeScript 约定 (后端)
1. **文件组织**
   - 使用 `.ts` 扩展名的 TypeScript 文件
   - 将接口放置在 `models/` 或专用 `types/` 目录中
   - 尽量保持文件在 300 行以内
   - 将相关功能分组到 service/controllers 目录

2. **导入**
   - 顺序: Node 内置 → 外部库 → 内部模块
   - 从 src 根目录导入时优先使用绝对路径
   - 不允许未使用的导入 (ESLint 会捕获这些)
   ```typescript
   // 正确的导入顺序
   import express, { Request, Response } from 'express';
   import { v4 as uuidv4 } from 'uuid';
   import { authenticateToken } from '../middleware/auth';
   import { LeaseModel } from '../models/lease';
   ```

3. **命名约定**
   - **接口**: PascalCase (例如: `ILeaseOptions`)
   - **类型**: PascalCase (例如: `LeaseStatusType`)
   - **函数/方法**: camelCase (例如: `calculateTotalAmount`)
   - **变量**: camelCase (例如: `leaseAmount`)
   - **类**: PascalCase (例如: `LeaseService`)
   - **常量**: UPPER_SNAKE_CASE (例如: `MAX_LEASE_DURATION`)
   - **文件**: kebab-case (例如: `lease-service.ts`)
   - **目录**: kebab-case (例如: `payment-processing`)

4. **格式化**
   - 使用 2 空格缩进（禁止使用制表符）
   - 最大行长度: 100 个字符
   - 语句上的开括号保持在同一行
   - 必须使用分号
   - 单行对象/数组中禁止尾随逗号
   - 导入和代码之间留空行
   - 逻辑代码块之间留空行
   - 优先使用 `const` 而非 `let`，避免使用 `var`
   - 使用模板字面量进行字符串插值

5. **类型使用**
   - 优先使用显式类型而非 `any`
   - 对象形状使用接口，联合/交叉使用类型
   - 避免使用 `any`；在类型不确定时使用 `unknown` 并进行验证
   - 使用 `?` 标记可选属性
   - 使用 `readonly` 表示不可变属性
   - 优先使用接口而非类型别名来定义对象形状

### JavaScript 约定 (前端微信小程序)
1. **文件组织**
   - 使用 `.js` 扩展名的 JavaScript 文件
   - 将页面放置在 `pages/` 目录下的子目录中
   - 将组件放置在 `components/` 目录中
   - 将工具函数放置在 `utils/` 目录中
   - 将服务放置在 `services/` 目录中

2. **命名约定**
   - **构造函数/类**: PascalCase (例如: `LeaseService`)
   - **函数/方法**: camelCase (例如: `formatDate`)
   - **变量**: camelCase (例如: `leaseInfo`)
   - **常量**: UPPER_SNAKE_CASE (例如: `API_BASE_URL`)
   - **文件**: 使用下划线连接 (例如: `lease_service.js`)
   - **页面目录**: 使用下划线连接 (例如: `lease_detail`)

3. **格式化**
   - 使用 2 空格缩进（禁止使用制表符）
   - 最大行长度: 100 个字符
   - 语句上的开括号保持在同一行
   - 必须使用分号
   - 单行对象/数组中禁止尾随逗号
   - 导入和代码之间留空行
   - 逻辑代码块之间留空行
   - 优先使用 `const` 而非 `let`，避免使用 `var`
   - 使用模板字面量进行字符串插值

### 通用约定
1. **错误处理**
   - 对异步操作使用 try/catch
   - 为特定领域的错误创建自定义错误类
   - 永不留空 catch 块
   - 在重新抛出或返回之前适当记录错误
   - 在 Express 控制器中，使用 `next(error)` 进行中间件错误处理
   - 在微信小程序中，使用 try/catch 捕获异步操作错误

2. **注释和文档**
   - 对公共 API 和复杂函数使用 JSDoc
   - 解释原因而非仅仅描述行为
   - 随代码更改保持注释更新
   - 使用带问题引用的 TODO: 和 FIXME: 注释

3. **Express.js 特定指南 (后端)**
   - 控制器应保持简洁；将业务逻辑移至服务层
   - 使用验证库或自定义验证器验证所有输入（查询、参数、正文）
   - 在路由处理程序中使用 async/await 配合 try/catch
   - 设置适当的 HTTP 状态码
   - 使用中间件处理跨切面问题（认证、日志、验证）
   - 绝不将数据库逻辑直接放置在路由处理程序中

4. **微信小程序特定指南 (前端)**
   - 页面逻辑应保持简洁；将复杂逻辑移至服务或工具函数
   - 使用行为（behaviors）来共享组件间的代码
   - 在页面的onLoad、onReady等生命周期函数中处理数据
   - 使用wx.request进行网络请求，并妥误处理成功和失败回调
   - 使用wx.showLoading和wx.hideLoading显示加载状态
   - 使用wx.showToast显示操作结果提示

### 项目特定指南
1. **数据库操作**
   - 使用参数化查询防止 SQL 注入
   - 正确处理数据库连接池
   - 将数据库操作抽象到服务/存储库层
   - 在适当时关闭连接

2. **安全**
   - 验证和清理所有用户输入
   - 通过 dotenv 使用环境变量存储密钥 (后端)
   - 实施适当的认证和授权
   - 生产环境使用 HTTPS
   - 设置安全的 HTTP 头
   - 前端通过token进行身份验证，不要在前端存储敏感信息

3. **文件操作**
   - 验证上传的文件类型和大小
   - 安全存储上传的文件
   - 对大文件操作使用流处理
   - 清理临时文件

4. **第三方服务**
   - 通过重试/断路器机制优雅处理 API 失败
   - 记录外部 API 调用以便调试
   - 尊重速率限制
   - 为外部调用使用超时

## 目录结构参考
```
lease_contract/
├── backend/
│   ├── src/
│   │   ├── app.ts              # Express 应用入口点
│   │   ├── config/             # 配置文件
│   │   ├── controllers/        # 请求处理程序
│   │   ├── middleware/         # 自定义中间件
│   │   ├── models/             # TypeScript 接口/类型
│   │   ├── routes/             # 路由定义
│   │   ├── services/           # 业务逻辑
│   │   ├── templates/          # HTML 模板
│   │   └── utils/              # 工具函数
│   ├── dist/                   # 编译后的 JavaScript (git 忽略)
│   ├── data/                   # 数据文件 (SQLite, 上传等)
│   ├── config/                 # 额外配置
│   ├── scripts/                # 实用脚本
│   ├── package.json            # 依赖和脚本
│   └── tsconfig.json           # TypeScript 配置
├── miniprogram/
│   ├── pages/                  # 页面目录
│   │   ├── index/              # 首页
│   │   │   ├── index.js        # 页面逻辑
│   │   │   ├── index.json      # 页面配置
│   │   │   ├── index.wxml      # 页面结构
│   │   │   └── index.wxss      # 页面样式
│   ├── components/             # 自定义组件
│   ├── services/               # 服务层 (网络请求等)
│   ├── utils/                  # 工具函数
│   ├── assets/                 # 静态资源 (图片、图标等)
│   ├── app.js                  # 小程序逻辑
│   ├── app.json                # 小程序全局配置
│   ├── app.wxss                # 小程序全局样式
│   ├── project.config.json     # 项目配置
│   ├── sitemap.json            # 站点配置
│   └── package.json            # 依赖和脚本
├── database_schema.md          # 数据库架构文档
├── 后端数据库设计与业务逻辑分析.md # 详细设计文档
├── 项目总结.md                 # 项目总结
└── AGENTS.md                   # 本文件
```

## 添加新功能时的步骤

### 后端功能
1. 在 `src/models/` 中创建/更新接口
2. 在 `src/services/` 中实现业务逻辑
3. 在 `src/controllers/` 中创建控制器（如果是 API 端点）
4. 在 `src/routes/` 中定义路由
5. 如需要，在 `src/middleware/` 中添加中间件
6. 更新测试（当测试框架可用时）
7. 确保适当的错误处理和日志记录
8. 遵循现有的代码风格模式

### 前端功能
1. 在 `pages/` 中创建新页面目录或修改现有页面
2. 创建/修改页面的.js文件（逻辑）、.json文件（配置）、.wxml文件（结构）、.wxss文件（样式）
3. 如需要，在 `components/` 中创建/修改自定义组件
4. 如需要，在 `services/` 中添加网络服务方法
5. 如需要，在 `utils/` 中添加工具函数
6. 更新 app.json 中的页面注册（如果是新页面）
7. 确保遵循现有的代码风格模式

## 常见任务
- **添加新的 API 端点**: 创建路由、控制器、服务方法 (后端)
- **修改数据库架构**: 更新 database.ts 和相关的模型接口 (后端)
- **添加验证**: 创建中间件或使用验证库 (后端)
- **实现认证**: 扩展现有的认证中间件 (后端)
- **添加文件上传**: 使用 multer 并进行适当验证 (后端)
- **添加新页面**: 创建页面目录和相关文件 (前端)
- **添加自定义组件**: 创建组件目录和相关文件 (前端)
- **添加网络服务**: 在 services 中添加请求方法 (前端)
- **添加工具函数**: 在 utils 中添加通用函数 (前端)

## 交互要求
1. 你在处理所有问题时，**全程思考过程必须使用中文**（包括需求分析、逻辑拆解、方案选择、步骤推导等所有内部推理环节）；
2. 最终输出的所有回答内容（包括文字解释、代码注释、步骤说明等）**必须全部使用中文**，仅代码语法本身的英文关键词除外。