Page({
  data: {
    employeeID: "",
    password: "",
    checked: false
  },

  onLoad(options) {
    // 加载本地存储的登录信息
    if (wx.getStorageSync("checked")) {
      this.setData({
        employeeID: wx.getStorageSync("employeeID") || "",
        password: wx.getStorageSync("password") || "",
        checked: true
      });
    }
  },

  checkboxChange(event) {
    const checked = event.detail.value;
    this.setData({ checked });
    wx.setStorageSync('checked', checked);
    
    // 取消勾选时清除存储
    if (!checked) {
      wx.removeStorageSync('employeeID');
      wx.removeStorageSync('password');
    }
  },

  eventEmployeeIDHandle(e) {
    this.setData({ employeeID: e.detail.value });
  },

  eventPasswordHandle(e) {
    this.setData({ password: e.detail.value });
  },

  onLoginHandle() {
    const { employeeID, password, checked } = this.data;

    if (!employeeID.trim()) {
      wx.showToast({ title: '请输入工号', icon: 'error' });
      return;
    }
    if (!password.trim()) {
      wx.showToast({ title: '请输入密码', icon: 'error' });
      return;
    }

    wx.showLoading({ title: '登录中...', mask: true });

    wx.cloud.callFunction({
      name: 'login',
      data: { employeeID, password },
      success: res => {
        wx.hideLoading();
        if (res.result.code === 200) {
          // 记住密码处理
          if (checked) {
            wx.setStorageSync('employeeID', employeeID);
            wx.setStorageSync('password', password);
          } else {
            wx.removeStorageSync('employeeID');
            wx.removeStorageSync('password');
          }
          
          // 存储用户信息到全局和本地
          const userInfo = res.result.data;
          getApp().globalData.userInfo = userInfo;
          wx.setStorageSync('userInfo', userInfo);

          wx.reLaunch({ url: '/pages/index/index' });
        } else {
          wx.showToast({ title: res.result.message || '登录失败', icon: 'error' });
        }
      },
      fail: err => {
        wx.hideLoading();
        wx.showToast({ title: '网络请求失败', icon: 'error' });
      }
    });
  },

  onRegisterHandle() {
    wx.navigateTo({ url: '/pages/register/register' });
  },

  // ...保留其他生命周期函数...
});
