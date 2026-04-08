/**
 * API 请求服务 - 租赁合同小程序
 * 封装 wx.request，统一处理认证、错误、超时等
 */

const config = require('../config/index')
const BASE_URL = config.apiBaseUrl
const app = getApp()
const { escapeHtml } = require('../utils/sanitize')

// 请求缓存
const requestCache = new Map()
// 缓存默认有效期（5分钟）
const CACHE_DURATION = 5 * 60 * 1000
// 防止重复跳转登录页
let isRedirectingToLogin = false

function sanitizeData(data) {
  if (!data) return data
  if (typeof data === 'string') {
    return escapeHtml(data)
  }
  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item))
  }
  if (typeof data === 'object') {
    const sanitized = {}
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        sanitized[key] = sanitizeData(data[key])
      }
    }
    return sanitized
  }
  return data
}

/**
 * 统一请求封装
 * @param {string} url - 请求路径
 * @param {object} options - 请求选项
 */
function request(url, options = {}) {
  // 为GET请求实现简单缓存（不显示loading的请求）
  if (options.method === 'GET' && !options.showLoading) {
    const cacheKey = url + JSON.stringify(options.data)
    const cached = requestCache.get(cacheKey)
    if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
      return Promise.resolve(cached.data)
    }
  }

  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync('token')
    const {
      method = 'GET',
      data = {},
      header = {},
      showLoading = true,
      loadingText = '加载中...'
    } = options

    const sanitizedData = sanitizeData(data)

    if (showLoading) {
      wx.showLoading({ title: loadingText, mask: true })
    }

    wx.request({
      url: BASE_URL + url,
      data: sanitizedData,
      method,
      header: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        ...header
      },
      success: (res) => {
        if (showLoading) {
          wx.hideLoading()
        }
        if (res.statusCode === 200 || res.statusCode === 201) {
          if (res.data.code === 200 || res.data.code === 201) {
            if (options.method === 'GET' && !options.showLoading) {
              const cacheKey = url + JSON.stringify(options.data)
              requestCache.set(cacheKey, {
                data: res.data,
                timestamp: Date.now()
              })
            }
            resolve(res.data)
          } else if (res.data.code === 401) {
            handleUnauthorized()
            reject(res.data)
          } else {
            wx.showToast({
              title: res.data.message || '请求失败',
              icon: 'none'
            })
            reject(res.data)
          }
        } else if (res.statusCode === 401) {
          handleUnauthorized()
          reject(res.data)
        } else {
          wx.showToast({
            title: res.data?.message || '网络请求失败',
            icon: 'none'
          })
          reject(res.data || { message: '网络请求失败' })
        }
      },
      fail: (err) => {
        if (showLoading) {
          wx.hideLoading()
        }
        wx.showToast({
          title: '网络请求失败',
          icon: 'none'
        })
        reject(err)
      }
    })
  })
}

/**
 * 处理未授权情况
 */
function handleUnauthorized() {
  if (isRedirectingToLogin) return
  isRedirectingToLogin = true

  if (app && typeof app.logout === 'function') {
    app.logout()
  } else {
    wx.removeStorageSync('token')
    wx.removeStorageSync('userInfo')
    wx.removeStorageSync('loginExpiresAt')
  }

  wx.showToast({
    title: '登录已过期，请重新登录',
    icon: 'none'
  })
  setTimeout(() => {
    wx.navigateTo({ url: '/pages/login/index' })
    setTimeout(() => {
      isRedirectingToLogin = false
    }, 2000)
  }, 1500)
}

/**
 * 上传文件
 * @param {string} url - 上传路径
 * @param {string} filePath - 文件路径
 * @param {string} fileName - 文件字段名，默认 'file'
 */
function uploadFile(url, filePath, fileName = 'file') {
  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync('token')

    wx.showLoading({ title: '上传中...', mask: true })

    wx.uploadFile({
      url: BASE_URL + url,
      filePath: filePath,
      name: fileName,
      header: {
        'Authorization': token ? `Bearer ${token}` : ''
      },
      success: (res) => {
        wx.hideLoading()
        if (res.statusCode === 200) {
          const data = JSON.parse(res.data)
          if (data.code === 200) {
            resolve(data)
          } else {
            wx.showToast({
              title: data.message || '上传失败',
              icon: 'none'
            })
            reject(data)
          }
        } else {
          wx.showToast({
            title: '上传失败',
            icon: 'none'
          })
          reject(res)
        }
      },
      fail: (err) => {
        wx.hideLoading()
        wx.showToast({
          title: '上传失败',
          icon: 'none'
        })
        reject(err)
      }
    })
  })
}

// ==================== 用户模块 ====================

/**
 * 发送验证码
 * POST /api/users/send-code
 * @param {string} phone - 手机号
 */
function sendCode(phone) {
  return request('/users/send-code', {
    method: 'POST',
    data: { phone },
    showLoading: false
  })
}

/**
 * 手机号登录
 * POST /api/users/phone-login
 * @param {object} data - { phone, code }
 */
function phoneLogin(data) {
  return request('/users/phone-login', {
    method: 'POST',
    data,
    showLoading: true,
    loadingText: '登录中...'
  })
}

/**
 * 微信登录
 * POST /api/users/wechat-login
 * @param {object} data - { openid }
 */
function wechatLogin(data) {
  return request('/users/wechat-login', {
    method: 'POST',
    data,
    showLoading: true,
    loadingText: '登录中...'
  })
}

/**
 * 获取用户信息
 * GET /api/users/profile
 */
function getProfile() {
  return request('/users/profile')
}

/**
 * 更新用户信息
 * PUT /api/users/profile
 * @param {object} data - { name?, avatar?, phone? }
 */
function updateProfile(data) {
  return request('/users/profile', {
    method: 'PUT',
    data
  })
}

/**
 * 实名认证
 * POST /api/users/real-name/verify
 * @param {object} data - { name, idcard, idcard_front?, idcard_back? }
 */
function realNameVerify(data) {
  return request('/users/real-name/verify', {
    method: 'POST',
    data,
    loadingText: '认证中...'
  })
}

// ==================== 合同模块 ====================

/**
 * 获取甲方合同列表
 * GET /api/contracts/landlord
 * @param {object} params - { status?, keyword?, page?, page_size? }
 */
function getLandlordContracts(params = {}) {
  return request('/contracts/landlord', { data: params })
}

/**
 * 获取乙方合同列表
 * GET /api/contracts/tenant
 * @param {object} params - { status?, keyword?, page?, page_size? }
 */
function getTenantContracts(params = {}) {
  return request('/contracts/tenant', { data: params })
}

/**
 * 获取合同详情
 * GET /api/contracts/:id
 * @param {number} id - 合同ID
 */
function getContractDetail(id) {
  return request(`/contracts/${id}`)
}

/**
 * 创建合同
 * POST /api/contracts
 * @param {object} data - 合同数据
 */
function createContract(data) {
  return request('/contracts', {
    method: 'POST',
    data,
    loadingText: '创建中...'
  })
}

/**
 * 更新合同
 * PUT /api/contracts/:id
 * @param {number} id - 合同ID
 * @param {object} data - 更新的数据
 */
function updateContract(id, data) {
  return request(`/contracts/${id}`, {
    method: 'PUT',
    data,
    loadingText: '更新中...'
  })
}

/**
 * 删除合同
 * DELETE /api/contracts/:id
 * @param {number} id - 合同ID
 */
function deleteContract(id) {
  return request(`/contracts/${id}`, {
    method: 'DELETE',
    loadingText: '删除中...'
  })
}

// ==================== 签署模块 ====================

/**
 * 甲方签署合同
 * POST /api/contracts/:id/sign
 * @param {number} id - 合同ID
 * @param {string} signature - 签名图片Base64
 */
function lessorSign(id, signature) {
  return request(`/contracts/${id}/sign`, {
    method: 'POST',
    data: { signature },
    loadingText: '签署中...'
  })
}

/**
 * 乙方签署合同
 * POST /api/contracts/:id/tenant-sign
 * @param {number} id - 合同ID
 * @param {string} signature - 签名图片Base64
 */
function tenantSign(id, signature) {
  return request(`/contracts/${id}/tenant-sign`, {
    method: 'POST',
    data: { signature },
    loadingText: '签署中...'
  })
}

/**
 * 拒绝签署
 * POST /api/contracts/:id/reject
 * @param {number} id - 合同ID
 * @param {string} reason - 拒绝原因
 */
function rejectContract(id, reason) {
  return request(`/contracts/${id}/reject`, {
    method: 'POST',
    data: { reason },
    loadingText: '提交中...'
  })
}

/**
 * 取消合同
 * POST /api/contracts/:id/cancel
 * @param {number} id - 合同ID
 */
function cancelContract(id) {
  return request(`/contracts/${id}/cancel`, {
    method: 'POST',
    loadingText: '取消中...'
  })
}

/**
 * 生成分享链接
 * POST /api/contracts/:id/share
 * @param {number} id - 合同ID
 */
function shareContract(id) {
  return request(`/contracts/${id}/share`, {
    method: 'POST',
    loadingText: '生成中...'
  })
}

// ==================== 验证模块 ====================

/**
 * 验证邀请码
 * GET /api/contracts/invite-verify/:code
 * @param {string} code - 邀请码
 */
function verifyInviteCode(code) {
  return request(`/contracts/invite-verify/${code}`, {
    showLoading: false
  })
}

/**
 * 验证合同真伪
 * GET /api/contracts/verify/:code
 * @param {string} code - 合同编号
 */
function verifyContract(code) {
  return request(`/contracts/verify/${code}`, {
    showLoading: false
  })
}

// ==================== PDF模块 ====================

/**
 * 生成合同PDF
 * GET /api/contracts/:id/pdf
 * @param {number} id - 合同ID
 */
function generateContractPdf(id) {
  return request(`/contracts/${id}/pdf`)
}

/**
 * 下载合同PDF到本地
 * @param {number} id - 合同ID
 * @returns {Promise<string>} 返回本地文件路径
 */
function downloadContractPdf(id) {
  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync('token')
    const staticBase = 'http://localhost:3000'

    request(`/contracts/${id}/pdf`).then((res) => {
      if (res.data?.url) {
        const pdfUrl = `${staticBase}${res.data.url}`

        wx.downloadFile({
          url: pdfUrl,
          header: {
            'Authorization': `Bearer ${token}`
          },
          success: (downloadRes) => {
            if (downloadRes.statusCode === 200 && downloadRes.tempFilePath) {
              resolve(downloadRes.tempFilePath)
            } else {
              reject(new Error(`下载失败, statusCode: ${downloadRes.statusCode}`))
            }
          },
          fail: reject
        })
      } else {
        reject(new Error('获取PDF失败'))
      }
    }).catch(reject)
  })
}

// ==================== 文件上传模块 ====================

/**
 * 上传图片
 * POST /api/upload/image
 * @param {string} filePath - 图片路径
 */
function uploadImage(filePath) {
  return uploadFile('/upload/image', filePath, 'file')
}

// ==================== 邀请模块 ====================

/**
 * 获取收到的签署邀请列表
 * GET /api/invitations
 */
function getInvitations() {
  return request('/invitations')
}

/**
 * 通过邀请码获取合同信息（乙方）
 * GET /api/invitations/:code
 * @param {string} code - 邀请码
 */
function getContractByInviteCode(code) {
  return request(`/invitations/${code}`, {
    showLoading: false
  })
}

/**
 * 接受签署邀请（乙方）
 * POST /api/invitations/:code/accept
 * @param {string} code - 邀请码
 * @param {string} phone - 乙方手机号
 */
function acceptInvitation(code, phone) {
  return request(`/invitations/${code}/accept`, {
    method: 'POST',
    data: { receiver_phone: phone },
    loadingText: '接受中...'
  })
}

/**
 * 拒绝签署邀请（乙方）
 * POST /api/invitations/:code/reject
 * @param {string} code - 邀请码
 * @param {string} phone - 乙方手机号
 * @param {string} reason - 拒绝原因
 */
function rejectInvitation(code, phone, reason) {
  return request(`/invitations/${code}/reject`, {
    method: 'POST',
    data: { receiver_phone: phone, reason },
    loadingText: '提交中...'
  })
}

// ==================== 签名记录模块 ====================

/**
 * 创建签名记录
 * POST /api/signatures
 * @param {object} data - { contract_id, sign_type, sign_role, sign_image, sign_data?, sign_location? }
 */
function createSignature(data) {
  return request('/signatures', {
    method: 'POST',
    data
  })
}

/**
 * 获取合同签名记录
 * GET /api/signatures/:contract_id
 * @param {number} contractId - 合同ID
 */
function getSignatures(contractId) {
  return request(`/signatures/${contractId}`)
}

/**
 * 获取签名详情
 * GET /api/signatures/detail/:id
 * @param {number} id - 签名ID
 */
function getSignatureDetail(id) {
  return request(`/signatures/detail/${id}`)
}

// ==================== 模板模块 ====================

/**
 * 获取模板列表
 * GET /api/templates
 */
function getTemplates() {
  return request('/templates')
}

/**
 * 获取模板详情
 * GET /api/templates/:id
 * @param {number} id - 模板ID
 */
function getTemplateDetail(id) {
  return request(`/templates/${id}`)
}

// ==================== 测试数据模块 ====================

/**
 * 获取测试用户列表
 * GET /api/test-data/users
 */
function getTestUsers() {
  return request('/test-data/users', {
    showLoading: false
  })
}

/**
 * 获取测试合同列表
 * GET /api/test-data/contracts
 */
function getTestContracts() {
  return request('/test-data/contracts', {
    showLoading: false
  })
}

/**
 * 获取测试合同详情
 * GET /api/test-data/contracts/:id
 * @param {number} id - 合同ID
 */
function getTestContractById(id) {
  return request(`/test-data/contracts/${id}`, {
    showLoading: false
  })
}

/**
 * 重置测试数据
 * GET /api/test-data/reset
 */
function resetTestData() {
  return request('/test-data/reset', {
    showLoading: true,
    loadingText: '重置测试数据...'
  })
}

// ==================== 导出 ====================

module.exports = {
  request,
  uploadFile,
  uploadImage,

  // 用户模块
  sendCode,
  phoneLogin,
  wechatLogin,
  getProfile,
  updateProfile,
  realNameVerify,

  // 合同模块
  getLandlordContracts,
  getTenantContracts,
  getContractDetail,
  createContract,
  updateContract,
  deleteContract,

  // 签署模块
  lessorSign,
  tenantSign,
  rejectContract,
  cancelContract,
  shareContract,

  // 验证模块
  verifyInviteCode,
  verifyContract,

  // PDF模块
  generateContractPdf,
  downloadContractPdf,

  // 邀请模块
  getInvitations,
  getContractByInviteCode,
  acceptInvitation,
  rejectInvitation,

  // 签名记录模块
  createSignature,
  getSignatures,
  getSignatureDetail,

  // 模板模块
  getTemplates,
  getTemplateDetail,

  // 测试数据模块
  getTestUsers,
  getTestContracts,
  getTestContractById,
  resetTestData,

  // 配置
  BASE_URL
}