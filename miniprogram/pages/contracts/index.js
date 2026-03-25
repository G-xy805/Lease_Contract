// pages/contracts/index.js
const app = getApp()
const { CONTRACT_STATUS, CONTRACT_STATUS_TEXT, CONTRACT_STATUS_COLOR } = require('../../utils/constants')

Page({
  data: {
    contracts: [],
    loading: false,
    refreshing: false,
    loadingMore: false,
    page: 1,
    pageSize: 10,
    hasMore: true,
    searchValue: '',
    activeTab: 0,
    tabs: [
      { title: '全部', statuses: null },
      { title: '待签署', statuses: [CONTRACT_STATUS.PENDING_LESSOR_SIGN, CONTRACT_STATUS.PENDING_LESSEE_SIGN] },
      { title: '待甲方签署', statuses: CONTRACT_STATUS.PENDING_LESSOR_SIGN },
      { title: '待乙方签署', statuses: CONTRACT_STATUS.PENDING_LESSEE_SIGN },
      { title: '已签署', statuses: CONTRACT_STATUS.SIGNED },
      { title: '已过期', statuses: [CONTRACT_STATUS.REJECTED, CONTRACT_STATUS.CANCELLED, CONTRACT_STATUS.EXPIRED] }
    ]
  },

  onLoad(options) {
    if (options.status) {
      const statusIndex = this.data.tabs.findIndex(tab => tab.statuses === parseInt(options.status))
      if (statusIndex !== -1) {
        this.setData({ activeTab: statusIndex })
      }
    }
    this.loadContracts(true)
  },

  onShow() {
    if (this.data.contracts.length > 0) {
      this.loadContracts(true)
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
    const { page, pageSize, searchValue, activeTab, tabs } = this.data

    if (isRefresh) {
      this.setData({ refreshing: true, page: 1, hasMore: true })
    } else if (isLoadMore) {
      this.setData({ loadingMore: true })
    } else {
      this.setData({ loading: true })
    }

    const params = {
      page: isRefresh || isLoadMore ? 1 : page,
      pageSize: pageSize
    }

    const currentTab = tabs[activeTab]
    if (currentTab && currentTab.statuses !== null) {
      if (Array.isArray(currentTab.statuses)) {
        params.status = currentTab.statuses.join(',')
      } else {
        params.status = currentTab.statuses
      }
    }

    if (searchValue) {
      params.keyword = searchValue
    }

    wx.request({
      url: `${app.globalData.baseUrl}/api/contracts/landlord`,
      method: 'GET',
      data: params,
      header: {
        'Authorization': `Bearer ${app.globalData.token || wx.getStorageSync('token')}`,
        'Content-Type': 'application/json'
      },
      success: (res) => {
        if (res.data.code === 200) {
          const result = res.data.data?.list || []
          const total = res.data.data?.total || 0

          this.setData({
            contracts: isRefresh || isLoadMore ? result : [...this.data.contracts, ...result],
            hasMore: result.length >= pageSize && this.data.contracts.length < total,
            page: isRefresh || isLoadMore ? 2 : this.data.page + 1
          })
        } else {
          wx.showToast({
            title: res.data.message || '获取合同列表失败',
            icon: 'none'
          })
        }
      },
      fail: (err) => {
        console.error('获取合同列表失败', err)
        wx.showToast({
          title: '网络错误，请稍后重试',
          icon: 'none'
        })
        this.setData({
          contracts: [],
          hasMore: false
        })
      },
      complete: () => {
        this.setData({
          loading: false,
          refreshing: false,
          loadingMore: false
        })
        wx.stopPullDownRefresh()
      }
    })
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

  onSearchChange(e) {
    this.setData({ searchValue: e.detail })
  },

  onSearch(e) {
    const { value } = e.detail
    this.setData({
      searchValue: value,
      contracts: [],
      page: 1,
      hasMore: true
    })
    this.loadContracts(true)
  },

  onSearchClear() {
    this.setData({
      searchValue: '',
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

  onSignContract(e) {
    const { id } = e.currentTarget.dataset
    wx.showModal({
      title: '确认签署',
      content: '确定要签署此合同吗？签署后乙方将收到签署通知。',
      success: (res) => {
        if (res.confirm) {
          wx.navigateTo({
            url: `/pages/sign-contract/index?contractId=${id}&isPartyA=true`
          })
        }
      }
    })
  },

  onDeleteContract(e) {
    const { id } = e.currentTarget.dataset
    wx.showModal({
      title: '提示',
      content: '确定删除该合同吗？删除后不可恢复',
      success: (res) => {
        if (res.confirm) {
          wx.request({
            url: `${app.globalData.baseUrl}/api/contracts/${id}`,
            method: 'DELETE',
            header: {
              'Authorization': `Bearer ${app.globalData.token || wx.getStorageSync('token')}`,
              'Content-Type': 'application/json'
            },
            success: (res) => {
              if (res.data.code === 200) {
                wx.showToast({
                  title: '删除成功',
                  icon: 'success'
                })
                this.loadContracts(true)
              } else {
                wx.showToast({
                  title: res.data.message || '删除失败',
                  icon: 'none'
                })
              }
            },
            fail: () => {
              wx.showToast({
                title: '网络错误',
                icon: 'none'
              })
            }
          })
        }
      }
    })
  },

  goToCreateContract() {
    wx.navigateTo({
      url: '/pages/create-contract/index'
    })
  },

  getStatusTagType(status) {
    return CONTRACT_STATUS_COLOR[status] || 'default'
  },

  getStatusText(status) {
    return CONTRACT_STATUS_TEXT[status] || '未知状态'
  }
})
