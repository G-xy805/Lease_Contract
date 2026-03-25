# 前端规范化检查清单

## 一、constants.js 规范化
- [x] `CONTRACT_STATUS` 对象使用数字值(1-6)而非字符串
- [x] `CONTRACT_STATUS_TEXT` 状态文本映射完整（1-6）
- [x] `CONTRACT_STATUS_COLOR` 状态颜色映射正确
- [x] `PAYMENT_METHODS` 使用数字键(1-4)

## 二、合同列表页 (contracts/)
- [x] `index.js` 不包含本地 `STATUS_MAP` 定义
- [x] `tabs` 数组使用正确的数字状态值
- [x] Tab 切换能正确筛选对应状态的合同
- [x] 签署按钮在 `status === 1`（待甲方签署）时显示
- [x] 分享提示在 `status === 2`（待乙方签署）时显示
- [x] 状态标签颜色与 `CONTRACT_STATUS_COLOR` 一致

## 三、合同详情页 (contract-detail/)
- [x] `index.js` 不包含本地 `STATUS_MAP` 定义
- [x] 甲方签署按钮在 `status === 1 && isPartyA` 时显示
- [x] 乙方签署按钮在 `status === 2 && !isPartyA` 时显示
- [x] 生成分享链接按钮在 `status === 2 && isPartyA` 时显示
- [x] 发送提醒按钮在 `status === 2 && isPartyA` 时显示
- [x] 删除合同按钮仅在 `status === 1 && isPartyA` 时显示
- [x] 状态标签正确显示状态文本和颜色

## 四、合同卡片组件 (contract-card/)
- [x] 组件正确接收并显示数字状态值
- [x] 状态标签颜色正确映射
- [x] 状态文本正确显示

## 五、API 服务层 (api.js)
- [x] API 请求使用正确的参数名
- [x] 状态筛选参数使用数字值
- [x] `sendInvite` 函数已添加

## 六、业务逻辑一致性
- [x] 前端状态值与后端 `ContractStatus` 枚举一致(1-6)
- [x] 状态流转逻辑与后端状态机一致
- [x] 签署流程操作权限正确

## 七、页面交互
- [x] Tab 切换流畅
- [x] 状态筛选正确
- [x] 操作按钮点击响应正确
- [x] 空状态正确显示
