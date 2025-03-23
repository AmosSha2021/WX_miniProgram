Page({
  data: {
    employeeID: "",
    password: "",
    checked: false
  },

  onLoad() {
    if (wx.getStorageSync("checked")) {
      this.setData({
        employeeID: wx.getStorageSync("employeeID") || "",
        password: wx.getStorageSync("password") || "",
        checked: true
      });
    }
  },

  checkboxChange(e) {
    this.setData({ checked: e.detail.value });
    wx.setStorageSync('checked', e.detail.value);
  },

  eventEmployeeIDHandle(e) {
    this.setData({ employeeID: e.detail.value });
  },

  eventPasswordHandle(e) {
    this.setData({ password: e.detail.value });
  },

  onLoginHandle() {
    const { employeeID, password } = this.data;
    
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
          // 存储登录信息
          if (this.data.checked) {
            wx.setStorageSync('employeeID', employeeID);
            wx.setStorageSync('password', password);
          }
          
          // 存储完整用户信息
          const userInfo = res.result.data;
          getApp().globalData.userInfo = userInfo;
          wx.setStorageSync('userInfo', userInfo);

          wx.reLaunch({ url: '/pages/scanCode/scanCode' });
        } else {
          wx.showToast({ title: res.result.message || '登录失败', icon: 'error' });
        }
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({ title: '网络请求失败', icon: 'error' });
      }
    });
  },

  onRegisterHandle() {
    wx.navigateTo({ url: '/pages/register/register' });
  }
});