# Tasks - 房屋租赁合同线上签署系统开发

## Phase 1: 项目初始化与环境搭建

### Task 1.1: 搭建微信小程序项目结构
**Agent**: frontend-architect
**Description**: 初始化微信小程序项目，配置 Vant Weapp UI 组件库
- [x] SubTask 1.1.1: 初始化小程序项目，配置 app.json
- [x] SubTask 1.1.2: 安装 Vant Weapp UI 组件库
- [x] SubTask 1.1.3: 配置项目全局样式和主题
- [x] SubTask 1.1.4: 配置项目目录结构（pages/components/services/utils）

### Task 1.2: 搭建后端项目结构
**Agent**: backend-architect
**Description**: 初始化 Node.js + Express 项目，配置 MySQL 数据库
- [x] SubTask 1.2.1: 初始化 Node.js + Express 项目
- [x] SubTask 1.2.2: 配置 TypeScript 开发环境
- [x] SubTask 1.2.3: 配置 MySQL 数据库连接
- [x] SubTask 1.2.4: 配置项目目录结构（routes/controllers/models/middleware/services）

## Phase 2: 后端核心模块开发

### Task 2.1: 用户模块开发
**Agent**: backend-architect
**Description**: 开发用户注册、登录、认证、实名认证功能
- [x] SubTask 2.1.1: 设计并创建 users 数据表（包含实名认证字段）
- [x] SubTask 2.1.2: 实现微信登录接口 /api/users/wechat-login
- [x] SubTask 2.1.3: 实现手机号登录接口 /api/users/phone-login
- [x] SubTask 2.1.4: 实现发送验证码接口 /api/users/send-code
- [x] SubTask 2.1.5: 实现获取/更新用户信息接口
- [x] SubTask 2.1.6: 实现实名认证接口 /api/users/real-name/verify
- [x] SubTask 2.1.7: 编写用户模块单元测试

### Task 2.2: 合同模板模块开发
**Agent**: backend-architect
**Description**: 开发合同模板管理功能，映射HTML模板字段
- [x] SubTask 2.2.1: 设计并创建 contract_templates 数据表
- [x] SubTask 2.2.2: 实现获取合同模板列表接口
- [x] SubTask 2.2.3: 实现获取合同模板详情接口
- [x] SubTask 2.2.4: 将 HTML 模板字段映射为数据库字段配置

### Task 2.3: 合同模块开发
**Agent**: backend-architect
**Description**: 开发合同CRUD、状态流转、列表查询功能
- [x] SubTask 2.3.1: 设计并创建 contracts、contract_payments、contract_items 数据表
- [x] SubTask 2.3.2: 实现甲方合同 CRUD 接口（创建、读取、更新、删除）
- [x] SubTask 2.3.3: 实现甲方合同提交接口 /api/contracts/:id/submit（甲方签署）
- [x] SubTask 2.3.4: 实现乙方合同接口 /api/contracts/tenant（获取乙方签署的合同列表）
- [x] SubTask 2.3.5: 实现合同拒绝接口 /api/contracts/:id/reject（乙方拒绝）
- [x] SubTask 2.3.6: 实现合同列表查询接口（支持筛选、分页、搜索）
- [x] SubTask 2.3.7: 实现合同验证接口 /api/contracts/verify/:code
- [x] SubTask 2.3.8: 编写合同模块单元测试

### Task 2.4: 签署邀请模块开发
**Agent**: backend-architect
**Description**: 开发签署邀请、邀请码管理、通知发送功能
- [x] SubTask 2.4.1: 设计并创建 sign_invitations 数据表
- [x] SubTask 2.4.2: 实现创建签署邀请接口 /api/invitations
- [x] SubTask 2.4.3: 实现获取收到的签署邀请列表接口 /api/invitations
- [x] SubTask 2.4.4: 实现通过邀请码获取合同信息接口 /api/invitations/:code
- [x] SubTask 2.4.5: 实现接受邀请接口 /api/invitations/:code/accept
- [x] SubTask 2.4.6: 实现签署邀请通知（本地开发阶段使用模拟通知）
- [x] SubTask 2.4.7: 实现签署完成通知
- [x] SubTask 2.4.8: 编写签署邀请模块单元测试

### Task 2.5: 签署模块开发
**Agent**: backend-architect
**Description**: 开发电子签名、签署记录管理、签署留痕功能
- [x] SubTask 2.5.1: 设计并创建 signatures 数据表（包含签署留痕字段）
- [x] SubTask 2.5.2: 实现手写签名数据接收接口 /api/signatures
- [x] SubTask 2.5.3: 实现获取签署记录接口 /api/signatures/:contract_id
- [x] SubTask 2.5.4: 实现签署过程留痕（IP、设备、时间）
- [x] SubTask 2.5.5: 编写签署模块单元测试

### Task 2.6: 文件模块开发
**Agent**: backend-architect
**Description**: 开发文件上传、PDF生成、本地存储功能
- [x] SubTask 2.6.1: 实现图片上传接口 /api/upload/image
- [x] SubTask 2.6.2: 实现文件上传接口 /api/upload/file
- [x] SubTask 2.6.3: 实现 PDF 生成接口（基于合同数据渲染 HTML 为 PDF）
- [x] SubTask 2.6.4: 配置本地文件存储（开发阶段）
- [x] SubTask 2.6.5: 编写文件模块单元测试

## Phase 3: 微信小程序前端开发

### Task 3.1: 首页开发（甲乙方分离）
**Agent**: frontend-architect
**Description**: 开发甲乙方分离的首页
- [x] SubTask 3.1.1: 实现甲方首页布局（创建合同入口、合同统计）
- [x] SubTask 3.1.2: 实现乙方首页布局（签署邀请入口、待签署列表）
- [x] SubTask 3.1.3: 实现根据用户角色动态切换首页内容

### Task 3.2: 甲方合同列表页开发
**Agent**: frontend-architect
**Description**: 开发甲方创建的合同列表
- [x] SubTask 3.2.1: 实现甲方合同列表展示（Tab 分类：草稿/待签署/已签署/已过期）
- [x] SubTask 3.2.2: 实现下拉刷新和上拉加载更多
- [x] SubTask 3.2.3: 实现合同搜索功能
- [x] SubTask 3.2.4: 实现合同状态筛选

### Task 3.3: 乙方签署邀请列表页开发
**Agent**: frontend-architect
**Description**: 开发乙方收到的签署邀请列表
- [x] SubTask 3.3.1: 实现签署邀请列表展示（待签署/已签署/已拒绝）
- [x] SubTask 3.3.2: 实现下拉刷新和上拉加载更多
- [x] SubTask 3.3.3: 实现快速预览合同功能

### Task 3.4: 创建合同页开发（甲方）
**Agent**: frontend-architect
**Description**: 开发甲方填写合同信息表单
- [x] SubTask 3.4.1: 实现甲乙双方信息表单（乙方姓名、身份证号、联系电话等）
- [x] SubTask 3.4.2: 实现房屋和租赁信息表单（位置、面积、期限、用途）
- [x] SubTask 3.4.3: 实现租金和押金信息表单（月租金、年租金、付款方式等）
- [x] SubTask 3.4.4: 实现物品清单表格组件（添加/删除行）
- [x] SubTask 3.4.5: 实现表单验证（必填项、格式验证）
- [x] SubTask 3.4.6: 实现保存草稿功能

### Task 3.5: 合同预览页开发
**Agent**: frontend-architect
**Description**: 开发合同预览功能
- [x] SubTask 3.5.1: 实现基于 HTML 模板的合同预览组件
- [x] SubTask 3.5.2: 实现 PDF 预览功能
- [x] SubTask 3.5.3: 实现甲方预览页操作按钮（确认签署/返回编辑）
- [x] SubTask 3.5.4: 实现乙方预览页操作按钮（同意签署/拒绝签署）

### Task 3.6: 合同签署页开发
**Agent**: frontend-architect
**Description**: 开发手写签名组件、签署确认功能
- [x] SubTask 3.6.1: 实现手写签名组件（Canvas 签名板）
- [x] SubTask 3.6.2: 实现签名笔迹选择（颜色、粗细）
- [x] SubTask 3.6.3: 实现清除签名和重签功能
- [x] SubTask 3.6.4: 实现签名确认提交
- [x] SubTask 3.6.5: 实现签署状态提示和结果页

### Task 3.7: 拒绝签署页开发（乙方）
**Agent**: frontend-architect
**Description**: 开发乙方拒绝签署功能
- [x] SubTask 3.7.1: 实现拒绝原因填写表单
- [x] SubTask 3.7.2: 实现拒绝确认功能
- [x] SubTask 3.7.3: 实现拒绝后提示页面

### Task 3.8: 合同详情页开发（甲乙方通用）
**Agent**: frontend-architect
**Description**: 开发合同详情展示功能
- [x] SubTask 3.8.1: 实现合同完整信息展示
- [x] SubTask 3.8.2: 实现签署状态和时间线展示
- [x] SubTask 3.8.3: 实现合同 PDF 下载
- [x] SubTask 3.8.4: 实现合同分享功能
- [x] SubTask 3.8.5: 实现合同验证入口

### Task 3.9: 个人中心页开发
**Agent**: frontend-architect
**Description**: 开发用户信息管理功能
- [x] SubTask 3.9.1: 实现用户信息展示
- [x] SubTask 3.9.2: 实现用户信息编辑
- [x] SubTask 3.9.3: 实现实名认证状态展示
- [x] SubTask 3.9.4: 实现退出登录

### Task 3.10: 实名认证页开发
**Agent**: frontend-architect
**Description**: 开发身份证认证、人脸核身功能
- [x] SubTask 3.10.1: 实现身份证OCR识别上传
- [x] SubTask 3.10.2: 实现人脸核身验证
- [x] SubTask 3.10.3: 实现认证状态展示和结果页

## Phase 4: 集成与部署 ⚠️ 延后处理
**说明**：Phase 4 为部署上线相关任务，当前阶段为本地开发，此阶段延后处理。

### Task 4.1: 系统集成测试
**Agent**: api-test-pro
**Description**: 进行API联调、电子签名全流程测试
- [ ] SubTask 4.1.1: 后端 API 接口联调
- [ ] SubTask 4.1.2: 小程序与后端接口联调
- [ ] SubTask 4.1.3: 电子签名全流程测试（甲方创建→甲方签署→乙方签署→合同生效）
- [ ] SubTask 4.1.4: 乙方拒绝签署流程测试
- [ ] SubTask 4.1.5: 短信通知功能测试
- [ ] SubTask 4.1.6: 合同验证功能测试

### Task 4.2: 部署准备
**Agent**: devops-architect
**Description**: 配置PM2、Nginx、数据库迁移、环境变量
- [ ] SubTask 4.2.1: 后端服务部署配置（PM2 + Nginx）
- [ ] SubTask 4.2.2: 数据库迁移脚本编写
- [ ] SubTask 4.2.3: 环境变量配置
- [ ] SubTask 4.2.4: 小程序版本发布准备

# Agent Assignment Summary

| Agent | Assigned Tasks | 阶段 |
|-------|---------------|------|
| frontend-architect | Task 1.1, Task 3.1-3.10 | Phase 1, Phase 3 |
| backend-architect | Task 1.2, Task 2.1-2.6 | Phase 1, Phase 2 |
| api-test-pro | Task 4.1 | Phase 4 (延后) |
| devops-architect | Task 4.2 | Phase 4 (延后) |

# Task Dependencies

## Phase 1 依赖关系
- Task 1.1 可与 Task 1.2 并行执行
- Task 1.1 和 Task 1.2 完成后才能进入 Phase 2

## Phase 2 依赖关系
- Task 2.1（用户模块）为基础模块，其他模块可能依赖
- Task 2.2 可与 Task 2.1 并行执行
- Task 2.3 依赖 Task 2.1 和 Task 2.2
- Task 2.4 依赖 Task 2.3
- Task 2.5 可与 Task 2.4 并行执行
- Task 2.6 可独立开发

## Phase 3 依赖关系
- Task 3.1 可独立开发
- Task 3.2 依赖 Task 3.1 的部分组件
- Task 3.3 依赖 Task 2.4（签署邀请接口）
- Task 3.4 依赖 Task 2.2（模板配置）
- Task 3.5 依赖 Task 3.4
- Task 3.6 依赖 Task 3.5
- Task 3.7 依赖 Task 3.5
- Task 3.8 可与前面任务并行开发
- Task 3.9 可独立开发
- Task 3.10 依赖 Task 2.1（实名认证接口）

## Phase 4 依赖关系
- Task 4.1 依赖 Phase 2 和 Phase 3 所有任务
- Task 4.2 依赖 Task 4.1
- **Phase 4 延后处理**
