# 前端规范化任务清单

## 一、统一状态枚举定义

- [x] **Task 1.1**: 修改 `miniprogram/utils/constants.js`
  - 将 `CONTRACT_STATUS` 对象中的字符串值替换为数字值(1-6)
  - 添加 `CONTRACT_STATUS_TEXT` 状态文本映射
  - 添加 `CONTRACT_STATUS_COLOR` 状态颜色映射
  - 添加 `PAYMENT_METHODS` 支付方式数字映射

## 二、合同列表页规范化

- [x] **Task 2.1**: 修改 `miniprogram/pages/contracts/index.js`
  - 删除本地 `STATUS_MAP` 定义（改用 constants.js 中的定义）
  - 修正 `tabs` 数组，使用数字状态值而非名称
  - 修正 `loadContracts` 方法中的状态筛选逻辑
  - 修正签署按钮显示条件 `item.status === 2` → `item.status === 1`（待甲方签署）
  - 修正分享提示显示条件 `item.status === 3` → `item.status === 2`（待乙方签署）

- [x] **Task 2.2**: 修改 `miniprogram/pages/contracts/index.wxml`
  - 修正 Tab titles，添加"待签署"和"已过期"Tab
  - 修正 Tab name 属性，与 JS 中的 tabs 数组索引对应
  - 确认合同卡片中状态标签使用正确的状态值

## 三、合同详情页规范化

- [x] **Task 3.1**: 修改 `miniprogram/pages/contract-detail/index.js`
  - 删除本地 `STATUS_MAP` 定义（改用 constants.js）
  - 修正 `transformContractData` 方法，确保 `status` 使用数字值
  - 修正 `needPartyASign` 判断：`contractStatus === 1`（待甲方签署时甲方需签署）
  - 修正 `needPartyBSign` 判断：`contractStatus === 2`（待乙方签署时乙方需签署）
  - 修正 `needShare` 判断：`contractStatus === 2`（待乙方签署时甲方需分享）
  - 修正 `canRemind` 判断：`contractStatus === 2 && isPartyA`

- [x] **Task 3.2**: 修改 `miniprogram/pages/contract-detail/index.wxml`
  - 修正删除按钮判断条件，使用 `canDelete` 变量替代直接判断状态值

## 四、合同卡片组件规范化

- [x] **Task 4.1**: 修改 `miniprogram/components/contract-card/index.js`
  - 统一状态显示，使用 constants.js 中的定义

- [x] **Task 4.2**: 修改 `miniprogram/components/contract-card/index.wxml`
  - 修正状态标签显示逻辑，使用 `getStatusColor` 和 `getStatusText` 方法

## 五、API服务层规范化

- [x] **Task 5.1**: 修改 `miniprogram/services/api.js`
  - 添加 `sendInvite` 函数供 contract-detail 页面的发送提醒功能使用

---

## 已完成的修改文件清单

| 文件路径 | 修改内容 |
|----------|----------|
| `miniprogram/utils/constants.js` | 替换字符串状态为数字状态枚举(1-6)，添加状态文本和颜色映射 |
| `miniprogram/pages/contracts/index.js` | 修正Tab映射和状态筛选逻辑，使用constants.js中的定义 |
| `miniprogram/pages/contracts/index.wxml` | 修正Tab titles和显示逻辑 |
| `miniprogram/pages/contract-detail/index.js` | 修正操作按钮逻辑，引入constants.js中的常量 |
| `miniprogram/pages/contract-detail/index.wxml` | 修正删除按钮判断条件 |
| `miniprogram/components/contract-card/index.js` | 统一状态显示，使用constants.js中的定义 |
| `miniprogram/components/contract-card/index.wxml` | 修正状态标签显示逻辑 |
| `miniprogram/services/api.js` | 添加sendInvite函数 |
