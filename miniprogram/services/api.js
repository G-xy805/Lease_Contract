/**
 * API 请求服务 - 租赁合同小程序
 * 封装 wx.request，统一处理认证、错误、超时等
 */

const app = getApp()
const BASE_URL = 'http://localhost:3000/api'

/**
 * 统一请求封装
 * @param {string} url - 请求路径
 * @param {object} options - 请求选项
 * @param {string} options.method - HTTP方法，默认GET
 * @param {object} options.data - 请求数据
 * @param {object} options.header - 请求头
 * @param {boolean} options.showLoading - 是否显示加载提示，默认true
 * @param {string} options.loadingText - 加载提示文本
 */
function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync('token')
    const {
      method = 'GET',
      data = {},
      header = {},
      showLoading = true,
      loadingText = '加载中...'
    } = options

    if (showLoading) {
      wx.showLoading({ title: loadingText, mask: true })
    }

    wx.request({
      url: BASE_URL + url,
      data,
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

        if (res.statusCode === 200) {
          if (res.data.code === 200) {
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
            title: '网络请求失败',
            icon: 'none'
          })
          reject(res.data)
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
  wx.removeStorageSync('token')
  wx.removeStorageSync('userInfo')
  wx.showToast({
    title: '登录已过期，请重新登录',
    icon: 'none'
  })
  setTimeout(() => {
    wx.navigateTo({ url: '/pages/login/index' })
  }, 1500)
}

/**
 * 上传文件（图片/文件）
 * @param {string} url - 上传路径
 * @param {string} filePath - 文件路径
 * @param {string} fileName - 文件字段名
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
 * @param {object} data - { phone, code, role }
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
 * @param {object} data - { openid, role }
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
 */
function getUserProfile() {
  return request('/users/profile')
}

/**
 * 更新用户信息
 * @param {object} data - { name?, idcard_front?, idcard_back? }
 */
function updateProfile(data) {
  return request('/users/profile', {
    method: 'PUT',
    data
  })
}

/**
 * 实名认证
 * @param {object} data - { name, idcard, idcard_front?, idcard_back? }
 */
function realNameVerify(data) {
  return request('/users/real-name/verify', {
    method: 'POST',
    data,
    loadingText: '认证中...'
  })
}

// ==================== 管理员模块 ====================

/**
 * 申请成为甲方
 */
function applyLessor() {
  return request('/users/apply-lessor', {
    method: 'POST',
    loadingText: '申请中...'
  })
}

/**
 * 审核甲方申请
 * @param {number} userId - 用户ID
 * @param {boolean} approved - 是否通过
 */
function auditLessor(userId, approved) {
  return request('/users/audit-lessor', {
    method: 'POST',
    data: { userId, approved },
    loadingText: '审核中...'
  })
}

/**
 * 封禁用户
 * @param {number} userId - 用户ID
 */
function banUser(userId) {
  return request(`/users/${userId}/ban`, {
    method: 'POST',
    loadingText: '封禁中...'
  })
}

/**
 * 解封用户
 * @param {number} userId - 用户ID
 */
function unbanUser(userId) {
  return request(`/users/${userId}/unban`, {
    method: 'POST',
    loadingText: '解封中...'
  })
}

// ==================== 合同模块（甲方） ====================

/**
 * 获取甲方合同列表
 * @param {object} params - { status?, keyword?, start_date?, end_date?, page?, page_size? }
 */
function getLandlordContracts(params = {}) {
  return request('/contracts/landlord', { data: params })
}

/**
 * 获取乙方合同列表
 * @param {object} params - { status?, keyword?, start_date?, end_date?, page?, page_size? }
 */
function getTenantContracts(params = {}) {
  return request('/contracts/tenant', { data: params })
}

/**
 * 获取合同详情
 * @param {number} id - 合同ID
 */
function getContractDetail(id) {
  return request(`/contracts/${id}`)
}

/**
 * 创建合同
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
 * @param {number} id - 合同ID
 */
function deleteContract(id) {
  return request(`/contracts/${id}`, {
    method: 'DELETE',
    loadingText: '删除中...'
  })
}

/**
 * 甲方签署合同
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
 * 生成分享链接
 * @param {number} id - 合同ID
 */
function shareContract(id) {
  return request(`/contracts/${id}/share`, {
    method: 'POST',
    loadingText: '生成中...'
  })
}

/**
 * 验证邀请码
 * @param {string} code - 邀请码
 */
function verifyInviteCode(code) {
  return request(`/contracts/invite-verify/${code}`, {
    showLoading: false
  })
}

// ==================== 合同模块（乙方） ====================

/**
 * 乙方签署合同
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
 * @param {number} id - 合同ID
 */
function cancelContract(id) {
  return request(`/contracts/${id}/cancel`, {
    method: 'POST',
    loadingText: '取消中...'
  })
}

// ==================== 合同PDF与验证 ====================

/**
 * 生成合同PDF
 * @param {number} id - 合同ID
 */
function generateContractPdf(id) {
  return request(`/contracts/${id}/pdf`)
}

/**
 * 下载合同PDF
 * @param {number} id - 合同ID
 * @returns {Promise<string>} 返回本地文件路径
 */
function downloadContractPdf(id) {
  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync('token')
    const staticBase = getApp().globalData.baseUrl || 'http://localhost:3000'

    // 先调用 API 获取 PDF URL
    wx.request({
      url: `${BASE_URL}/contracts/${id}/pdf`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      success: (res) => {
        if (res.data.code === 200 && res.data.data?.url) {
          // 拼接 PDF 下载地址（uploads 在根路径 /uploads）
          const pdfUrl = `${staticBase}${res.data.data.url}`
          console.log('PDF下载地址:', pdfUrl)

          // 下载文件到本地
          wx.downloadFile({
            url: pdfUrl,
            header: {
              'Authorization': `Bearer ${token}`
            },
            success: (downloadRes) => {
              console.log('downloadFile响应:', downloadRes)
              if (downloadRes.statusCode === 200 && downloadRes.tempFilePath) {
                console.log('下载成功, tempFilePath:', downloadRes.tempFilePath)
                resolve(downloadRes.tempFilePath)
              } else {
                console.error('下载失败, statusCode:', downloadRes.statusCode)
                reject(new Error(`下载失败, statusCode: ${downloadRes.statusCode}`))
              }
            },
            fail: (err) => {
              console.error('下载PDF失败:', err)
              reject(err)
            }
          })
        } else {
          reject(new Error(res.data.message || '获取PDF失败'))
        }
      },
      fail: (err) => {
        console.error('请求PDF失败:', err)
        reject(err)
      }
    })
  })
}

/**
 * 验证合同真伪
 * @param {string} code - 合同编号
 */
function verifyContract(code) {
  return request(`/contracts/verify/${code}`, {
    showLoading: false
  })
}

// ==================== 邀请模块 ====================

/**
 * 获取收到的签署邀请列表
 */
function getInvitations() {
  return request('/invitations')
}

/**
 * 通过邀请码获取合同信息（乙方）
 * @param {string} code - 邀请码
 */
function getContractByInviteCode(code) {
  return request(`/invitations/${code}`, {
    showLoading: false
  })
}

/**
 * 接受签署邀请
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
 * 拒绝签署邀请
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

// ==================== 签名模块 ====================

/**
 * 创建签名记录
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
 * @param {number} contractId - 合同ID
 */
function getSignatures(contractId) {
  return request(`/signatures/${contractId}`)
}

/**
 * 获取签名详情
 * @param {number} id - 签名ID
 */
function getSignatureDetail(id) {
  return request(`/signatures/detail/${id}`)
}

// ==================== 文件上传模块 ====================

/**
 * 上传图片
 * @param {string} filePath - 图片路径
 */
function uploadImage(filePath) {
  return uploadFile('/upload/image', filePath, 'file')
}

/**
 * 上传文件
 * @param {string} filePath - 文件路径
 */
function uploadGeneralFile(filePath) {
  return uploadFile('/upload/file', filePath, 'file')
}

// ==================== 模板模块 ====================

/**
 * 获取模板列表
 */
function getTemplates() {
  return request('/templates')
}

/**
 * 获取模板详情
 * @param {number} id - 模板ID
 */
function getTemplateDetail(id) {
  return request(`/templates/${id}`)
}

/**
 * 获取模板字段映射
 */
function getFieldMappings() {
  return request('/templates/fields/mapping')
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
  getUserProfile,
  updateProfile,
  realNameVerify,

  // 管理员模块
  applyLessor,
  auditLessor,
  banUser,
  unbanUser,

  // 合同模块
  getLandlordContracts,
  getTenantContracts,
  getContractDetail,
  createContract,
  updateContract,
  deleteContract,
  lessorSign,
  shareContract,
  verifyInviteCode,
  tenantSign,
  rejectContract,
  cancelContract,
  generateContractPdf,
  downloadContractPdf,
  verifyContract,

  // 邀请模块
  getInvitations,
  getContractByInviteCode,
  acceptInvitation,
  rejectInvitation,

  // 签名模块
  createSignature,
  getSignatures,
  getSignatureDetail,

  // 模板模块
  getTemplates,
  getTemplateDetail,
  getFieldMappings
}
