Page({
  data: {
    latitude: 23.099994,
    longitude: 113.324520,
    markers: [],
    locationInfo: {},
    userInfo: null // 全局获取用户基本信息
  },

  onLoad() {
    this.getLocation()
  },
  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    const app = getApp()
    // 增加调试日志
    console.log('[调试] 打卡tabBar-全局用户信息:', app.globalData.userInfo)
    console.log('[调试] 打卡tabBar-本地存储用户信息:', wx.getStorageSync('userInfo'))
    this.setData({
      userInfo: app.globalData.userInfo || wx.getStorageSync('userInfo')
    }, () => {
      console.log('[调试] 打卡tabBar-当前用户信息:', this.data.userInfo)
    })
  },
  // 获取实时定位
  getLocation() {
    const that = this
    wx.getLocation({
      type: 'gcj02',
      success(res) {
        that.setData({
          latitude: res.latitude,
          longitude: res.longitude,
          markers: [{
            id: 0,
            latitude: res.latitude,
            longitude: res.longitude,
            iconPath: '/images/Marker.png',
            width: 30,
            height: 30
          }]
        })
      }
    })
  },

  // 打卡处理
  handleCheckIn() {
    const that = this
    wx.getLocation({
      type: 'gcj02',
      success(res) {
        const date = new Date()
        const time = `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()} ` + 
                    `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`
        
        that.setData({
          locationInfo: {
            latitude: res.latitude,
            longitude: res.longitude,
            address: '正在解析地址...'
          }
        })

        // 显示打卡信息
        wx.showModal({
          title: `打卡成功 ${time}`,
          content: `定位坐标：\n经度：${res.longitude}\n纬度：${res.latitude}`,
          showCancel: false
        })
      }
    })
  }
})