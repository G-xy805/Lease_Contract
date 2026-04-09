// pages/contracts/index.js - 合同列表页（v2重构版）
const app = getApp()
const api = require('../../services/api')
const { CONTRACT_STATUS, CONTRACT_STATUS_TEXT } = require('../../utils/constants')
const navigation = require('../../utils/navigation')

// 筛选Tab配置
const FILTER_TABS = [
  { title: '全部', status: null },
  { title: '待签署', status: '1,2' },
  { title: '已签署', status: '3' },
  { title: '已拒绝', status: '4' },
  { title: '已取消', status: '5' }
]

Page({
  data: {
    // 搜索关键词
    keyword: '',
    // 筛选状态
    activeTab: 0,
    tabs: FILTER_TABS,
    // 合同列表数据
    contracts: [],
    // 加载状态
    loading: false,
    refreshing: false,
    loadingMore: false,
    // 分页参数
    page: 1,
    pageSize: 10,
    hasMore: true
  },

  onLoad(options) {
    const token = wx.getStorageSync('token')
    if (!token) {
      navigation.navigateTo('/pages/login/index', { delay: 1500, showToast: '请先登录' })
      return
    }
    this.loadContracts(true)
  },

  onShow() {
    // 检查是否有合同被签署/更新（从其他页面返回时）
    const updatedContract = wx.getStorageSync('contract_updated')
    if (updatedContract && this.data.contracts.length > 0) {
      wx.removeStorageSync('contract_updated')
      const index = this.data.contracts.findIndex(c => c.id === updatedContract.id)
      if (index !== -1) {
        const contracts = [...this.data.contracts]
        contracts[index] = { ...contracts[index], ...updatedContract }
        this.setData({ contracts })
      }
    }
  },

  onPullDownRefresh() {
    this.loadContracts(true)
  },

  onReachBottom() {
    if (!this.data.loadingMore && this.data.hasMore) {
      this.loadContracts(false, true)
    }
  },

  /**
   * 加载合同列表
   * @param {boolean} isRefresh - 是否刷新（清除已有数据）
   * @param {boolean} isLoadMore - 是否加载更多（追加数据）
   */
  async loadContracts(isRefresh = false, isLoadMore = false) {
    const { page, pageSize, activeTab, tabs, keyword } = this.data

    // 设置加载状态
    if (isRefresh) {
      this.setData({ refreshing: true, page: 1, hasMore: true })
    } else if (isLoadMore) {
      this.setData({ loadingMore: true })
    } else {
      this.setData({ loading: true })
    }

    try {
      const currentTab = tabs[activeTab]
      const params = {
        page: isRefresh ? 1 : page,
        page_size: pageSize
      }

      // 添加筛选条件
      if (currentTab.status !== null) {
        params.status = currentTab.status
      }

      // 添加搜索关键词
      if (keyword.trim()) {
        params.keyword = keyword.trim()
      }

      // 根据用户角色调用不同API
      const res = await api.getLandlordContracts(params)

      if (res.code === 200) {
        const list = res.data?.list || []

        // 转换合同数据格式
        const transformedList = list.map(item => ({
          id: item.id,
          title: item.title || '房屋租赁合同',
          status: item.status,
          statusText: CONTRACT_STATUS_TEXT[item.status] || '未知状态',
          contract_no: item.contract_no,
          houseAddress: item.house_address || '',
          house_address: item.house_address || '',
          leaseStart: item.lease_start || '',
          lease_start: item.lease_start || '',
          leaseEnd: item.lease_end || '',
          lease_end: item.lease_end || '',
          monthlyRent: item.monthly_rent || 0,
          monthly_rent: item.monthly_rent || 0,
          deposit: item.deposit || 0,
          leaseMonths: item.lease_months || 0,
          lease_months: item.lease_months || 0,
          partyA_company: item.partyA_company || '',
          partyA_name: item.partyA_name || item.partyA_company || '',
          partyB_name: item.partyB_name || '',
          partyA_phone: item.partyA_phone || '',
          partyB_phone: item.partyB_phone || '',
          created_at: item.created_at || '',
          updated_at: item.updated_at || '',
          updateTime: item.updated_at || item.created_at || '',
          lessor_sign_status: item.lessor_sign_status || 0,
          lessee_sign_status: item.lessee_sign_status || 0,
          partyA_sign_status: item.partyA_sign_status || 0,
          partyB_sign_status: item.partyB_sign_status || 0
        }))

        // 更新列表数据
        let newContracts
        if (isRefresh) {
          newContracts = transformedList
        } else if (isLoadMore) {
          newContracts = [...this.data.contracts, ...transformedList]
        } else {
          newContracts = [...this.data.contracts, ...transformedList]
        }

        this.setData({
          contracts: newContracts,
          hasMore: list.length >= pageSize,
          page: isRefresh ? 2 : page + 1
        })
      } else {
        wx.showToast({
          title: res.message || '获取合同列表失败',
          icon: 'none'
        })
      }
    } catch (err) {
      console.error('获取合同列表失败', err)
      wx.showToast({
        title: '网络错误，请稍后重试',
        icon: 'none'
      })

      // 错误时恢复分页状态
      if (isRefresh) {
        this.setData({ hasMore: false })
      } else if (isLoadMore) {
        this.setData({ page: this.data.page - 1 })
      } else {
        this.setData({
          contracts: [],
          hasMore: false
        })
      }
    } finally {
      this.setData({
        loading: false,
        refreshing: false,
        loadingMore: false
      })
      wx.stopPullDownRefresh()
    }
  },

  /**
   * 切换筛选Tab
   */
  onTabChange(e) {
    const index = e.detail.index !== undefined ? e.detail.index : e.currentTarget.dataset.index

    this.setData({
      activeTab: index,
      contracts: [],
      page: 1,
      hasMore: true
    })

    this.loadContracts(true)
  },

  /**
   * 搜索输入事件
   */
  onSearchInput(e) {
    this.setData({ keyword: e.detail })
  },

  /**
   * 执行搜索（防抖处理）
   */
  onSearch() {
    // 防抖：清除之前的定时器
    if (this.searchTimer) {
      clearTimeout(this.searchTimer)
    }

    this.searchTimer = setTimeout(() => {
      this.setData({
        contracts: [],
        page: 1,
        hasMore: true
      })
      this.loadContracts(true)
    }, 300)
  },

  /**
   * 清除搜索
   */
  onClearSearch() {
    this.setData({
      keyword: '',
      contracts: [],
      page: 1,
      hasMore: true
    })
    this.loadContracts(true)
  },

  /**
   * 跳转到合同详情页
   */
  goToContractDetail(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/contract-detail/index?id=${id}`
    })
  },

  /**
   * 跳转到创建合同页
   */
  goToCreateContract() {
    wx.navigateTo({
      url: '/pages/create-contract/index'
    })
  }
})
