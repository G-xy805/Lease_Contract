function formatDate(date, format = 'YYYY-MM-DD') {
  if (!date) return ''
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''

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

function formatDateTime(date) {
  return formatDate(date, 'YYYY-MM-DD HH:mm:ss')
}

function digitToChinese(num) {
  if (num === null || num === undefined || num === '') return ''
  num = parseFloat(num)
  if (isNaN(num)) return ''

  const fraction = ['角', '分']
  const digit = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖']
  const unit = [['元', '万', '亿'], ['', '拾', '佰', '仟']]

  let s = ''
  const numStr = Math.abs(num).toFixed(2)
  const [intPart, decPart] = numStr.split('.')

  let k = 0
  for (let i = intPart.length - 1; i >= 0; i--) {
    const idx = Math.floor((intPart.length - 1 - i) / 4)
    if (k > 0 && k % 4 === 0) s = unit[0][idx] + s
    s = digit[intPart[i]] + (k % 4 ? unit[1][k % 4] : '') + s
    k++
  }

  if (decPart) {
    s += digit[decPart[0]] + fraction[0]
    if (decPart[1] !== '0') s += digit[decPart[1]] + fraction[1]
  } else {
    s += '整'
  }

  return (num < 0 ? '负' : '') + s
}

function getMonthDiff(start, end) {
  if (!start || !end) return 0
  const s = new Date(start)
  const e = new Date(end)
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return 0

  const diff = e.getFullYear() * 12 + e.getMonth() - (s.getFullYear() * 12 + s.getMonth())
  return diff
}

function debounce(fn, delay = 300) {
  let timer = null
  return function (...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  }
}

function throttle(fn, delay = 300) {
  let last = 0
  return function (...args) {
    const now = Date.now()
    if (now - last >= delay) {
      last = now
      fn.apply(this, args)
    }
  }
}

module.exports = { formatDate, formatDateTime, digitToChinese, getMonthDiff, debounce, throttle }
