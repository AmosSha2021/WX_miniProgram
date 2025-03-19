Page({
  data: {
    userInfo: null,
    showTip: false,
    title: '',
    content: ''
  },

  onShow() {
    this.setData({
      userInfo: getApp().globalData.userInfo || wx.getStorageSync('userInfo')
    });
  },

  // 统一跳转登录方法
  gotoLogin() {
    wx.navigateTo({ url: '/pages/login/login' });
  },

  // 优化客服对话框
  showServiceDialog() {
    this.setData({
      showTip: true,
      title: '技术支持',
      content: '工作时间：9:00-18:00\n联系电话：400-123-4567'
    });
  },

  // 其他原有方法保持不变...
});
