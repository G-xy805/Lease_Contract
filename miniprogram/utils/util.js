// utils/util.js

/**
 * 验证身份证号格式（18位）
 * @param {string} idCard - 身份证号
 * @returns {boolean}
 */
function checkIdCard(idCard) {
  if (!idCard) return false

  // 18位身份证号正则
  const reg = /^[1-9]\d{5}(19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/

  if (!reg.test(idCard)) {
    return false
  }

  // 校验位验证
  const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2]
  const checkCodes = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2']

  let sum = 0
  for (let i = 0; i < 17; i++) {
    sum += parseInt(idCard[i]) * weights[i]
  }

  const checkCode = checkCodes[sum % 11]
  const lastChar = idCard[17].toUpperCase()

  return checkCode === lastChar
}

/**
 * 验证手机号格式（11位）
 * @param {string} phone - 手机号
 * @returns {boolean}
 */
function checkPhone(phone) {
  if (!phone) return false

  // 11位手机号正则（中国大陆）
  const reg = /^1[3-9]\d{9}$/

  return reg.test(phone)
}

/**
 * 数字转中文大写
 * @param {number|string} num - 数字
 * @returns {string}
 */
function formatNumberToChinese(num) {
  if (!num && num !== 0) return ''

  const numStr = num.toString()
  if (numStr.indexOf('.') > -1) {
    // 包含小数
    const parts = numStr.split('.')
    const integerPart = formatIntegerToChinese(parts[0])
    const decimalPart = formatDecimalToChinese(parts[1])
    return integerPart + '元' + decimalPart
  } else {
    return formatIntegerToChinese(numStr) + '元整'
  }
}

/**
 * 整数部分转中文大写
 * @param {string} numStr - 数字字符串
 * @returns {string}
 */
function formatIntegerToChinese(numStr) {
  if (numStr === '0') return '零'

  const units = ['', '万', '亿']
  const digits = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖']

  let result = ''
  let tempNum = parseInt(numStr)
  let unitIndex = 0

  while (tempNum > 0) {
    const chunk = tempNum % 10000
    let chunkStr = convertChunkToChinese(chunk)

    if (unitIndex > 0 && chunk > 0) {
      chunkStr += units[unitIndex - 1]
    }

    result = chunkStr + result
    tempNum = Math.floor(tempNum / 10000)
    unitIndex++
  }

  // 移除末尾的零
  result = result.replace(/零+$/, '')

  return result
}

/**
 * 转换4位数块为中文
 * @param {number} chunk - 0-9999的数字
 * @returns {string}
 */
function convertChunkToChinese(chunk) {
  if (chunk === 0) return ''

  const digits = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖']
  const units = ['', '拾', '佰', '仟']

  let result = ''
  let prevIsZero = false

  for (let i = 3; i >= 0; i--) {
    const unitValue = Math.pow(10, i)
    const digit = Math.floor(chunk / unitValue)

    if (digit > 0) {
      if (prevIsZero && result.length > 0) {
        result += '零'
      }
      result += digits[digit]
      if (i > 0) {
        result += units[i]
      }
      prevIsZero = false
    } else {
      prevIsZero = true
    }

    chunk = chunk % unitValue
  }

  return result
}

/**
 * 小数部分转中文大写
 * @param {string} decimalStr - 小数字符串
 * @returns {string}
 */
function formatDecimalToChinese(decimalStr) {
  if (!decimalStr || decimalStr === '0') return '整'

  const digits = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖']
  let result = '点'

  for (let i = 0; i < decimalStr.length && i < 2; i++) {
    const digit = parseInt(decimalStr[i])
    result += digits[digit]
  }

  return result
}

/**
 * 格式化日期
 * @param {Date|number|string} date - 日期
 * @param {string} format - 格式
 * @returns {string}
 */
function formatDate(date, format = 'YYYY-MM-DD') {
  const d = new Date(date)

  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')

  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
}

module.exports = {
  checkIdCard,
  checkPhone,
  formatNumberToChinese,
  formatDate
}