# Checklist - 租赁合同小程序 API 文档检查清单

## 一、文档完整性检查

- [x] 文档概述说明清晰
- [x] API 分类合理（用户、合同、邀请、签名、文件、模板）
- [x] 每个接口都有请求路径说明
- [x] 每个接口都有 HTTP 方法标注
- [x] 每个接口都有请求参数表格（含类型、必填、说明）
- [x] 每个接口都有响应数据示例

## 二、用户模块检查

- [x] 发送验证码接口 (POST /api/users/send-code)
- [x] 手机号登录接口 (POST /api/users/phone-login)
- [x] 微信登录接口 (POST /api/users/wechat-login)
- [x] 获取用户信息接口 (GET /api/users/profile)
- [x] 更新用户信息接口 (PUT /api/users/profile)
- [x] 实名认证接口 (POST /api/users/real-name/verify)

## 三、合同模块检查

- [x] 获取甲方合同列表 (GET /api/contracts/landlord)
- [x] 获取乙方合同列表 (GET /api/contracts/tenant)
- [x] 获取合同详情 (GET /api/contracts/:id)
- [x] 创建合同 (POST /api/contracts)
- [x] 更新合同 (PUT /api/contracts/:id)
- [x] 删除合同 (DELETE /api/contracts/:id)
- [x] 甲方签署 (POST /api/contracts/:id/sign)
- [x] 生成分享链接 (POST /api/contracts/:id/share)
- [x] 验证邀请码 (GET /api/contracts/invite-verify/:code)
- [x] 乙方签署 (POST /api/contracts/:id/tenant-sign)
- [x] 拒绝签署 (POST /api/contracts/:id/reject)
- [x] 取消合同 (POST /api/contracts/:id/cancel)
- [x] 生成PDF (GET /api/contracts/:id/pdf)
- [x] 验证合同 (GET /api/contracts/verify/:code)

## 四、邀请模块检查

- [x] 创建签署邀请 (POST /api/invitations)
- [x] 获取收到的签署邀请 (GET /api/invitations)
- [x] 通过邀请码获取合同 (GET /api/invitations/:code)
- [x] 接受签署邀请 (POST /api/invitations/:code/accept)
- [x] 拒绝签署邀请 (POST /api/invitations/:code/reject)

## 五、签名模块检查

- [x] 创建签名记录 (POST /api/signatures)
- [x] 获取合同签名记录 (GET /api/signatures/:contract_id)
- [x] 获取签名详情 (GET /api/signatures/detail/:id)

## 六、文件模块检查

- [x] 上传图片 (POST /api/upload/image)
- [x] 上传文件 (POST /api/upload/file)

## 七、模板模块检查

- [x] 获取模板列表 (GET /api/templates)
- [x] 获取模板详情 (GET /api/templates/:id)
- [x] 获取字段映射 (GET /api/templates/fields/mapping)

## 八、认证与错误处理检查

- [x] JWT Bearer Token 认证方式说明
- [x] 请求头 Authorization 说明
- [x] 统一响应格式说明 (code, message, data)
- [x] 错误码定义 (200, 400, 401, 403, 404, 500)
- [x] 错误处理方法说明

## 九、小程序特殊说明检查

- [x] 域名配置说明（开发/生产）
- [x] 网络请求封装示例 (request 函数)
- [x] Token 管理说明（存储、使用、刷新）
- [x] 错误处理示例代码
- [x] 请求超时配置说明
- [x] 文件上传示例代码
- [x] 签署流程完整示例

## 十、最佳实践检查

- [x] 安全注意事项说明
- [x] 性能优化建议
- [x] 用户体验建议
- [x] 开发调试建议

## 十一、参考信息检查

- [x] 合同状态值对照表
- [x] 支付方式值对照表
- [x] 实名认证状态值对照表
- [x] API 响应与数据库字段对照

## 十二、文档质量检查

- [x] 文档结构清晰，层次分明
- [x] 代码示例语法正确
- [x] 链接和路径准确
- [x] 中文说明通顺易懂
- [x] 文档格式统一规范

## 十三、API 服务文件检查

- [x] api.js 请求封装完整
- [x] 用户模块接口函数完整
- [x] 合同模块接口函数完整
- [x] 邀请模块接口函数完整
- [x] 签名模块接口函数完整
- [x] 文件上传接口函数完整
- [x] 模板模块接口函数完整
- [x] Token 自动管理
- [x] 错误处理完善
- [x] 加载提示处理
