function validatePhone(phone) {
  if (!phone) return false
  const reg = /^1[3-9]\d{9}$/
  return reg.test(phone)
}

function validateIdCard(idcard) {
  if (!idcard) return false
  const reg = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/
  return reg.test(idcard)
}

function validateMoney(amount) {
  if (amount === null || amount === undefined || amount === '') return false
  const reg = /^\d+(\.\d{1,2})?$/
  return reg.test(String(amount))
}

function validateRequired(value) {
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.trim().length > 0
  return true
}

module.exports = { validatePhone, validateIdCard, validateMoney, validateRequired }
