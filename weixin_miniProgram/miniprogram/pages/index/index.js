Page({

  /**
   * 页面的初始数据
   */
  data: {
    userInfo: null, // 确保已添加该数据字段
    activityTypes: ['爬山', '篮球', '足球', '羽毛球', '乒乓球','马拉松'],
    selectedActivityType: null,
  },
  // 新增活动类型选择处理
  bindActivityTypeChange(e) {
    this.setData({
      selectedActivityType: e.detail.value
    })
  },
  // 修改提交方法
  async submitRegistration() {
    const { userInfo } = getApp().globalData;
    const { selectedActivityType, activityTypes } = this.data;
    
    if (!selectedActivityType) {
      wx.showToast({ title: '请选择活动类型', icon: 'none' });
      return;
    }
  
    try {
      // 新增校验查询
      const checkRes = await wx.cloud.database().collection('activity_register')
        .where({
          employeeID: userInfo.employeeID,
          activity_type: activityTypes[selectedActivityType]
        })
        .count();
  
      if (checkRes.total > 0) {
        wx.showModal({
          title: '提示',
          content: '您已报名过该活动',
          showCancel: false
        });
        return;
      }
  
      // 原上传逻辑
      await wx.cloud.database().collection('activity_register').add({
        data: {
          employeeID: userInfo.employeeID,
          name: userInfo.name,
          phoneNum: userInfo.phoneNum,
          activity_type: activityTypes[selectedActivityType]
        }
      });
      
      wx.showModal({
        title: '成功',
        content: '报名成功',
        showCancel: false
      });
    } catch (err) {
      wx.showToast({ title: '提交失败', icon: 'none' });
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    const app = getApp()
    // 增加调试日志
    console.log('[调试] 报名tabBar-全局用户信息:', app.globalData.userInfo)
    console.log('[调试] 报名tabBar-本地存储用户信息:', wx.getStorageSync('userInfo'))
    this.setData({
      userInfo: app.globalData.userInfo || wx.getStorageSync('userInfo')
    }, () => {
      console.log('[调试] 报名tabBar-当前用户信息:', this.data.userInfo)
    })
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    
  }
})