// pages/contracts/index.js
const app = getApp()
const api = require('../../services/api')
const { CONTRACT_STATUS, CONTRACT_STATUS_TEXT, CONTRACT_STATUS_COLOR } = require('../../utils/constants')

Page({
  data: {
    // 统计数据
    stats: {
      total: 0,
      pending: 0,
      signed: 0
    },
    // 合同列表
    contracts: [],
    loading: false,
    refreshing: false,
    loadingMore: false,
    page: 1,
    pageSize: 10,
    hasMore: true,
    // Tab状态
    activeTab: 0,
    tabs: [
      { title: '全部', status: null },
      { title: '待签署', status: '1,2' },
      { title: '已签署', status: '3' },
      { title: '已拒绝/已取消', status: '4,5' }
    ]
  },

  onLoad(options) {
    const token = wx.getStorageSync('token')
    if (!token) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      setTimeout(() => {
        wx.navigateTo({ url: '/pages/login/login' })
      }, 1500)
      return
    }
    this.loadContracts(true)
  },

  onShow() {
    // 检查是否有合同被签署/更新
    const updatedContract = wx.getStorageSync('contract_updated')
    if (updatedContract && this.data.contracts.length > 0) {
      wx.removeStorageSync('contract_updated')
      const index = this.data.contracts.findIndex(c => c.id === updatedContract.id)
      if (index !== -1) {
        const contracts = [...this.data.contracts]
        contracts[index] = { ...contracts[index], ...updatedContract }
        this.setData({ contracts })
        this.updateStats()
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

  loadContracts(isRefresh = false, isLoadMore = false) {
    const { page, pageSize, activeTab, tabs } = this.data

    if (isRefresh) {
      this.setData({ refreshing: true, page: 1, hasMore: true })
    } else if (isLoadMore) {
      this.setData({ loadingMore: true })
    } else {
      this.setData({ loading: true })
    }

    const currentTab = tabs[activeTab]
    const params = {
      page: isRefresh ? 1 : page,
      page_size: pageSize
    }

    if (currentTab.status !== null) {
      params.status = currentTab.status
    }

    api.getLandlordContracts(params).then(res => {
      if (res.code === 200) {
        const list = res.data?.list || []
        const total = res.data?.total || 0

        const transformContract = (item) => ({
          id: item.id,
          title: item.title || '房屋租赁合同',
          status: item.status,
          statusText: this.getStatusText(item.status),
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
          partyB_sign_status: item.partyB_sign_status || 0,
        })

        let newContracts
        if (isRefresh) {
          newContracts = list.map(transformContract)
        } else if (isLoadMore) {
          newContracts = [...this.data.contracts, ...list.map(transformContract)]
        } else {
          newContracts = [...this.data.contracts, ...list.map(transformContract)]
        }

        // 计算统计数据
        if (isRefresh) {
          this.calculateStats(list, total)
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
    }).catch(err => {
      console.error('获取合同列表失败', err)
      wx.showToast({
        title: '网络错误，请稍后重试',
        icon: 'none'
      })
      this.setData({
        contracts: [],
        hasMore: false
      })
    }).finally(() => {
      this.setData({
        loading: false,
        refreshing: false,
        loadingMore: false
      })
      wx.stopPullDownRefresh()
    })
  },

  // 计算统计数据
  calculateStats(list, total) {
    const stats = {
      total: total || list.length,
      pending: 0,
      signed: 0
    }

    list.forEach(item => {
      const status = item.status
      if (status === 1 || status === 2) {
        stats.pending++
      } else if (status === 3) {
        stats.signed++
      }
    })

    this.setData({ stats })
  },

  // 更新统计数据
  updateStats() {
    const stats = {
      total: this.data.contracts.length,
      pending: 0,
      signed: 0
    }

    this.data.contracts.forEach(item => {
      const status = item.status
      if (status === 1 || status === 2) {
        stats.pending++
      } else if (status === 3) {
        stats.signed++
      }
    })

    this.setData({ stats })
  },

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

  goToContractDetail(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/contract-detail/index?id=${id}`
    })
  },

  getStatusTagType(status) {
    return CONTRACT_STATUS_COLOR[status] || 'default'
  },

  getStatusText(status) {
    return CONTRACT_STATUS_TEXT[status] || '未知状态'
  },

  // 获取签署状态文字
  getSignStatusText(item) {
    const partyA = item.lessor_sign_status === 1 || item.partyA_sign_status === 1
    const partyB = item.lessee_sign_status === 1 || item.partyB_sign_status === 1

    if (partyA && partyB) {
      return '双方已签署'
    } else if (partyA) {
      return '待乙方签署'
    } else {
      return '待甲方签署'
    }
  }
})