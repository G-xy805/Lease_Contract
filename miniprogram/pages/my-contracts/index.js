// pages/my-contracts/index.js
const app = getApp()
const api = require('../../services/api')
const { USER_ROLE, CONTRACT_STATUS } = require('../../utils/constants')

const STATUS_MAP = {
  1: { text: '待甲方签署', color: 'warning' },
  2: { text: '待乙方签署', color: 'primary' },
  3: { text: '已签署', color: 'success' },
  4: { text: '已拒绝', color: 'danger' },
  5: { text: '已取消', color: 'default' },
  6: { text: '已到期', color: 'default' }
}

// 甲方 tabs
const LESSOR_TABS = [
  { name: '待签署', status: 1 },
  { name: '待乙方签署', status: 2 },
  { name: '已签署', status: 3 }
]

// 乙方 tabs
const LESSEE_TABS = [
  { name: '待签署', status: 2 },
  { name: '已签署', status: 3 }
]

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
    tabs: LESSOR_TABS,
    userRole: USER_ROLE.LESSOR,
    STATUS_MAP: STATUS_MAP,
    USER_ROLE: USER_ROLE
  },

  onLoad(options) {
    // 根据用户角色设置 tabs
    const userInfo = app.globalData?.userInfo || wx.getStorageSync('userInfo') || {}
    const userRole = userInfo.role || USER_ROLE.LESSOR
    this.setData({
      userRole,
      tabs: userRole === USER_ROLE.LESSEE ? LESSEE_TABS : LESSOR_TABS,
      activeTab: 0
    })

    if (options.status) {
      const statusIndex = this.data.tabs.findIndex(tab => tab.status === parseInt(options.status))
      if (statusIndex !== -1) {
        this.setData({ activeTab: statusIndex })
      }
    }
    this.loadContracts(true)
  },

  onShow() {},

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
    if (currentTab && currentTab.status) {
      params.status = currentTab.status
    }

    if (searchValue) {
      params.keyword = searchValue
    }

    // 根据用户角色动态选择 API
    const userInfo = app.globalData?.userInfo || {}
    const userRole = userInfo.role || wx.getStorageSync('userInfo')?.role || ''
    const apiMethod = userRole === USER_ROLE.LESSEE
      ? api.getTenantContracts
      : api.getLandlordContracts

    apiMethod(params).then(res => {
      if (res.code === 200) {
        let result = res.data?.list || []

        // 按创建时间排序（最新的在前）
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

        // 应用标签筛选
        if (currentTab && currentTab.status) {
          result = result.filter(c => c.status === currentTab.status)
        }

        // 应用搜索筛选（兼容新旧字段）
        if (searchValue) {
          const keyword = searchValue.toLowerCase()
          result = result.filter(c =>
            (c.title && c.title.toLowerCase().includes(keyword)) ||
            (c.contract_no && c.contract_no.toLowerCase().includes(keyword)) ||
            ((c.partyB_name || c.lessee_name) && (c.partyB_name || c.lessee_name).toLowerCase().includes(keyword)) ||
            (c.house_address && c.house_address.toLowerCase().includes(keyword))
          )
        }

        this.setData({
          contracts: result,
          hasMore: false,
          page: 2
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
    const isPartyA = this.data.userRole !== USER_ROLE.LESSEE ? true : false

    wx.showModal({
      title: '确认签署',
      content: '确定要签署此合同吗？签署后合同将正式生效。',
      success: (res) => {
        if (res.confirm) {
          wx.navigateTo({
            url: `/pages/sign-contract/index?contractId=${id}&isPartyA=${isPartyA}`
          })
        }
      }
    })
  },

  onRejectContract(e) {
    const { id } = e.currentTarget.dataset

    wx.showModal({
      title: '确认拒绝',
      content: '确定要拒绝签署此合同吗？',
      success: (res) => {
        if (res.confirm) {
          api.rejectContract(id, '乙方拒绝签署').then(res => {
            if (res.code === 200) {
              wx.showToast({
                title: '已拒绝签署',
                icon: 'success'
              })
              this.loadContracts(true)
            } else {
              wx.showToast({
                title: res.message || '操作失败',
                icon: 'none'
              })
            }
          }).catch(() => {
            wx.showToast({
              title: '网络错误',
              icon: 'none'
            })
          })
        }
      }
    })
  },

  async onDownloadPdf(e) {
    const contractId = e.currentTarget.dataset.id
    if (!contractId) {
      wx.showToast({ title: '合同ID不存在', icon: 'none' })
      return
    }

    wx.showLoading({ title: '正在生成PDF...' })

    try {
      const tempFilePath = await api.downloadContractPdf(contractId)
      wx.hideLoading()

      wx.openDocument({
        filePath: tempFilePath,
        fileType: 'pdf',
        success: () => {
          console.log('打开PDF成功')
        },
        fail: (err) => {
          console.error('打开PDF失败:', err)
          wx.showToast({ title: '打开失败，请重试', icon: 'none' })
        }
      })
    } catch (err) {
      wx.hideLoading()
      console.error('下载PDF失败:', err)
      wx.showToast({ title: err.message || '下载失败', icon: 'none' })
    }
  },

  getStatusTagType(status) {
    return STATUS_MAP[status]?.color || 'default'
  },

  getStatusText(status) {
    return STATUS_MAP[status]?.text || '未知'
  }
})