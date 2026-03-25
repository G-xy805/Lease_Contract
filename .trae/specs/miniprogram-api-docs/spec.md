# 租赁合同小程序 API 文档规格说明书

## Why
为微信小程序前端开发人员提供完整、准确的后端API接口文档，确保前后端联调高效进行。现有后端已实现完整的用户认证、合同管理、签署邀请等功能，需要将这些接口以小程序开发者友好的方式整理成档。

## What Changes
- 编写完整的 API 接口文档（用户模块、合同模块、签署模块、文件模块等）
- 提供微信小程序 `wx.request` 调用示例
- 说明认证机制、错误处理、注意事项
- 包含接口调用最佳实践

## Impact
- Affected specs: 房屋租赁合同微信小程序前端开发
- Affected code:
  - 后端API: `/backend/src/routes/`
  - 前端小程序: `/miniprogram/services/api.js`

---

## 一、文档结构说明

### 1.1 接口分类
本文档按功能模块将接口分为以下几类：

| 模块 | 路由前缀 | 说明 |
|------|----------|------|
| 用户模块 | `/api/users` | 登录、认证、用户信息 |
| 合同模块 | `/api/contracts` | 合同CRUD、签署、分享 |
| 邀请模块 | `/api/invitations` | 签署邀请管理 |
| 签名模块 | `/api/signatures` | 签名记录 |
| 文件模块 | `/api/upload` | 文件上传 |
| 模板模块 | `/api/templates` | 合同模板 |
| 其他 | `/api` | 健康检查等 |

### 1.2 接口通用说明

#### 认证方式
- **JWT Bearer Token**
- 请求头添加: `Authorization: Bearer <token>`
- Token 通过登录接口获取，有效期 7 天

#### 统一响应格式
```typescript
{
  code: 200,        // 状态码
  message: 'success', // 消息
  data: {}          // 数据对象
}
```

#### 错误码定义
| 错误码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未认证/Token失效 |
| 403 | 无权限访问 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

---

## 二、用户模块 API

### 2.1 发送验证码
```
POST /api/users/send-code
```

**请求参数:**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| phone | string | 是 | 手机号（11位） |

**请求示例:**
```javascript
wx.request({
  url: 'http://localhost:3000/api/users/send-code',
  method: 'POST',
  data: { phone: '13800138000' },
  header: { 'Content-Type': 'application/json' },
  success: res => console.log(res.data)
});
```

**响应示例:**
```json
{
  "code": 200,
  "message": "验证码发送成功",
  "data": {
    "success": true,
    "message": "验证码发送成功",
    "code": "123456"
  }
}
```

**开发环境说明:**
- 开发环境下接口直接返回验证码，方便测试
- 生产环境应通过短信网关发送

### 2.2 手机号登录
```
POST /api/users/phone-login
```

**请求参数:**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| phone | string | 是 | 手机号 |
| code | string | 是 | 验证码 |
| role | string | 否 | 角色: PARTY_A(甲方)/PARTY_B(乙方)，默认PARTY_B |

**请求示例:**
```javascript
wx.request({
  url: 'http://localhost:3000/api/users/phone-login',
  method: 'POST',
  data: {
    phone: '13800138000',
    code: '123456',
    role: 'PARTY_B'
  },
  header: { 'Content-Type': 'application/json' },
  success: res => {
    if (res.data.code === 200) {
      // 保存 token
      wx.setStorageSync('token', res.data.data.token);
      wx.setStorageSync('userInfo', res.data.data.user);
    }
  }
});
```

**响应示例:**
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR...",
    "user": {
      "id": 1,
      "openid": null,
      "phone": "13800138000",
      "name": null,
      "real_name_status": 0,
      "role": "PARTY_B",
      "roleName": "乙方"
    }
  }
}
```

### 2.3 微信登录
```
POST /api/users/wechat-login
```

**请求参数:**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| openid | string | 是 | 微信 openid |
| role | string | 否 | 角色: PARTY_A(甲方)/PARTY_B(乙方) |

**请求示例:**
```javascript
// 先获取微信登录凭证
wx.login({
  success: res => {
    // 通过服务端获取 openid（此处假设已获取）
    const openid = 'oXXXXXX';
    wx.request({
      url: 'http://localhost:3000/api/users/wechat-login',
      method: 'POST',
      data: { openid, role: 'PARTY_B' },
      success: res => {
        wx.setStorageSync('token', res.data.data.token);
      }
    });
  }
});
```

### 2.4 获取用户信息
```
GET /api/users/profile
```

**请求头:**
| 参数名 | 必填 | 说明 |
|--------|------|------|
| Authorization | 是 | Bearer {token} |

**响应示例:**
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "id": 1,
    "openid": null,
    "phone": "13800138000",
    "name": "张三",
    "idcard": "150102199001011234",
    "idcard_front": "/uploads/images/xxx.jpg",
    "idcard_back": "/uploads/images/xxx.jpg",
    "real_name_status": 2,
    "real_name_at": "2026-03-24T10:00:00.000Z",
    "role": "PARTY_A",
    "roleName": "甲方",
    "created_at": "2026-03-24T10:00:00.000Z"
  }
}
```

**real_name_status 状态值:**
| 值 | 说明 |
|----|------|
| 0 | 未认证 |
| 1 | 认证中 |
| 2 | 已认证 |
| 3 | 认证失败 |

### 2.5 更新用户信息
```
PUT /api/users/profile
```

**请求参数:**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| name | string | 否 | 姓名 |
| idcard_front | string | 否 | 身份证正面图片路径 |
| idcard_back | string | 否 | 身份证背面图片路径 |

### 2.6 实名认证
```
POST /api/users/real-name/verify
```

**请求参数:**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| name | string | 是 | 真实姓名 |
| idcard | string | 是 | 身份证号 |
| idcard_front | string | 否 | 身份证正面照 |
| idcard_back | string | 否 | 身份证背面照 |

**身份证号格式验证:**
- 18位
- 出生日期: (18|19|20)\d{2}
- 校验码: 0-9 或 X

---

## 三、合同模块 API

### 3.1 获取甲方合同列表
```
GET /api/contracts/landlord
```

**请求参数 (Query):**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| status | number | 否 | 合同状态筛选 |
| keyword | string | 否 | 关键词搜索 |
| start_date | string | 否 | 租赁开始日期筛选 |
| end_date | string | 否 | 租赁结束日期筛选 |
| page | number | 否 | 页码，默认1 |
| page_size | number | 否 | 每页条数，默认10 |

**合同状态值:**
| 值 | 说明 |
|----|------|
| 1 | 待甲方签署 |
| 2 | 待乙方签署 |
| 3 | 已签署 |
| 4 | 已拒绝 |
| 5 | 已取消 |
| 6 | 已到期 |

### 3.2 获取乙方合同列表
```
GET /api/contracts/tenant
```

**请求参数:** 同 3.1

**说明:** 返回当前用户作为乙方（租客）的合同列表

### 3.3 获取合同详情
```
GET /api/contracts/:id
```

**路径参数:**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | number | 是 | 合同ID |

**权限说明:**
- 甲方(创建人)可查看
- 乙方(签署人)通过手机号匹配可查看

### 3.4 创建合同
```
POST /api/contracts
```

**请求参数:**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| title | string | 是 | 合同标题 |
| lessor_name | string | 是 | 甲方姓名 |
| lessor_phone | string | 是 | 甲方电话 |
| lessee_name | string | 是 | 乙方姓名 |
| lessee_phone | string | 是 | 乙方电话 |
| house_address | string | 是 | 房屋地址 |
| lease_start | string | 是 | 租赁开始日期 YYYY-MM-DD |
| lease_end | string | 是 | 租赁结束日期 YYYY-MM-DD |
| monthly_rent | number | 是 | 月租金 |
| payment_method | number | 否 | 支付方式，默认1 |

**可选参数:**
- lessor_phone2, lessor_idcard, lessor_account, partyA_company, lessor_contact
- lessee_idcard, house_area, rent_purpose
- lease_months, advance_notice_days
- year_rent, payment_cycle, payment_count
- first_payment_amount, first_payment_date, second_payment_amount...
- deposit, deposit_chinese
- fee_water, fee_electric, fee_gas, fee_tv, fee_network, fee_property, fee_heating
- partyA_commission, partyB_commission
- electricity_meter, water_meter, gas_meter, remark
- 26项物品清单: item_tv_qty, item_wardrobe_qty, ... item_power_card_qty

**创建合同后状态默认为 1 (待甲方签署)**

### 3.5 更新合同
```
PUT /api/contracts/:id
```

**说明:** 仅允许更新状态为"待甲方签署(1)"的合同

### 3.6 删除合同
```
DELETE /api/contracts/:id
```

**说明:** 仅允许删除状态为"待甲方签署(1)"的合同

### 3.7 甲方签署
```
POST /api/contracts/:id/sign
```

**请求参数:**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| signature | string | 是 | 签名图片 Base64 |

**签署流程:**
1. 验证合同状态为"待甲方签署(1)"
2. 保存甲方签名
3. 生成邀请码 invite_code
4. 设置签署邀请过期时间(7天后)
5. 状态变为"待乙方签署(2)"

**响应数据:**
```json
{
  "code": 200,
  "message": "签署成功，请分享给乙方签署",
  "data": {
    "contract": { ... }
  }
}
```

### 3.8 生成分享链接
```
POST /api/contracts/:id/share
```

**响应数据:**
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "invite_code": "LC20260325XXXXXX",
    "share_url": "http://localhost:3000/sign/LC20260325XXXXXX",
    "qr_code": "http://localhost:3000/api/contracts/invite-qrcode/LC20260325XXXXXX",
    "expires_at": "2026-04-01T00:00:00.000Z"
  }
}
```

### 3.9 验证邀请码
```
GET /api/contracts/invite-verify/:code
```

**路径参数:**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| code | string | 是 | 邀请码 |

**响应数据:**
```json
{
  "code": 200,
  "message": "验证成功",
  "data": {
    "contract_id": 1,
    "contract_no": "LC20260325XXXXXX",
    "title": "房屋租赁合同",
    "lessor_name": "张三",
    "lessor_phone": "13800138000",
    "lessee_name": "李四",
    "lessee_phone": "13900139000",
    "house_address": "北京市朝阳区xxx",
    "lease_start": "2026-04-01",
    "lease_end": "2027-03-31",
    "monthly_rent": 3000,
    "deposit": 3000,
    "status": 2,
    "status_text": "待乙方签署",
    "expires_at": "2026-04-01T00:00:00.000Z"
  }
}
```

### 3.10 乙方签署
```
POST /api/contracts/:id/tenant-sign
```

**请求参数:**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| signature | string | 是 | 签名图片 Base64 |

**前置条件:**
- 当前用户手机号匹配乙方手机号
- 合同状态为"待乙方签署(2)"
- 邀请码未过期

**签署后:**
- 状态变为"已签署(3)"
- 设置 effective_at (合同生效时间)

### 3.11 拒绝签署
```
POST /api/contracts/:id/reject
```

**请求参数:**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| reason | string | 否 | 拒绝原因 |

### 3.12 取消合同
```
POST /api/contracts/:id/cancel
```

### 3.13 生成合同PDF
```
GET /api/contracts/:id/pdf
```

**响应数据:**
```json
{
  "code": 200,
  "message": "PDF生成成功",
  "data": {
    "filename": "contract_1_abc123.pdf",
    "url": "/uploads/pdfs/contract_1_abc123.pdf"
  }
}
```

### 3.14 验证合同真伪
```
GET /api/contracts/verify/:code
```

**说明:** 通过合同编号验证合同真实性，无需认证

---

## 四、邀请模块 API

### 4.1 创建签署邀请
```
POST /api/invitations
```

### 4.2 获取收到的签署邀请
```
GET /api/invitations
```

### 4.3 通过邀请码获取合同信息
```
GET /api/invitations/:code
```

### 4.4 接受签署邀请
```
POST /api/invitations/:code/accept
```

**请求参数:**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| receiver_phone | string | 是 | 乙方手机号 |

### 4.5 拒绝签署邀请
```
POST /api/invitations/:code/reject
```

**请求参数:**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| receiver_phone | string | 是 | 乙方手机号 |
| reason | string | 否 | 拒绝原因 |

---

## 五、签名模块 API

### 5.1 创建签名记录
```
POST /api/signatures
```

**请求参数:**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| contract_id | number | 是 | 合同ID |
| sign_type | string | 是 | 签署类型: hand_write/image_upload/digital |
| sign_role | string | 是 | 签署角色: lessor/tenant |
| sign_image | string | 是 | 签名图片Base64 |
| sign_data | string | 否 | 签名数据 |
| sign_location | string | 否 | 签署位置 |

### 5.2 获取合同签名记录
```
GET /api/signatures/:contract_id
```

### 5.3 获取签名详情
```
GET /api/signatures/detail/:id
```

---

## 六、文件模块 API

### 6.1 上传图片
```
POST /api/upload/image
```

**请求格式:** multipart/form-data

**文件字段:** file

**支持格式:** JPG, PNG, GIF, WebP

**大小限制:** 5MB

### 6.2 上传文件
```
POST /api/upload/file
```

**支持格式:** PDF, DOC, DOCX, XLS, XLSX, TXT, ZIP, RAR

**大小限制:** 50MB

---

## 七、模板模块 API

### 7.1 获取模板列表
```
GET /api/templates
```

### 7.2 获取模板详情
```
GET /api/templates/:id
```

### 7.3 获取字段映射
```
GET /api/templates/fields/mapping
```

---

## 八、小程序开发特殊说明

### 8.1 域名配置

**开发阶段:**
- 后端服务需配置允许的合法域名
- 微信开发者工具中勾选"不校验合法域名"

**生产阶段:**
- 后端服务必须部署在 HTTPS 域名下
- 在微信公众平台配置 request 合法域名

### 8.2 网络请求封装

**推荐封装方式:**
```javascript
// miniprogram/services/api.js
const BASE_URL = 'https://your-domain.com/api';

function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync('token');

    wx.request({
      url: BASE_URL + url,
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        ...options.header
      },
      success: res => {
        if (res.statusCode === 200 && res.data.code === 200) {
          resolve(res.data);
        } else if (res.statusCode === 401) {
          // Token失效，跳转登录
          wx.removeStorageSync('token');
          wx.navigateTo({ url: '/pages/login/index' });
          reject(res.data);
        } else {
          wx.showToast({
            title: res.data.message || '请求失败',
            icon: 'none'
          });
          reject(res.data);
        }
      },
      fail: err => {
        wx.showToast({
          title: '网络请求失败',
          icon: 'none'
        });
        reject(err);
      }
    });
  });
}
```

### 8.3 Token管理

**存储:**
```javascript
// 登录成功后
wx.setStorageSync('token', token);
wx.setStorageSync('userInfo', userInfo);
```

**使用:**
```javascript
// 在请求封装中自动添加
const token = wx.getStorageSync('token');
```

**刷新:**
- 当前实现无 Token 刷新机制
- Token 有效期 7 天
- 过期后需重新登录

### 8.4 错误处理

**统一错误处理:**
```javascript
function handleError(res) {
  switch (res.code) {
    case 400:
      wx.showToast({ title: '参数错误', icon: 'none' });
      break;
    case 401:
      wx.showToast({ title: '请先登录', icon: 'none' });
      wx.navigateTo({ url: '/pages/login/index' });
      break;
    case 403:
      wx.showToast({ title: '无权限访问', icon: 'none' });
      break;
    case 404:
      wx.showToast({ title: '资源不存在', icon: 'none' });
      break;
    default:
      wx.showToast({ title: res.message || '请求失败', icon: 'none' });
  }
}
```

### 8.5 请求超时

**配置建议:**
```javascript
// app.json
{
  "networkTimeout": {
    "request": 10000,
    "downloadFile": 10000
  }
}
```

### 8.6 文件上传

**小程序端代码:**
```javascript
wx.chooseImage({
  count: 1,
  sizeType: ['compressed'],
  sourceType: ['album', 'camera'],
  success: res => {
    const filePath = res.tempFilePaths[0];
    wx.uploadFile({
      url: BASE_URL + '/upload/image',
      filePath: filePath,
      name: 'file',
      header: {
        'Authorization': `Bearer ${wx.getStorageSync('token')}`
      },
      success: res => {
        const data = JSON.parse(res.data);
        // 上传成功，处理返回的图片路径
      }
    });
  }
});
```

### 8.7 签署流程完整示例

```javascript
// 1. 获取合同详情
async function getContractDetail(contractId) {
  return request(`/contracts/${contractId}`);
}

// 2. 甲方签署
async function lessorSign(contractId, signatureBase64) {
  return request(`/contracts/${contractId}/sign`, {
    method: 'POST',
    data: { signature: signatureBase64 }
  });
}

// 3. 生成分享链接
async function shareContract(contractId) {
  return request(`/contracts/${contractId}/share`, {
    method: 'POST'
  });
}

// 4. 乙方验证邀请码
async function verifyInviteCode(code) {
  return request(`/contracts/invite-verify/${code}`);
}

// 5. 乙方签署
async function tenantSign(contractId, signatureBase64) {
  return request(`/contracts/${contractId}/tenant-sign`, {
    method: 'POST',
    data: { signature: signatureBase64 }
  });
}
```

---

## 九、注意事项与最佳实践

### 9.1 安全注意事项
1. **不要在代码中硬编码 Token**
2. **生产环境必须使用 HTTPS**
3. **敏感信息使用加密传输**
4. **签名图片 Base64 需包含 data URI 前缀**

### 9.2 性能优化
1. **合同列表使用分页加载**
2. **图片上传前进行压缩**
3. **使用 wx.request 并行请求优化加载速度**
4. **合同详情缓存考虑**

### 9.3 用户体验
1. **请求前显示 loading 提示**
2. **失败后提供重试机制**
3. **签署等重要操作需二次确认**
4. **错误提示应清晰易懂**

### 9.4 开发调试
1. **使用微信开发者工具 Network 面板查看请求**
2. **使用 console.log 打印响应数据**
3. **后端开启详细日志便于排查问题**
4. **注意跨域问题配置**

---

## 十、数据库字段与API响应对照

### 10.1 合同状态 (status)
| 数据库值 | status_text | 说明 |
|----------|-------------|------|
| 1 | 待甲方签署 | 甲方还未签名 |
| 2 | 待乙方签署 | 甲方已签，等待乙方签署 |
| 3 | 已签署 | 双方签署完成，合同生效 |
| 4 | 已拒绝 | 乙方拒绝签署 |
| 5 | 已取消 | 合同被取消 |
| 6 | 已到期 | 合同到期 |

### 10.2 支付方式 (payment_method)
| 数据库值 | payment_method_text | 说明 |
|----------|---------------------|------|
| 1 | 押一付一 | 月付 |
| 2 | 押一付三 | 季付 |
| 3 | 押一付六 | 半年付 |
| 4 | 年付 | 年付 |

### 10.3 实名认证状态 (real_name_status)
| 数据库值 | 说明 |
|----------|------|
| 0 | 未认证 |
| 1 | 认证中 |
| 2 | 已认证 |
| 3 | 认证失败 |

---

*文档版本: 1.0*
*生成时间: 2026-03-25*
