// 在Page对象中添加方法
Page({
  data: {
    userInfo: null, // 确保已添加该数据字段
    showTip: false,
    title: '',
    content: ''
  },

  // 补充完整的用户信息更新方法
  updateUserInfo() {
    const userInfo = wx.getStorageSync('userInfo');
    console.log('当前用户信息：', userInfo); // 调试日志
    this.setData({ userInfo });
  },

 getOpenId(){
    wx.redirectTo({
      url: '/pages/login/login',
    })
 },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    const app = getApp()
      // 增加调试日志
    console.log('[调试] 全局用户信息:', app.globalData.userInfo)
    console.log('[调试] 本地存储用户信息:', wx.getStorageSync('userInfo'))
    this.setData({
      userInfo: app.globalData.userInfo || wx.getStorageSync('userInfo')
    }, () => {
      console.log('[调试] 当前用户信息:', this.data.userInfo)
    })
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  // 新增客服对话框
  showServiceDialog() {
    wx.showModal({
      title: '开发：太仓同维ATE',
      content: '\n工作时间：9:00-18:00\n联系电话：400-123-4567',
      showCancel: false,
      confirmText: '知道了'
    })
  },

  // 新增分享二维码功能
  gotoWxCodePage() {
    wx.showModal({
      title: '太仓同维行政',
      content: '\n工作时间：9:00-18:00\n联系电话：400-123-4567',
      showCancel: false,
      confirmText: '知道了'
    }) 
  },

  // 新增分享功能配置
  onShareAppMessage() {
    // return {
    //   title: '邀请您使用我们的微信小程序',
    //   path: '/pages/index/index',
    //   imageUrl: '../../images/share_qrcode.jpg' // 分享卡片显示的二维码缩略图
    // }
  }
})