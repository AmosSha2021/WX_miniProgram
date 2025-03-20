Page({

  /**
   * 页面的初始数据
   */
  data: {
    userInfo: null // 确保已添加该数据字段
  },
  handle_signup(){
    console.log(this.data.userInfo)
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