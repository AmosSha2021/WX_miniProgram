// app.js
const QQMapWX = require('/utils/qqmap-wx-jssdk.min.js')

App({
  onLaunch: function() {
    // 云开发初始化
    if (!wx.cloud) {
      console.error("请使用 2.2.3 或以上的基础库以使用云能力");
    } else {
      wx.cloud.init({
        env: "cloud1-2g3n9fug7efbe961",
        traceUser: true,
      });
    }

    // 全局数据初始化
    this.globalData = {
      user_info: null // 将在登录后赋值
    };
  },
});
