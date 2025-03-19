Page({
  data: {
    division: "",
    employeeID: "",
    name: "",
    password: "",
    phoneNum: ""
  },

  eventDivisionHandle(e) {
    this.setData({ division: e.detail.value });
  },

  eventEmployeeIDHandle(e) {
    this.setData({ employeeID: e.detail.value });
  },

  eventUsernameHandle(e) {
    this.setData({ name: e.detail.value });
  },

  eventPasswordHandle(e) {
    this.setData({ password: e.detail.value });
  },

  eventPhoneHandle(e) {
    this.setData({ phoneNum: e.detail.value });
  },

  onRegisterHandle() {
    const requiredFields = [
      { field: 'division', msg: '请输入部门' },
      { field: 'employeeID', msg: '请输入工号' },
      { field: 'name', msg: '请输入姓名' },
      { field: 'password', msg: '请输入密码' },
      { field: 'phoneNum', msg: '请输入手机号' }
    ];

    for (let {field, msg} of requiredFields) {
      if (!this.data[field]?.trim()) {
        wx.showToast({ title: msg, icon: 'error' });
        return;
      }
    }

    wx.showLoading({ title: '注册中...', mask: true });

    wx.cloud.callFunction({
      name: 'adduser',
      data: {
        userData: {
          division: this.data.division.trim(),
          employeeID: this.data.employeeID.trim(),
          name: this.data.name.trim(),
          password: this.data.password.trim(),
          phoneNum: this.data.phoneNum.trim()
        }
      },
      success: res => {
        wx.hideLoading();
        if (res.result.code === 200) {
          wx.showToast({
            title: '注册成功',
            success: () => {
              setTimeout(() => wx.navigateBack(), 1500);
            }
          });
        } else if (res.result.code === 4001) {
          wx.showToast({ title: '工号已存在', icon: 'error' });
        } else {
          wx.showToast({ title: '注册失败', icon: 'error' });
        }
      },
      fail: err => {
        wx.hideLoading();
        console.error('云函数调用失败:', err);
        wx.showToast({ title: '网络请求失败', icon: 'error' });
      }
    });
  }
});