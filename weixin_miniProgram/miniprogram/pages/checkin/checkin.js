Page({
  data: {
    loading: false,
    latitude: null,  // 移除默认坐标
    longitude: null,
    markers: [],
    scale: 14,
    userInfo: null, // 确保已添加该数据字段
    currentTime: '00:00', // 初始化包含秒数
    checkinTime: '',           // 打卡完成时间
    currentAddress: '', // 合并重复的 currentAddress 字段
    labelAddress: '打卡地点：',  // 新增标签字段
    labelTime: '时间：',       // 新增标签字段
  },

  // 修改后的初始化逻辑
  onShow: function() {
    const app = getApp()
    console.log('[调试] 打卡tabBar-全局用户信息:', app.globalData.userInfo)
    console.log('[调试] 打卡tabBar-本地存储用户信息:', wx.getStorageSync('userInfo'))
    this.setData({
      userInfo: app.globalData.userInfo || wx.getStorageSync('userInfo'),
      // 清空旧位置数据
      latitude: null,
      longitude: null,
      markers: []
    }, () => {
      console.log('[调试] 打卡tabBar-当前用户信息:', this.data.userInfo)
    })
    // 简化的位置显示逻辑
    if (this.data.latitude && this.data.longitude) {
      this.setData({ 
        currentAddress: '已记录位置，可重新选择' 
      })
    }
  },

  // 修改后的选择位置逻辑
  // 优化位置选择逻辑
  chooseLocation: function() {
    return new Promise((resolve, reject) => {
      wx.chooseLocation({
        success: (res) => {
          // 添加数值校验
          if (typeof res.latitude !== 'number' || Math.abs(res.latitude) > 90) {
            reject(new Error('无效的纬度数值'))
            return
          }
          this.updateMapPosition(res.latitude, res.longitude)
          resolve(res)
        }
      })
    })
  },

  // 新增地图位置更新方法
  updateMapPosition: function(latitude, longitude) {
    this.setData({
      latitude,
      longitude,
      markers: [{
        id: 0,
        latitude,
        longitude,
        title: '打卡位置',
        iconPath: '/images/marker.png',
        width: 30,
        height: 30
      }]
    }, () => {
      // 添加地图刷新保障
      this.mapCtx = this.mapCtx || wx.createMapContext('map')
      this.mapCtx.moveToLocation()
    })
  },

  // 封装数据提交逻辑
  // 新增点击事件处理
  handleCheckIn: async function() {
    try {
      const location = await this.chooseLocation()
      await this.submitCheckIn(location)
    } catch (error) {
      wx.showToast({ title: error.message, icon: 'none' })
    }
  },

  // 优化提交逻辑
  submitCheckIn: async function(location) {
    // 添加坐标有效性校验
    if (!location || isNaN(location.latitude) || isNaN(location.longitude)) {
      wx.showToast({ title: '位置信息异常', icon: 'none' })
      return
    }
  
    // 优化时间处理
    const now = new Date()
    const checkinTime = `${now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')} ${this.formatTime(now)}`
    
    // 简化数据设置
    this.setData({
      checkinTime,
      currentAddress: location.address || location.name || '未知地址'
    })
  
    // 云数据库操作添加 try-catch
    try {
      const db = wx.cloud.database()
      await db.collection('station_checkin').add({
        data: {
          employeeID: this.data.userInfo.employeeID,
          name: this.data.userInfo.name,
          address_checkin: this.data.currentAddress,
          time_checkin: now,
          // coordinates: db.Geo.Point(
          //   parseFloat(location.latitude.toFixed(6)),
          //   parseFloat(location.longitude.toFixed(6))
          // )
        }
      })
      // 新增成功提示（在数据库操作成功后）
      await wx.showModal({
        title: '打卡成功',
        content: `时间：${checkinTime}\n地点：${this.data.currentAddress}`,
        showCancel: false,
        confirmText: '确定'
      })
    } catch (e) {
      console.error('数据库提交失败:', e)
      wx.showToast({ title: '打卡提交失败', icon: 'none' })
    }
  },

  // 优化时间格式化方法
  formatTime(date) {
    return [date.getHours(), date.getMinutes(), date.getSeconds()]
      .map(n => n.toString().padStart(2, '0'))
      .join(':')
  },

  // 时间更新逻辑
  updateTime() {
    this.setData({
      currentTime: this.formatTime(new Date()).replace(/:/g, '：') // 直接使用格式化后的完整时间
    })
  },
  // 新增生命周期函数
  onLoad: function() {
    this.timer = setInterval(() => {
      this.updateTime()
    }, 1000)
  },

  onUnload: function() {
    clearInterval(this.timer)
  },
  
})