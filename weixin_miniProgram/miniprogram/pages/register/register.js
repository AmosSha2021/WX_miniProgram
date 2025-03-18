// pages/register/register.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    username: "",
    password: ""
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {

  },
  eventUsernameHandle(options) {
    this.setData({
      username: options.detail.value
    })

  },


  eventPasswordHandle(options) {
    this.setData({
      password: options.detail.value
    })
  },

    /**
   * 注册
   */
  onRegisterHandle() {
    if (this.data.username.trim() === '') {
      wx.showToast({
        title: '请输入用户名',
        icon: "error"
      })
      return
    }

    if (this.data.password.trim() === '') {
      wx.showToast({
        title: '请输入密码',
        icon: "error"
      })
      return
    }

    //保存用户名和密码
    wx.setStorageSync('username', this.data.username)
    wx.setStorageSync('password', this.data.password)

    wx.showToast({
      title: '注册成功',
      icon: 'success',
      success: () => {
          setTimeout(() => {
            wx.navigateBack({
              url:"/pages/login/login"
            })
          }, 1000);
      }
    })
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
  onShareAppMessage() {

  }
})