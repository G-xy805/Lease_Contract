/**
 * 工具函数集合（v2版本）
 * 包含日期处理、数据转换、格式化等工具函数
 * @module utils/helpers
 *
 * v2新增功能:
 * - splitDate/combineDate: 日期字符串与拆分字段互转（适配微信小程序日期选择器）
 * - serializeFeeItems/deserializeFeeItems: 费用项JSON序列化/反序列化
 * - serializeInventoryItems/deserializeInventoryItems: 物品清单JSON序列化/反序列化
 * - getContractStatusButtons: 合同状态按钮配置生成器
 */

// ========== 日期处理函数（v2核心） ==========

/**
 * 拆分日期字符串为年月日组件
 * 适配微信小程序 <picker mode="date"> 组件的值格式
 *
 * @param {string|null|undefined} dateStr - 日期字符串 (格式: 'YYYY-MM-DD' 或 '' 或 null)
 * @returns {Object} 拆分后的日期对象 { year: string, month: string, day: string }
 *
 * @example
 * // 正常用例
 * splitDate('2026-05-01')
 * // 返回: { year: '2026', month: '05', day: '01' }
 *
 * @example
 * // 空值用例
 * splitDate('')
 * // 返回: { year: '', month: '', day: '' }
 *
 * @example
 * // null用例
 * splitDate(null)
 * // 返回: { year: '', month: '', day: '' }
 */
function splitDate(dateStr) {
  // 处理空值情况
  if (!dateStr || typeof dateStr !== 'string' || dateStr.trim() === '') {
    return { year: '', month: '', day: '' };
  }

  // 尝试解析日期字符串
  const parts = dateStr.split('-');

  // 验证格式是否正确（应该是 YYYY-MM-DD 格式，3个部分）
  if (parts.length !== 3) {
    console.warn(`[splitDate] 日期格式不正确: ${dateStr}，期望格式: YYYY-MM-DD`);
    return { year: '', month: '', day: '' };
  }

  const [year, month, day] = parts;

  // 返回拆分后的对象（保持字符串类型，适配微信小程序picker）
  return {
    year: year || '',
    month: month || '',
    day: day || ''
  };
}

/**
 * 组合年月日数字为日期字符串
 * 与 splitDate 函数互为逆运算
 *
 * @param {number|null|undefined} year - 年份 (如: 2026)
 * @param {number|null|undefined} month - 月份 (1-12)
 * @param {number|null|undefined} day - 日期 (1-31)
 * @returns {string} 格式化后的日期字符串 (格式: 'YYYY-MM-DD') 或空字符串 ''
 *
 * @example
 * // 正常用例
 * combineDate(2026, 5, 1)
 * // 返回: '2026-05-01'
 *
 * @example
 * // 空值用例
 * combineDate(null, null, null)
 * // 返回: ''
 */
function combineDate(year, month, day) {
  // 如果任一参数为空或无效，返回空字符串
  if (year == null || month == null || day == null) {
    return '';
  }

  // 转换为数字并验证
  const y = Number(year);
  const m = Number(month);
  const d = Number(day);

  // 验证数字有效性
  if (isNaN(y) || isNaN(m) || isNaN(d)) {
    console.warn('[combineDate] 参数包含非数字值');
    return '';
  }

  // 补零并组合成日期字符串
  const monthStr = String(m).padStart(2, '0');
  const dayStr = String(d).padStart(2, '0');

  return `${y}-${monthStr}-${dayStr}`;
}

// ========== JSON数据序列化函数（v2核心） ==========

/**
 * 序列化费用项数组为JSON字符串
 * 用于提交到后端数据库存储
 *
 * @param {Array<Object>} feeArray - 费用项数组
 *   每个元素结构: { name: String, checked: Boolean }
 * @returns {string} JSON字符串或空数组字符串 '[]'
 *
 * @example
 * serializeFeeItems([{name:'水费',checked:true}, {name:'电费',checked:false}])
 * // 返回: '[{"name":"水费","checked":true},{"name":"电费","checked":false}]'
 */
function serializeFeeItems(feeArray) {
  // 处理空值或非数组情况
  if (!feeArray || !Array.isArray(feeArray)) {
    return '[]';
  }

  try {
    return JSON.stringify(feeArray);
  } catch (error) {
    console.error('[serializeFeeItems] 序列化失败:', error);
    return '[]';
  }
}

/**
 * 反序列化费用项JSON字符串为数组
 * 用于从后端获取数据后解析
 *
 * @param {string|null|undefined} jsonStr - JSON字符串（或空值）
 * @returns {Array<Object>} 费用项数组或默认空数组 []
 *
 * @example
 * deserializeFeeItems('[{"name":"水费","checked":true}]')
 * // 返回: [{name:'水费', checked:true}]
 *
 * @example
 * deserializeFeeItems(null)
 * // 返回: []
 */
function deserializeFeeItems(jsonStr) {
  // 处理空值情况
  if (!jsonStr || typeof jsonStr !== 'string' || jsonStr.trim() === '') {
    return [];
  }

  try {
    const parsed = JSON.parse(jsonStr);

    // 验证解析结果是否为数组
    if (!Array.isArray(parsed)) {
      console.warn('[deserializeFeeItems] 解析结果不是数组');
      return [];
    }

    return parsed;
  } catch (error) {
    console.error('[deserializeFeeItems] 反序列化失败:', error);
    return [];
  }
}

/**
 * 序列化物品清单数组为JSON字符串
 * 用于提交到后端数据库存储
 *
 * @param {Array<Object>} itemsArray - 物品清单数组
 *   每个元素结构: { name: String, quantity: Number, unit?: String }
 * @returns {string} JSON字符串或空数组字符串 '[]'
 *
 * @example
 * serializeInventoryItems([{name:'电视',quantity:1,unit:'台'}, {name:'空调',quantity:2}])
 * // 返回: '[{"name":"电视","quantity":1,"unit":"台"},{"name":"空调","quantity":2}]'
 */
function serializeInventoryItems(itemsArray) {
  // 处理空值或非数组情况
  if (!itemsArray || !Array.isArray(itemsArray)) {
    return '[]';
  }

  try {
    return JSON.stringify(itemsArray);
  } catch (error) {
    console.error('[serializeInventoryItems] 序列化失败:', error);
    return '[]';
  }
}

/**
 * 反序列化物品清单JSON字符串为数组
 * 用于从后端获取数据后解析
 *
 * @param {string|null|undefined} jsonStr - JSON字符串（或空值）
 * @returns {Array<Object>} 物品清单数组或默认空数组 []
 *
 * @example
 * deserializeInventoryItems('[{"name":"电视","quantity":1}]')
 * // 返回: [{name:'电视', quantity:1}]
 *
 * @example
 * deserializeInventoryItems('')
 * // 返回: []
 */
function deserializeInventoryItems(jsonStr) {
  // 处理空值情况
  if (!jsonStr || typeof jsonStr !== 'string' || jsonStr.trim() === '') {
    return [];
  }

  try {
    const parsed = JSON.parse(jsonStr);

    // 验证解析结果是否为数组
    if (!Array.isArray(parsed)) {
      console.warn('[deserializeInventoryItems] 解析结果不是数组');
      return [];
    }

    return parsed;
  } catch (error) {
    console.error('[deserializeInventoryItems] 反序列化失败:', error);
    return [];
  }
}

// ========== 数据脱敏函数 ==========

/**
 * 手机号脱敏处理
 * 隐藏中间4位数字，保护用户隐私
 *
 * @param {string|null|undefined} phone - 手机号（11位）
 * @returns {string} 脱敏后的手机号或原值（如果格式不正确）
 *
 * @example
 * maskPhone('13800138000')
 * // 返回: '138****8000'
 *
 * @example
 * maskPhone('12345')  // 长度不足11位
 * // 返回: '12345' （返回原值）
 */
function maskPhone(phone) {
  // 处理空值或非字符串
  if (!phone || typeof phone !== 'string') {
    return phone;
  }

  // 验证手机号长度（必须是11位）
  if (phone.length !== 11) {
    return phone;
  }

  // 执行脱敏：保留前3位和后4位，中间用****替换
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
}

/**
 * 身份证号脱敏处理
 * 隐藏中间8位数字，保护用户隐私
 *
 * @param {string|null|undefined} idCard - 身份证号（18位）
 * @returns {string} 脱敏后的身份证号或原值（如果格式不正确）
 *
 * @example
 * maskIdCard('110101199001011234')
 * // 返回: '110101********1234'
 *
 * @example
 * maskIdCard('12345')  // 长度不足18位
 * // 返回: '12345' （返回原值）
 */
function maskIdCard(idCard) {
  // 处理空值或非字符串
  if (!idCard || typeof idCard !== 'string') {
    return idCard;
  }

  // 验证身份证号长度（必须是18位）
  if (idCard.length !== 18) {
    return idCard;
  }

  // 执行脱敏：保留前6位和后4位，中间用********替换
  return idCard.replace(/(\d{6})\d{8}(\d{4})/, '$1********$2');
}

// ========== 合同状态按钮配置生成器（v2新增） ==========

/**
 * 根据合同状态和用户角色生成操作按钮配置
 * 用于动态渲染合同详情页的操作按钮组
 *
 * @param {number} status - 当前合同状态 (ContractStatus枚举值: 1-6)
 * @param {string|null} userRole - 当前用户角色 ('LESSOR' | 'LESSEE' | null)
 * @param {boolean} partyASigned - 甲方是否已签署 (true/false)
 * @param {boolean} partyBSigned - 乙方是否已签署 (true/false)
 * @returns {Array<Object>} 按钮配置数组
 *   每个按钮结构:
 *   {
 *     text: string,        // 按钮显示文本
 *     type: string,        // 按钮类型: 'primary' | 'warning' | 'danger' | 'default'
 *     action: string,      // 点击动作标识: 'sign' | 'reject' | 'cancel' | 'invite' | ...
 *     visible: boolean     // 是否可见
 *   }
 *
 * @example
 * // 场景1: 待甲方签署，当前用户是甲方
 * getContractStatusButtons(1, 'LESSOR', false, false)
 * // 返回: [
 * //   { text: '签署合同', type: 'primary', action: 'sign', visible: true },
 * //   { text: '取消合同', type: 'default', action: 'cancel', visible: true }
 * // ]
 *
 * @example
 * // 场景2: 待乙方签署，当前用户是乙方
 * getContractStatusButtons(2, 'LESSEE', true, false)
 * // 返回: [
 * //   { text: '签署合同', type: 'primary', action: 'sign', visible: true },
 * //   { text: '拒绝签署', type: 'danger', action: 'reject', visible: true }
 * // ]
 */
function getContractStatusButtons(status, userRole, partyASigned, partyBSigned) {
  // 默认按钮配置模板
  const buttons = [];

  // 根据不同状态和角色生成不同的按钮组合
  switch (status) {
    case 1: // 待甲方签署
      if (userRole === 'LESSOR') {
        // 甲方可以签署或取消
        buttons.push(
          { text: '签署合同', type: 'primary', action: 'sign', visible: true },
          { text: '取消合同', type: 'default', action: 'cancel', visible: true }
        );
      } else if (userRole === 'LESSEE') {
        // 乙方只能查看，不能操作（等待甲方签署）
        buttons.push(
          { text: '等待甲方签署', type: 'default', action: 'view', visible: true, disabled: true }
        );
      }
      break;

    case 2: // 待乙方签署
      if (userRole === 'LESSEE') {
        // 乙方可以签署、拒绝
        buttons.push(
          { text: '签署合同', type: 'primary', action: 'sign', visible: true },
          { text: '拒绝签署', type: 'danger', action: 'reject', visible: true }
        );
      } else if (userRole === 'LESSOR') {
        // 甲方可以取消合同
        buttons.push(
          { text: '等待乙方签署', type: 'default', action: 'view', visible: true, disabled: true },
          { text: '取消合同', type: 'default', action: 'cancel', visible: true }
        );
      }
      break;

    case 3: // 已签署（生效）
      // 终态，只能查看或下载
      buttons.push(
        { text: '查看合同', type: 'primary', action: 'view', visible: true },
        { text: '下载PDF', type: 'default', action: 'download', visible: true }
      );

      // 如果是管理员或有权限，可以提前终止
      if (userRole === 'ADMIN' || userRole === 'LESSOR') {
        buttons.push(
          { text: '提前终止', type: 'warning', action: 'terminate', visible: true }
        );
      }
      break;

    case 4: // 已拒绝（终态）
      buttons.push(
        { text: '查看详情', type: 'default', action: 'view', visible: true },
        { text: '重新发起', type: 'primary', action: 'restart', visible: userRole === 'LESSOR' }
      );
      break;

    case 5: // 已取消（终态）
      buttons.push(
        { text: '查看详情', type: 'default', action: 'view', visible: true },
        { text: '重新发起', type: 'primary', action: 'restart', visible: userRole === 'LESSOR' }
      );
      break;

    case 6: // 已到期（终态）
      buttons.push(
        { text: '查看合同', type: 'default', action: 'view', visible: true },
        { text: '续签合同', type: 'primary', action: 'renew', visible: (userRole === 'LESSOR' || userRole === 'LESSEE') }
      );
      break;

    default:
      // 未知状态，只提供查看按钮
      buttons.push(
        { text: '查看详情', type: 'default', action: 'view', visible: true }
      );
      break;
  }

  return buttons;
}

// ========== 原有工具函数（保持向后兼容） ==========

/**
 * 格式化日期
 * @param {Date|string|number} date - 日期
 * @param {string} format - 格式化模板
 */
function formatDate(date, format = 'YYYY-MM-DD') {
  if (!date) return '';

  const d = new Date(date);

  if (isNaN(d.getTime())) return '';

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
}

/**
 * 格式化日期时间
 * @param {Date|string|number} date - 日期
 */
function formatDateTime(date) {
  return formatDate(date, 'YYYY-MM-DD HH:mm:ss');
}

/**
 * 数字转中文大写金额
 * @param {number} num - 数字金额
 */
function digitToChinese(num) {
  if (num === null || num === undefined || num === '') return '';
  num = parseFloat(num);
  if (isNaN(num)) return '';

  const fraction = ['角', '分'];
  const digit = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];
  const unit = [['元', '万', '亿'], ['', '拾', '佰', '仟']];

  let s = '';
  const numStr = Math.abs(num).toFixed(2);
  const [intPart, decPart] = numStr.split('.');

  let k = 0;
  for (let i = intPart.length - 1; i >= 0; i--) {
    const idx = Math.floor((intPart.length - 1 - i) / 4);
    if (k > 0 && k % 4 === 0) s = unit[0][idx] + s;
    s = digit[intPart[i]] + (k % 4 ? unit[1][k % 4] : '') + s;
    k++;
  }

  if (decPart) {
    s += digit[decPart[0]] + fraction[0];
    if (decPart[1] !== '0') s += digit[decPart[1]] + fraction[1];
  } else {
    s += '整';
  }

  return (num < 0 ? '负' : '') + s;
}

/**
 * 计算两个日期之间的月份差
 * @param {Date|string} start - 开始日期
 * @param {Date|string} end - 结束日期
 */
function getMonthDiff(start, end) {
  if (!start || !end) return 0;
  const s = new Date(start);
  const e = new Date(end);
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return 0;

  const diff = e.getFullYear() * 12 + e.getMonth() - (s.getFullYear() * 12 + s.getMonth());
  return diff;
}

/**
 * 防抖函数
 * @param {Function} fn - 要防抖的函数
 * @param {number} delay - 延迟时间（毫秒）
 */
function debounce(fn, delay = 300) {
  let timer = null;
  return function (...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}

/**
 * 节流函数
 * @param {Function} fn - 要节流的函数
 * @param {number} delay - 间隔时间（毫秒）
 */
function throttle(fn, delay = 300) {
  let last = 0;
  return function (...args) {
    const now = Date.now();
    if (now - last >= delay) {
      last = now;
      fn.apply(this, args);
    }
  };
}

/**
 * 导出所有工具函数
 * 使用方式: const { splitDate, combineDate, ... } = require('./utils/helpers');
 */
module.exports = {
  // v2新增 - 日期处理函数
  splitDate,
  combineDate,

  // v2新增 - JSON序列化函数
  serializeFeeItems,
  deserializeFeeItems,
  serializeInventoryItems,
  deserializeInventoryItems,

  // v2新增 - 数据脱敏函数
  maskPhone,
  maskIdCard,

  // v2新增 - UI配置生成器
  getContractStatusButtons,

  // 原有函数（保持向后兼容）
  formatDate,
  formatDateTime,
  digitToChinese,
  getMonthDiff,
  debounce,
  throttle
};
