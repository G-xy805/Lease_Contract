/**
 * API 请求服务 - 租赁合同小程序 (v2.0 完全重写版)
 *
 * 核心变更:
 * - 统一错误处理机制（5种错误类型分类）
 * - GET请求缓存机制（5分钟有效期）
 * - Token自动刷新拦截器（提前5分钟刷新）
 * - 合同模块适配v2数据库格式
 * - 统一签署接口 signContract（替代 lessorSign/tenantSign）
 * - 邀请模块参数名更新为 invitee_phone
 *
 * @module services/api
 * @version 2.0
 */

// ===== 1. 配置和常量 =====

const config = require('../config/index');
const BASE_URL = config.apiBaseUrl;
const { escapeHtml } = require('../utils/sanitize');
const {
  serializeFeeItems,
  serializeInventoryItems,
  splitDate,
  combineDate
} = require('../utils/helpers');
const { APP_CONFIG, SignRole } = require('../utils/constants');

// 缓存配置
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存有效期

// Token刷新阈值：提前5分钟刷新
const TOKEN_REFRESH_THRESHOLD = APP_CONFIG.TOKEN_REFRESH_THRESHOLD || (5 * 60 * 1000);

// 防止重复跳转登录页
let isRedirectingToLogin = false;

// ===== 2. 统一错误处理机制 =====

/**
 * 错误类型分类处理器
 * 支持5种错误类型的统一处理：
 * - NETWORK: 网络错误（request:fail）
 * - AUTH: 认证错误（401）- 自动跳转登录页
 * - VALIDATION: 验证错误（422）- 显示后端返回的错误消息
 * - BUSINESS: 业务逻辑错误（403/409）- 显示操作不允许提示
 * - SERVER: 服务器错误（500+）- 显示服务器繁忙提示
 */
const ERROR_HANDLERS = {
  /**
   * 网络错误处理器
   * 匹配条件: err.errMsg 包含 'request:fail'
   */
  NETWORK: {
    match: (err) => err && err.errMsg && err.errMsg.includes('request:fail'),
    handle: () => {
      wx.showToast({
        title: '网络请求失败',
        icon: 'none',
        duration: 2000
      });
      return new Error('网络请求失败，请检查网络连接');
    }
  },

  /**
   * 认证错误处理器（401）
   * 匹配条件: HTTP状态码 === 401
   * 处理动作: 清除登录状态 + 跳转登录页
   */
  AUTH: {
    match: (res) => res && res.statusCode === 401,
    handle: () => {
      const app = getApp();
      if (app && typeof app.logout === 'function') {
        app.logout(); // 清除token和全局状态
      } else {
        wx.removeStorageSync('token');
        wx.removeStorageSync('userInfo');
        wx.removeStorageSync('loginExpiresAt');
      }

      if (!isRedirectingToLogin) {
        isRedirectingToLogin = true;
        wx.showToast({
          title: '登录已过期，请重新登录',
          icon: 'none',
          duration: 1500
        });
        setTimeout(() => {
          wx.reLaunch({ url: '/pages/login/index' });
          setTimeout(() => {
            isRedirectingToLogin = false;
          }, 2000);
        }, 1500);
      }

      return new Error('登录已过期，请重新登录');
    }
  },

  /**
   * 验证错误处理器（422）
   * 匹配条件: HTTP状态码 === 422
   * 处理动作: 显示后端返回的验证错误消息
   */
  VALIDATION: {
    match: (res) => res && res.statusCode === 422,
    handle: (res) => {
      const msg = (res.data && res.data.message) || '数据验证失败';
      wx.showToast({
        title: msg,
        icon: 'none',
        duration: 2000
      });
      return new Error(msg);
    }
  },

  /**
   * 业务逻辑错误处理器（403/409）
   * 匹配条件: HTTP状态码为 403 或 409
   * 处理动作: 显示业务规则限制提示
   */
  BUSINESS: {
    match: (res) => res && [403, 409].includes(res.statusCode),
    handle: (res) => {
      const msg = (res.data && res.data.message) || '操作不允许';
      wx.showToast({
        title: msg,
        icon: 'none',
        duration: 2000
      });
      return new Error(msg);
    }
  },

  /**
   * 服务器错误处理器（500+）
   * 匹配条件: HTTP状态码 >= 500
   * 处理动作: 显示服务器繁忙提示
   */
  SERVER: {
    match: (res) => res && res.statusCode >= 500,
    handle: () => {
      wx.showToast({
        title: '服务器繁忙，请稍后重试',
        icon: 'none',
        duration: 2000
      });
      return new Error('服务器内部错误');
    }
  }
};

/**
 * 分类并处理错误
 * @param {Object} errorOrResponse - 错误对象或HTTP响应对象
 * @returns {Error|null} 处理后的错误对象
 */
function classifyAndHandleError(errorOrResponse) {
  for (const handlerType of Object.keys(ERROR_HANDLERS)) {
    const handler = ERROR_HANDLERS[handlerType];
    if (handler.match(errorOrResponse)) {
      return handler.handle(errorOrResponse);
    }
  }

  // 未匹配到任何已知错误类型时的默认处理
  if (errorOrResponse.data && errorOrResponse.data.message) {
    wx.showToast({
      title: errorOrResponse.data.message,
      icon: 'none',
      duration: 2000
    });
    return new Error(errorOrResponse.data.message);
  }

  return new Error('未知错误');
}

// ===== 3. GET请求缓存机制 =====

/**
 * 缓存存储结构
 * Key格式: `${method}:${url}:${JSON.stringify(params)}`
 * Value: { data: any, timestamp: number, dependencies: string[] }
 */
const requestCache = new Map();

/**
 * 缓存依赖关系
 * 用于自动失效关联缓存
 * 格式: { resourceKey: [dependentCacheKeys] }
 */
const cacheDependencies = new Map();

/**
 * 生成缓存键
 * @param {string} method - HTTP方法（GET/POST等）
 * @param {string} url - 请求URL路径
 * @param {Object} params - 请求参数
 * @returns {string} 缓存键
 */
function getCacheKey(method, url, params) {
  return `${method || 'GET'}:${url}:${JSON.stringify(params || {})}`;
}

/**
 * 获取缓存数据
 * 如果缓存存在且未过期则返回数据，否则删除缓存并返回null
 * @param {string} key - 缓存键
 * @returns {*} 缓存的数据或null
 */
function getCachedData(key) {
  const cached = requestCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`[API Cache] 命中缓存: ${key}`);
    return cached.data;
  }
  // 缓存不存在或已过期，删除
  if (cached) {
    requestCache.delete(key);
    console.log(`[API Cache] 缓存已过期: ${key}`);
  }
  return null;
}

/**
 * 设置缓存数据
 * @param {string} key - 缓存键
 * @param {*} data - 要缓存的数据
 * @param {string[]} dependencies - 缓存依赖的资源键
 */
function setCachedData(key, data, dependencies = []) {
  requestCache.set(key, {
    data: data,
    timestamp: Date.now(),
    dependencies: dependencies
  });
  console.log(`[API Cache] 已缓存: ${key}`);
  
  // 建立依赖关系
  dependencies.forEach(depKey => {
    if (!cacheDependencies.has(depKey)) {
      cacheDependencies.set(depKey, []);
    }
    cacheDependencies.get(depKey).push(key);
  });
}

/**
 * 清除指定模式的缓存
 * 支持两种模式:
 * 1. 清除所有缓存: clearCache() 或 clearCache('*')
 * 2. 清除指定URL前缀的缓存: clearCache('/contracts')
 * 3. 清除指定资源的缓存及其依赖: clearCache({ resource: 'contract', id: 123 })
 *
 * @param {string|Object} pattern - 可选的URL模式匹配或资源对象
 */
function clearCache(pattern) {
  if (!pattern || pattern === '*') {
    // 清除所有缓存
    const size = requestCache.size;
    requestCache.clear();
    cacheDependencies.clear();
    console.log(`[API Cache] 已清除全部缓存 (${size}条)`);
    return;
  }

  if (typeof pattern === 'string') {
    // 清除匹配指定模式的缓存
    let count = 0;
    for (const key of requestCache.keys()) {
      if (key.includes(pattern)) {
        requestCache.delete(key);
        count++;
      }
    }
    console.log(`[API Cache] 已清除匹配 "${pattern}" 的缓存 (${count}条)`);
    
    // 清除相关依赖
    for (const depKey of cacheDependencies.keys()) {
      if (depKey.includes(pattern)) {
        const dependentKeys = cacheDependencies.get(depKey);
        if (dependentKeys) {
          dependentKeys.forEach(dependentKey => {
            requestCache.delete(dependentKey);
            console.log(`[API Cache] 已清除依赖缓存: ${dependentKey}`);
          });
        }
        cacheDependencies.delete(depKey);
      }
    }
  } else if (typeof pattern === 'object' && pattern.resource) {
    // 清除指定资源的缓存及其依赖
    const resourceKey = `${pattern.resource}:${pattern.id || '*'}`;
    const dependentKeys = cacheDependencies.get(resourceKey) || [];
    
    dependentKeys.forEach(key => {
      requestCache.delete(key);
      console.log(`[API Cache] 已清除依赖缓存: ${key}`);
    });
    
    cacheDependencies.delete(resourceKey);
    console.log(`[API Cache] 已清除资源 "${resourceKey}" 的依赖缓存 (${dependentKeys.length}条)`);
  }
}

/**
 * 当资源更新时，自动清除相关缓存
 * @param {string} resource - 资源类型 (e.g., 'contract', 'user')
 * @param {number|string} id - 资源ID
 */
function invalidateResourceCache(resource, id) {
  const resourceKey = `${resource}:${id || '*'}`;
  clearCache({ resource, id });
  console.log(`[API Cache] 已使资源 "${resourceKey}" 的缓存失效`);
}

// ===== 4. Token管理 =====

/**
 * 获取当前存储的Token
 * @returns {string|null} JWT Token或null
 */
function getToken() {
  try {
    return wx.getStorageSync('token') || null;
  } catch (e) {
    console.error('[API Token] 获取Token失败:', e);
    return null;
  }
}

/**
 * 检查并在需要时自动刷新Token
 * 当Token即将在5分钟内过期时，自动调用刷新接口
 *
 * @returns {Promise<boolean>} 是否可以继续请求（true=可以/false=需要重新登录）
 */
async function checkAndRefreshToken() {
  try {
    const app = getApp();

    // 检查是否有全局登录状态
    if (!app || !app.globalData || !app.globalData.loginExpiresAt) {
      return true; // 无过期时间信息，允许继续
    }

    const expiresAt = app.globalData.loginExpiresAt;
    const now = Date.now();

    // 检查是否需要提前刷新（距离过期还有不到5分钟）
    if (now > expiresAt - TOKEN_REFRESH_THRESHOLD) {
      console.log('[API Token] Token即将过期，尝试自动刷新...');

      try {
        // 调用刷新Token接口（使用原始wx.request避免循环调用）
        const currentToken = getToken();
        if (!currentToken) {
          console.warn('[API Token] 无有效Token，无法刷新');
          // 刷新失败，强制重新登录
          if (app && typeof app.logout === 'function') {
            app.logout();
          } else {
            wx.removeStorageSync('token');
            wx.removeStorageSync('userInfo');
            wx.removeStorageSync('loginExpiresAt');
          }

          if (!isRedirectingToLogin) {
            isRedirectingToLogin = true;
            wx.showToast({
              title: '登录已过期，请重新登录',
              icon: 'none'
            });
            setTimeout(() => {
              wx.reLaunch({ url: '/pages/login/index' });
              setTimeout(() => {
                isRedirectingToLogin = false;
              }, 2000);
            }, 1500);
          }
          return false;
        }

        const refreshRes = await new Promise((resolve, reject) => {
          wx.request({
            url: `${BASE_URL}/api/refresh-token`,
            method: 'POST',
            header: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${currentToken}`
            },
            success: (res) => resolve(res),
            fail: (err) => reject(err)
          });
        });

        if (refreshRes.statusCode === 200 && refreshRes.data.code === 200) {
          // 刷新成功，更新全局状态
          const newToken = refreshRes.data.data.token;
          if (app && typeof app.updateLoginState === 'function') {
            app.updateLoginState(app.globalData.userInfo, newToken);
          } else {
            // 兼容无updateLoginState方法的情况
            wx.setStorageSync('token', newToken);
          }
          console.log('[API Token] Token刷新成功');
          return true;
        } else {
          console.warn('[API Token] Token刷新失败:', refreshRes.data);
          // 刷新失败，强制重新登录
          if (app && typeof app.logout === 'function') {
            app.logout();
          } else {
            wx.removeStorageSync('token');
            wx.removeStorageSync('userInfo');
            wx.removeStorageSync('loginExpiresAt');
          }

          if (!isRedirectingToLogin) {
            isRedirectingToLogin = true;
            wx.showToast({
              title: '登录已过期，请重新登录',
              icon: 'none'
            });
            setTimeout(() => {
              wx.reLaunch({ url: '/pages/login/index' });
              setTimeout(() => {
                isRedirectingToLogin = false;
              }, 2000);
            }, 1500);
          }
          return false;
        }
      } catch (refreshError) {
        console.error('[API Token] Token刷新异常:', refreshError);
        // 刷新失败，强制重新登录
        if (app && typeof app.logout === 'function') {
          app.logout();
        } else {
          wx.removeStorageSync('token');
          wx.removeStorageSync('userInfo');
          wx.removeStorageSync('loginExpiresAt');
        }

        if (!isRedirectingToLogin) {
          isRedirectingToLogin = true;
          wx.showToast({
            title: '登录已过期，请重新登录',
            icon: 'none'
          });
          setTimeout(() => {
            wx.reLaunch({ url: '/pages/login/index' });
            setTimeout(() => {
              isRedirectingToLogin = false;
            }, 2000);
          }, 1500);
        }
        return false;
      }
    }

    return true; // Token未过期，允许继续
  } catch (e) {
    console.error('[API Token] 检查Token状态异常:', e);
    return true; // 异常时允许继续，避免阻塞请求
  }
}

// ===== 5. 数据脱敏工具函数 =====

/**
 * 对请求数据进行XSS防护（递归处理对象和数组）
 * @param {*} data - 待处理的数据
 * @returns {*} 处理后的安全数据
 */
function sanitizeData(data) {
  if (!data) return data;

  if (typeof data === 'string') {
    return escapeHtml(data);
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item));
  }

  if (typeof data === 'object') {
    const sanitized = {};
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        sanitized[key] = sanitizeData(data[key]);
      }
    }
    return sanitized;
  }

  return data;
}

// ===== 6. 底层请求函数（核心）=====

/**
 * 生成CSRF令牌
 */
function generateCsrfToken() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * 获取CSRF令牌
 */
function getCsrfToken() {
  try {
    let token = wx.getStorageSync('csrfToken');
    if (!token) {
      token = generateCsrfToken();
      wx.setStorageSync('csrfToken', token);
    }
    return token;
  } catch (e) {
    console.error('[API Security] 获取CSRF令牌失败:', e);
    return generateCsrfToken();
  }
}

/**
 * 加密敏感数据
 * @param {string} data - 敏感数据
 * @returns {string} 加密后的数据
 */
function encryptSensitiveData(data) {
  if (!data || typeof data !== 'string') return data;
  
  // 简单的加密算法，实际生产环境应使用更安全的加密方式
  let result = '';
  for (let i = 0; i < data.length; i++) {
    result += String.fromCharCode(data.charCodeAt(i) + 1);
  }
  return btoa(result);
}

/**
 * 解密敏感数据
 * @param {string} encryptedData - 加密后的数据
 * @returns {string} 解密后的数据
 */
function decryptSensitiveData(encryptedData) {
  if (!encryptedData || typeof encryptedData !== 'string') return encryptedData;
  
  try {
    const decoded = atob(encryptedData);
    let result = '';
    for (let i = 0; i < decoded.length; i++) {
      result += String.fromCharCode(decoded.charCodeAt(i) - 1);
    }
    return result;
  } catch (e) {
    console.error('[API Security] 解密敏感数据失败:', e);
    return encryptedData;
  }
}

/**
 * 输入验证
 * @param {*} value - 输入值
 * @param {Object} rules - 验证规则
 * @returns {boolean} 是否验证通过
 */
function validateInput(value, rules) {
  if (rules.required && !value) {
    return false;
  }
  
  if (rules.minLength && value.length < rules.minLength) {
    return false;
  }
  
  if (rules.maxLength && value.length > rules.maxLength) {
    return false;
  }
  
  if (rules.pattern && !rules.pattern.test(value)) {
    return false;
  }
  
  return true;
}

/**
 * 底层原始请求函数
 * 不包含缓存逻辑，仅负责发送HTTP请求和基础错误处理
 *
 * 功能特性:
 * 1. 自动添加Authorization头
 * 2. Token过期自动刷新
 * 3. 统一错误分类处理
 * 4. Loading状态管理
 * 5. 数据XSS防护
 * 6. CSRF防护
 * 7. 敏感数据加密
 *
 * @param {Object} options - 请求选项
 * @param {string} options.url - 请求路径（不含BASE_URL）
 * @param {string} [options.method='GET'] - HTTP方法
 * @param {Object} [options.data={}] - 请求数据
 * @param {Object} [options.header={}] - 自定义请求头
 * @param {boolean} [options.showLoading=true] - 是否显示加载提示
 * @param {string} [options.loadingText='加载中...'] - 加载提示文本
 * @param {boolean} [options.encryptSensitive=false] - 是否加密敏感数据
 * @returns {Promise<Object>} 标准化的响应数据 { code, data, message }
 */
async function rawRequest(options) {
  const {
    url,
    method = 'GET',
    data = {},
    header = {},
    showLoading = true,
    loadingText = '加载中...',
    encryptSensitive = false
  } = options;

  // 1. Token自动刷新检查（仅在需要认证的请求时执行）
  const isAuthRequired = !url.includes('/send-code') &&
                         !url.includes('/phone-login') &&
                         !url.includes('/wechat-login') &&
                         !url.includes('/invite-verify'); // 邀请验证无需认证

  if (isAuthRequired) {
    const canContinue = await checkAndRefreshToken();
    if (!canContinue) {
      throw new Error('Token无效或已过期');
    }
  }

  // 2. 构建请求头
  const token = getToken();
  const csrfToken = getCsrfToken();
  
  // 3. 处理数据
  let processedData = sanitizeData(data);
  
  // 4. 加密敏感数据
  if (encryptSensitive) {
    processedData = Object.keys(processedData).reduce((acc, key) => {
      if (['password', 'idcard', 'phone', 'bankCard'].includes(key)) {
        acc[key] = encryptSensitiveData(processedData[key]);
      } else {
        acc[key] = processedData[key];
      }
      return acc;
    }, {});
  }

  const requestHeader = {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken,
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...header
  };

  // 5. 显示Loading
  if (showLoading) {
    wx.showLoading({ title: loadingText, mask: true });
  }

  // 6. 发起请求
  return new Promise((resolve, reject) => {
    wx.request({
      url: BASE_URL + url,
      data: processedData,
      method: method.toUpperCase(),
      header: requestHeader,

      success: (res) => {
        // 隐藏Loading
        if (showLoading) {
          wx.hideLoading();
        }

        // 成功响应（HTTP 2xx）
        if (res.statusCode >= 200 && res.statusCode < 300) {
          // 检查业务状态码
          if (res.data && (res.data.code === 200 || res.data.code === 201)) {
            resolve(res.data); // 业务成功
          } else {
            // 业务逻辑错误（如code !== 200）
            const error = classifyAndHandleError(res);
            reject(error);
          }
        } else {
          // HTTP错误（4xx/5xx）
          const error = classifyAndHandleError(res);
          reject(error);
        }
      },

      fail: (err) => {
        // 网络层错误（无法连接服务器等）
        if (showLoading) {
          wx.hideLoading();
        }

        const error = classifyAndHandleError(err);
        reject(error);
      }
    });
  });
}

// ===== 7. 公开请求函数（带缓存支持）=====

/**
 * 公开的请求封装函数
 * 对GET请求提供5分钟缓存支持
 * POST/PUT/DELETE等写操作直接发送，不使用缓存
 *
 * @param {Object} options - 同 rawRequest 参数
 * @param {string[]} dependencies - 缓存依赖的资源键
 * @returns {Promise<Object>} 响应数据
 */
async function request(options, dependencies = []) {
  const method = (options.method || 'GET').toUpperCase();
  const isGetRequest = method === 'GET';

  // GET请求走缓存逻辑
  if (isGetRequest) {
    const cacheKey = getCacheKey(method, options.url, options.data);

    // 尝试从缓存获取
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return Promise.resolve(cachedData); // 返回缓存数据
    }

    // 缓存未命中，发起实际请求
    try {
      const result = await rawRequest(options);

      // 仅对成功的响应进行缓存
      if (result && result.code === 200) {
        setCachedData(cacheKey, result, dependencies);
      }

      return result;
    } catch (error) {
      throw error; // 错误不缓存，直接抛出
    }
  } else {
    // 非GET请求，执行后清除相关缓存
    try {
      const result = await rawRequest(options);
      
      // 清除相关缓存
      if (result && (result.code === 200 || result.code === 201)) {
        // 根据URL路径推断需要清除的缓存
        const url = options.url;
        if (url.includes('/contracts')) {
          if (url.includes('/contracts/') && url.split('/').length > 3) {
            const contractId = url.split('/')[3];
            if (!isNaN(contractId)) {
              invalidateResourceCache('contract', contractId);
            }
          }
          clearCache('/contracts');
        } else if (url.includes('/users')) {
          clearCache('/users');
        }
      }
      
      return result;
    } catch (error) {
      throw error;
    }
  }
}

// ===== 8. 上传文件函数 =====

/**
 * 压缩图片
 * @param {string} filePath - 图片路径
 * @param {number} quality - 压缩质量 (0-1)
 * @param {number} maxWidth - 最大宽度
 * @returns {Promise<string>} 压缩后的图片路径
 */
function compressImage(filePath, quality = 0.8, maxWidth = 1280) {
  return new Promise((resolve, reject) => {
    wx.getImageInfo({
      src: filePath,
      success: (info) => {
        const { width, height } = info;
        let newWidth = width;
        let newHeight = height;
        
        // 计算压缩后的尺寸
        if (width > maxWidth) {
          newWidth = maxWidth;
          newHeight = (height * maxWidth) / width;
        }
        
        wx.compressImage({
          src: filePath,
          quality: quality * 100, // 0-100
          success: (res) => {
            console.log(`[API Image] 图片压缩成功，原始大小: ${width}x${height}，压缩后: ${newWidth}x${newHeight}`);
            resolve(res.tempFilePath);
          },
          fail: (err) => {
            console.error('[API Image] 图片压缩失败:', err);
            // 压缩失败时使用原始图片
            resolve(filePath);
          }
        });
      },
      fail: (err) => {
        console.error('[API Image] 获取图片信息失败:', err);
        // 获取信息失败时使用原始图片
        resolve(filePath);
      }
    });
  });
}

/**
 * 上传文件封装
 * @param {string} url - 上传路径
 * @param {string} filePath - 本地文件路径
 * @param {string} [fileName='file'] - 文件字段名
 * @param {boolean} [compress=true] - 是否压缩图片
 * @param {number} [quality=0.8] - 压缩质量 (0-1)
 * @returns {Promise<Object>} 上传结果
 */
async function uploadFile(url, filePath, fileName = 'file', compress = true, quality = 0.8) {
  return new Promise(async (resolve, reject) => {
    try {
      const token = getToken();

      // 压缩图片
      let uploadPath = filePath;
      if (compress && filePath.includes('.jpg') || filePath.includes('.jpeg') || filePath.includes('.png') || filePath.includes('.webp')) {
        uploadPath = await compressImage(filePath, quality);
      }

      wx.showLoading({ title: '上传中...', mask: true });

      wx.uploadFile({
        url: BASE_URL + url,
        filePath: uploadPath,
        name: fileName,
        header: {
          'Authorization': token ? `Bearer ${token}` : ''
        },

        success: (res) => {
          wx.hideLoading();

          if (res.statusCode === 200) {
            try {
              const data = JSON.parse(res.data);
              if (data.code === 200) {
                resolve(data);
              } else {
                wx.showToast({
                  title: data.message || '上传失败',
                  icon: 'none'
                });
                reject(data);
              }
            } catch (parseError) {
              console.error('[API Upload] 解析响应失败:', parseError);
              wx.showToast({ title: '上传响应解析失败', icon: 'none' });
              reject(new Error('上传响应解析失败'));
            }
          } else {
            wx.showToast({ title: '上传失败', icon: 'none' });
            reject(new Error(`上传失败 (${res.statusCode})`));
          }
        },

        fail: (err) => {
          wx.hideLoading();
          wx.showToast({ title: '上传失败', icon: 'none' });
          reject(err);
        }
      });
    } catch (error) {
      wx.hideLoading();
      wx.showToast({ title: '上传失败', icon: 'none' });
      reject(error);
    }
  });
}

/**
 * 批量上传图片
 * @param {string} url - 上传路径
 * @param {string[]} filePaths - 图片路径数组
 * @param {string} [fileName='file'] - 文件字段名
 * @param {boolean} [compress=true] - 是否压缩图片
 * @param {number} [quality=0.8] - 压缩质量 (0-1)
 * @returns {Promise<Object[]>} 上传结果数组
 */
async function uploadImages(url, filePaths, fileName = 'file', compress = true, quality = 0.8) {
  const results = [];
  for (const filePath of filePaths) {
    try {
      const result = await uploadFile(url, filePath, fileName, compress, quality);
      results.push(result);
    } catch (error) {
      results.push({ error });
    }
  }
  return results;
}


// ==================== 用户模块 ====================

/**
 * 发送验证码
 * POST /api/users/send-code
 * @param {string} phone - 手机号
 */
function sendCode(phone) {
  return request({
    url: '/users/send-code',
    method: 'POST',
    data: { phone },
    showLoading: false
  });
}

/**
 * 手机号登录
 * POST /api/users/phone-login
 * @param {Object} data - { phone, code }
 */
function phoneLogin(data) {
  return request({
    url: '/users/phone-login',
    method: 'POST',
    data: data,
    showLoading: true,
    loadingText: '登录中...'
  });
}

/**
 * 微信登录
 * POST /api/users/wechat-login
 * @param {Object} data - { openid }
 */
function wechatLogin(data) {
  return request({
    url: '/users/wechat-login',
    method: 'POST',
    data: data,
    showLoading: true,
    loadingText: '登录中...'
  });
}

/**
 * 获取用户信息
 * GET /api/users/profile
 * @returns {Promise<IUserInfo>}
 */
function getProfile() {
  return request({
    url: '/users/profile'
  });
}

/**
 * 更新用户信息
 * PUT /api/users/profile
 * @param {Object} data - { name?, avatar?, phone? }
 */
function updateProfile(data) {
  return request({
    url: '/users/profile',
    method: 'PUT',
    data: data
  });
}

/**
 * 实名认证
 * POST /api/users/real-name/verify
 * @param {Object} data - { name, idcard, idcard_front?, idcard_back? }
 */
function realNameVerify(data) {
  return request({
    url: '/users/real-name/verify',
    method: 'POST',
    data: data,
    loadingText: '认证中...'
  });
}


// ==================== 合同模块 ====================

/**
 * 获取甲方合同列表
 * GET /api/contracts/landlord
 * @param {Object} params - { status?, keyword?, page?, page_size? }
 * @returns {Promise<{ list: IContract[], total: number, page: number, page_size: number }>}
 */
function getLandlordContracts(params = {}) {
  return request({
    url: '/contracts/landlord',
    data: params
  });
}

/**
 * 获取乙方合同列表
 * GET /api/contracts/tenant
 * @param {Object} params - { status?, keyword?, page?, page_size? }
 * @returns {Promise<{ list: IContract[], total: number, page: number, page_size: number }>}
 */
function getTenantContracts(params = {}) {
  return request({
    url: '/contracts/tenant',
    data: params
  });
}

/**
 * 获取合同详情 ⭐ v2关键变更
 * GET /api/contracts/:id
 *
 * v2返回值必须包含:
 * - contract: IContract对象（完整合同数据，含v2日期字段）
 * - signatures: ISignature[] （关联的签名记录数组）⭐新增
 * - invitations: IInvitation[] （关联的邀请记录数组）⭐新增
 *
 * @param {number} id - 合同ID
 * @returns {Promise<{
 *   contract: IContract,
 *   signatures: ISignature[],
 *   invitations: IInvitation[]
 * }>}
 */
function getContractDetail(id) {
  return request({
    url: `/contracts/${id}`
  });
}

/**
 * 创建合同 ⭐⭐⭐ 最重要变更 - 使用v2格式
 * POST /api/contracts
 *
 * v2请求体格式要求:
 * - 日期字段拆分为 year/month/day 三个独立整数字段
 * - fee_items 使用 JSON 数组格式（而非7个独立布尔字段）
 * - inventory_items 使用 JSON 数组格式（而非24个独立数量字段）
 *
 * 内部会自动调用 serializeFeeItems() 和 serializeInventoryItems() 进行序列化
 *
 * @param {Object} formData - 表单数据（v2格式）
 * @param {string} formData.title - 合同标题
 * @param {number} formData.lessor_user_id - 甲方用户ID
 * @param {number|null} formData.lessee_user_id - 乙方用户ID（可为空）
 * @param {string} formData.partyA_company - 甲方公司名称或姓名
 * @param {string} formData.partyA_phone - 甲方电话
 * @param {string} formData.partyB_name - 乙方姓名
 * @param {string} formData.partyB_phone - 乙方电话
 * @param {string} formData.house_address - 房屋地址
 * @param {number|null} formData.house_area - 房屋面积
 * @param {number|null} formData.lease_start_year - 租赁开始年份（如2026）
 * @param {number|null} formData.lease_start_month - 租赁开始月份（1-12）
 * @param {number|null} formData.lease_start_day - 租赁开始日期（1-31）
 * @param {number|null} formData.lease_end_year - 租赁结束年份
 * @param {number|null} formData.lease_end_month - 租赁结束月份
 * @param {number|null} formData.lease_end_day - 租赁结束日期
 * @param {number|null} formData.lease_months - 租赁总月数
 * @param {number} formData.monthly_rent - 月租金
 * @param {number} formData.payment_method - 支付方式（1-4）
 * @param {number} formData.payment_count - 支付次数
 * @param {number} formData.deposit - 押金金额
 * @param {Array<Object>} formData.fee_items - 费用项数组 [{name, checked}]
 * @param {Array<Object>} formData.inventory_items - 物品清单数组 [{name, quantity}]
 * @param {...*} formData.otherFields - 其他可选字段
 * @returns {Promise}
 */
function createContract(formData) {
  // 序列化费用项（将数组转为JSON字符串）
  const serializedData = {
    ...formData,
    fee_items: serializeFeeItems(formData.fee_items),
    inventory_items: serializeInventoryItems(formData.inventory_items)
  };

  // 注意：日期字段已经是从表单获取的 year/month/day 数字值
  // 无需额外转换，直接传递即可

  return request({
    url: '/contracts',
    method: 'POST',
    data: serializedData,
    loadingText: '创建中...'
  });
}

/**
 * 更新合同
 * PUT /api/contracts/:id
 * @param {number} id - 合同ID
 * @param {Object} data - 更新的数据（v2格式）
 */
function updateContract(id, data) {
  // 更新时同样需要序列化JSON字段
  const serializedData = {
    ...data
  };

  if (data.fee_items) {
    serializedData.fee_items = serializeFeeItems(data.fee_items);
  }
  if (data.inventory_items) {
    serializedData.inventory_items = serializeInventoryItems(data.inventory_items);
  }

  return request({
    url: `/contracts/${id}`,
    method: 'PUT',
    data: serializedData,
    loadingText: '更新中...'
  });
}

/**
 * 删除合同
 * DELETE /api/contracts/:id
 * @param {number} id - 合同ID
 */
function deleteContract(id) {
  return request({
    url: `/contracts/${id}`,
    method: 'DELETE',
    loadingText: '删除中...'
  });
}


// ==================== 签署模块 ⭐ v2统一接口 ====================

/**
 * 统一签署合同接口 (v2) ⭐⭐⭐ 核心新方法
 *
 * 替代原来的 lessorSign() 和 tenantSign() 两个独立方法
 * 通过 sign_role 参数区分甲方/乙方签署
 *
 * 调用: POST /api/contracts/:id/sign
 * 请求体: { sign_role: string, signature_data: string }
 *
 * @param {number} contractId - 合同ID
 * @param {string} signRole - 签署角色: 'LESSOR' (甲方) | 'LESSEE' (乙方)
 * @param {string} signatureData - Base64编码的签名图片数据
 * @returns {Promise}
 *
 * @example
 * // 甲方签署
 * api.signContract(123, 'LESSOR', base64SignatureData)
 *
 * @example
 * // 乙方签署
 * api.signContract(123, 'LESSEE', base64SignatureData)
 */
function signContract(contractId, signRole, signatureData) {
  // 验证signRole参数有效性
  if (![SignRole.LESSOR, SignRole.LESSEE].includes(signRole)) {
    console.error('[API Sign] 无效的签署角色:', signRole);
    return Promise.reject(new Error('无效的签署角色，必须是 LESSOR 或 LESSEE'));
  }

  return request({
    url: `/contracts/${contractId}/sign`,
    method: 'POST',
    data: {
      sign_role: signRole,           // 'LESSOR' 或 'LESSEE'
      signature_data: signatureData   // Base64 PNG签名图片
    },
    loadingText: '签署中...'
  });
}

/**
 * 拒绝签署
 * POST /api/contracts/:id/reject
 * @param {number} id - 合同ID
 * @param {string} reason - 拒绝原因
 */
function rejectContract(id, reason) {
  return request({
    url: `/contracts/${id}/reject`,
    method: 'POST',
    data: { reason },
    loadingText: '提交中...'
  });
}

/**
 * 取消合同
 * POST /api/contracts/:id/cancel
 * @param {number} id - 合同ID
 */
function cancelContract(id) {
  return request({
    url: `/contracts/${id}/cancel`,
    method: 'POST',
    loadingText: '取消中...'
  });
}

/**
 * 生成分享链接
 * POST /api/contracts/:id/share
 * @param {number} id - 合同ID
 */
function shareContract(id) {
  return request({
    url: `/contracts/${id}/share`,
    method: 'POST',
    loadingText: '生成中...'
  });
}


// ==================== 邀请模块 ⭐ v2参数更新 ====================

/**
 * 验证邀请码（无需认证）
 * GET /api/contracts/invite-verify/:code
 * @param {string} code - 邀请码
 */
function verifyInviteCode(code) {
  return request({
    url: `/contracts/invite-verify/${code}`,
    showLoading: false
  });
}

/**
 * 验证合同真伪
 * GET /api/contracts/verify/:code
 * @param {string} code - 合同编号
 */
function verifyContract(code) {
  return request({
    url: `/contracts/verify/${code}`,
    showLoading: false
  });
}

/**
 * 接受签署邀请（乙方）⭐ v2参数名变更
 * POST /api/invitations/:code/accept
 *
 * v2正确参数名: invitee_phone（替代旧版 receiver_phone）
 *
 * @param {string} code - 邀请码
 * @param {string} phone - 被邀请人手机号
 * @returns {Promise}
 */
function acceptInvitation(code, phone) {
  return request({
    url: `/invitations/${code}/accept`,
    method: 'POST',
    data: {
      invitee_phone: phone  // ⭐ v2字段名（不是receiver_phone）
    },
    loadingText: '接受中...'
  });
}

/**
 * 拒绝签署邀请（乙方）⭐ v2参数名变更
 * POST /api/invitations/:code/reject
 *
 * v2正确参数名: invitee_phone（替代旧版 receiver_phone）
 *
 * @param {string} code - 邀请码
 * @param {string} phone - 被邀请人手机号
 * @param {string} reason - 拒绝原因
 * @returns {Promise}
 */
function rejectInvitation(code, phone, reason) {
  return request({
    url: `/invitations/${code}/reject`,
    method: 'POST',
    data: {
      invitee_phone: phone,   // ⭐ v2字段名（不是receiver_phone）
      refused_reason: reason  // ⭐ v2字段名（不是reason）
    },
    loadingText: '提交中...'
  });
}

/**
 * 获取收到的签署邀请列表
 * GET /api/invitations
 */
function getInvitations() {
  return request({
    url: '/invitations'
  });
}

/**
 * 通过邀请码获取合同信息（乙方）
 * GET /api/invitations/:code
 * @param {string} code - 邀请码
 */
function getContractByInviteCode(code) {
  return request({
    url: `/invitations/${code}`,
    showLoading: false
  });
}


// ==================== PDF模块 ====================

/**
 * 生成合同PDF
 * GET /api/contracts/:id/pdf
 * @param {number} id - 合同ID
 */
function generateContractPdf(id) {
  return request({
    url: `/contracts/${id}/pdf`
  });
}

/**
 * 下载合同PDF到本地
 * @param {number} id - 合同ID
 * @returns {Promise<string>} 返回本地文件路径
 */
function downloadContractPdf(id) {
  return new Promise((resolve, reject) => {
    const token = getToken();
    const staticBase = BASE_URL;

    request({
      url: `/contracts/${id}/pdf`
    }).then((res) => {
      if (res.data && res.data.url) {
        const pdfUrl = `${staticBase}${res.data.url}`;

        wx.downloadFile({
          url: pdfUrl,
          header: {
            'Authorization': `Bearer ${token}`
          },
          success: (downloadRes) => {
            if (downloadRes.statusCode === 200 && downloadRes.tempFilePath) {
              resolve(downloadRes.tempFilePath);
            } else {
              reject(new Error(`下载失败, statusCode: ${downloadRes.statusCode}`));
            }
          },
          fail: reject
        });
      } else {
        reject(new Error('获取PDF失败'));
      }
    }).catch(reject);
  });
}


// ==================== 文件上传模块 ====================

/**
 * 上传图片
 * POST /api/upload/image
 * @param {string} filePath - 图片路径
 */
function uploadImage(filePath) {
  return uploadFile('/upload/image', filePath, 'file');
}


// ==================== 签名记录模块 ====================

/**
 * 获取合同签名记录
 * GET /api/signatures/:contract_id
 * @param {number} contractId - 合同ID
 * @returns {Promise<ISignature[]>}
 */
function getSignatures(contractId) {
  return request({
    url: `/signatures/${contractId}`
  });
}

/**
 * 创建签名记录（保留但标记为@deprecated）
 * @deprecated 建议使用 signContract(contractId, signRole, signatureData)
 * @param {Object} data - 签名数据
 */
function createSignature(data) {
  console.warn('[API Deprecated] createSignature 已废弃，请使用 signContract 方法');
  return request({
    url: '/signatures',
    method: 'POST',
    data: data
  });
}

/**
 * 获取签名详情（保留但标记为@deprecated）
 * @deprecated 此方法可能不再被使用
 * @param {number} id - 签名ID
 */
function getSignatureDetail(id) {
  console.warn('[API Deprecated] getSignatureDetail 可能已被废弃');
  return request({
    url: `/signatures/detail/${id}`
  });
}


// ==================== 模板模块 ====================

/**
 * 获取模板列表
 * GET /api/templates
 */
function getTemplates() {
  return request({
    url: '/templates'
  });
}

/**
 * 获取模板详情
 * GET /api/templates/:id
 * @param {number} id - 模板ID
 */
function getTemplateDetail(id) {
  return request({
    url: `/templates/${id}`
  });
}


// ==================== 测试数据模块 ====================

/**
 * 获取测试用户列表
 * GET /api/test-data/users
 */
function getTestUsers() {
  return request({
    url: '/test-data/users',
    showLoading: false
  });
}

/**
 * 获取测试合同列表
 * GET /api/test-data/contracts
 */
function getTestContracts() {
  return request({
    url: '/test-data/contracts',
    showLoading: false
  });
}

/**
 * 获取测试合同详情
 * GET /api/test-data/contracts/:id
 * @param {number} id - 合同ID
 */
function getTestContractById(id) {
  return request({
    url: `/test-data/contracts/${id}`,
    showLogging: false
  });
}

/**
 * 重置测试数据
 * GET /api/test-data/reset
 */
function resetTestData() {
  return request({
    url: '/test-data/reset',
    showLoading: true,
    loadingText: '重置测试数据...'
  });
}


// ==================== 导出 ====================

module.exports = {
  // ===== 核心请求函数 =====
  request,                    // 公开请求函数（带GET缓存）
  uploadFile,                 // 文件上传函数
  uploadImage,                // 图片上传快捷方法
  uploadImages,               // 批量上传图片
  compressImage,              // 图片压缩

  // ===== 缓存管理工具（暴露给外部用于下拉刷新等场景）=====
  clearCache,                 // 清除缓存（支持模式匹配）
  invalidateResourceCache,     // 使资源缓存失效

  // ===== 安全工具 =====
  getCsrfToken,               // 获取CSRF令牌
  encryptSensitiveData,       // 加密敏感数据
  decryptSensitiveData,       // 解密敏感数据
  validateInput,              // 输入验证

  // ===== 用户模块 =====
  sendCode,
  phoneLogin,
  wechatLogin,
  getProfile,
  updateProfile,
  realNameVerify,

  // ===== 合同模块 =====
  getLandlordContracts,
  getTenantContracts,
  getContractDetail,
  createContract,             // ⭐ v2格式（year/month/day + JSON序列化）
  updateContract,
  deleteContract,

  // ===== 签署模块 ⭐ v2统一接口 =====
  signContract,               // ⭐⭐⭐ 新增（替代lessorSign/tenantSign）
  // 注意: 以下两个旧方法已移除，请使用 signContract
  // - lessorSign (已删除)
  // - tenantSign (已删除)
  rejectContract,
  cancelContract,
  shareContract,

  // ===== 邀请模块 ⭐ v2参数更新 =====
  verifyInviteCode,
  verifyContract,
  acceptInvitation,           // ⭐ 使用 invitee_phone 参数
  rejectInvitation,           // ⭐ 使用 invitee_phone + refused_reason 参数
  getInvitations,
  getContractByInviteCode,

  // ===== PDF模块 =====
  generateContractPdf,
  downloadContractPdf,

  // ===== 签名记录模块 =====
  getSignatures,
  createSignature,             // @deprecated 建议用signContract
  getSignatureDetail,          // @deprecated 可能已废弃

  // ===== 模板模块 =====
  getTemplates,
  getTemplateDetail,

  // ===== 测试数据模块 =====
  getTestUsers,
  getTestContracts,
  getTestContractById,
  resetTestData,

  // ===== 配置导出 =====
  BASE_URL                    // API基础地址（供外部使用）
};
