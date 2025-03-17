// index.js
Page({
    data:{

    },
    onload(options){
        console.log(options)
    },
    handle_signup(){
        console.log("我被点击了")
    },
    handle_redirect(){
        wx.redirectTo({
          url: '/pages/login/login',
        })
    }
})